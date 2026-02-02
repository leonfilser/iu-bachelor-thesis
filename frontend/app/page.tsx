"use client"

import { useCallback, useEffect, useState } from "react"
import QRCode from "react-qr-code"
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassPlusIcon,
} from "@heroicons/react/24/solid"

// --------------------
// Typen & Konstanten
// --------------------

type ViewMode = "Login" | "Register" | "Profile"
type ScenarioID = "R2" | "A2" | "A3" | "A0" | null

interface ScenarioConfig {
  id: string
  title: string
  description: string
  type: "prompt" | "interface"
  initialView?: ViewMode
  showQR?: boolean
  showShort?: boolean
}

const SCENARIOS: Record<string, ScenarioConfig> = {
  R2: { 
    id: "R2", 
    title: "Szenario R2", 
    description: "",
    type: "interface", 
    initialView: "Register"
  },
  A2: { 
    id: "A2", 
    title: "Szenario A2", 
    description: "",
    type: "interface", 
    initialView: "Login", 
    showShort: true 
  },
  A3: { 
    id: "A3", 
    title: "Szenario A3", 
    description: "",
    type: "interface", 
    initialView: "Login", 
    showQR: true 
  },
  A0: { 
    id: "A0", 
    title: "Onboarding-Szenario", 
    description: "",
    type: "interface", 
    initialView: "Login", // ÄNDERUNG: Standardansicht ist jetzt Login
    showQR: true, 
    showShort: true 
  },
}

// --------------------
// UI Komponenten
// --------------------

const ToastNotification = ({
  message,
  type,
  onClose,
}: {
  message: string | null
  type: "success" | "error" | null
  onClose: () => void
}) => {
  useEffect(() => {
    if (!message) return
    // Timer: Nach 4 Sekunden ausblenden
    const timer = setTimeout(() => {
      onClose()
    }, 4000)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium shadow-md transition-all duration-300 ${
      type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
    }`}>
      <span>{message}</span>
    </div>
  )
}

const InputField = ({
  icon,
  type = "text",
  placeholder,
  value,
  name,
  onChange,
  disabled = false,
  isPassword = false,
}: any) => {
  const [showPassword, setShowPassword] = useState(false)
  const inputType = isPassword ? (showPassword ? "text" : "password") : type

  return (
    <div className="relative w-full">
      {icon && <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">{icon}</div>}
      <input
        type={inputType}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-lg border border-gray-300 bg-white py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 ${
          icon ? "pl-10" : "px-3"
        } ${isPassword ? "pr-10" : "pr-3"}`}
      />
      {isPassword && !disabled && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      )}
    </div>
  )
}

const Button = ({ onClick, disabled, variant = "primary", children, className = "", type = "button" }: any) => {
  const base = "flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  const variants: any = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
    dark: "bg-gray-800 text-white hover:bg-gray-900",
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

// --------------------
// Hauptlogik
// --------------------

export default function AuthPage() {
  const apiBaseUrl = "http://152.53.132.106:3000"

  // State Navigation & Logic
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioID>(null)
  
  // State UI
  const [view, setView] = useState<ViewMode>("Login")
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error" | null; msg: string | null }>({ type: null, msg: null })
  
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({ email: "", displayName: "", password: "", confirmPassword: "" })

  // Shortcode / QR
  const [shortCodeData, setShortCodeData] = useState<{ code: string; expiresAt: string; qrPayload: string } | null>(null)
  const [remainingSec, setRemainingSec] = useState<number | null>(null)
  const [isQrEnlarged, setIsQrEnlarged] = useState(false)

  // Berechnete Werte
  const currentConfig = activeScenarioId ? SCENARIOS[activeScenarioId] : null
  const showQrCode = currentConfig?.showQR
  const showShortCode = currentConfig?.showShort
  
  // --------------------
  // API & Handler
  // --------------------

  const showToast = useCallback((type: "success" | "error", msg: string) => setNotification({ type, msg }), [])
  
  const handleCloseNotification = useCallback(() => {
    setNotification({ type: null, msg: null })
  }, [])

  const apiRequest = useCallback(async (endpoint: string, method: string, body?: any) => {
    const token = localStorage.getItem("accessToken")
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(`${apiBaseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || "Ein Fehler ist aufgetreten")
    return data
  }, [])

  const resetAuthState = useCallback(() => {
    localStorage.clear()
    setUser(null)
    setFormData({ email: "", displayName: "", password: "", confirmPassword: "" })
    setShortCodeData(null)
  }, [])

  const fetchMe = useCallback(async () => {
    if (!localStorage.getItem("accessToken")) return
    try {
      const data = await apiRequest("/auth/me", "GET")
      setUser(data)
      setFormData(p => ({ ...p, email: data.email || "", displayName: data.displayName || "" }))
      setView("Profile")
    } catch {
      resetAuthState()
      if (currentConfig?.initialView) setView(currentConfig.initialView)
    }
  }, [apiRequest, resetAuthState, currentConfig])

  // Initial Check
  useEffect(() => { 
    if(activeScenarioId) fetchMe() 
  }, [fetchMe, activeScenarioId])

  // Manueller Logout Button
  const handleLogout = () => {
    resetAuthState()
    setView("Login")
    showToast("success", "Erfolgreich abgemeldet")
  }

  // --------------------
  // Szenario Steuerung
  // --------------------

  const handleSelectScenario = (id: string) => {
    resetAuthState()
    const config = SCENARIOS[id]
    
    // View setzen
    if (config.initialView) {
      setView(config.initialView)
    } else {
      setView("Login")
    }
    
    setActiveScenarioId(id as ScenarioID)
  }

  const handleFinishScenario = async () => {
    resetAuthState()
    setActiveScenarioId(null)
  }

  // --------------------
  // Timer & Shortcode/QR Fetcher
  // --------------------
  useEffect(() => {
    if (view !== "Profile" || (!showQrCode && !showShortCode)) return

    let interval: NodeJS.Timeout
    
    const loadCode = async () => {
      try {
        const data = await apiRequest("/auth/shortcode", "GET")
        setShortCodeData(data)
      } catch (e) { console.error(e) }
    }

    loadCode()

    interval = setInterval(() => {
      setShortCodeData(prev => {
        if (!prev) return prev
        const seconds = Math.floor((new Date(prev.expiresAt).getTime() - Date.now()) / 1000)
        setRemainingSec(seconds > 0 ? seconds : 0)
        if (seconds <= 0) loadCode()
        return prev
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [view, showQrCode, showShortCode, apiRequest])

  // --------------------
  // Form Handler
  // --------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (view === "Register") {
        if (formData.password !== formData.confirmPassword) throw new Error("Passwörter stimmen nicht überein.")
        
        await apiRequest("/auth/register", "POST", { ...formData })
        
        if (activeScenarioId === "R2") {
            showToast("success", "Erfolgreich registriert! Szenario R2 beendet.")
        } else {
            showToast("success", "Registriert! Bitte anmelden.")
        }
        
        setView("Login")
      } else {
        const data = await apiRequest("/auth/login", "POST", { email: formData.email, password: formData.password })
        localStorage.setItem("accessToken", data.accessToken)
        showToast("success", "Angemeldet!")
        await fetchMe()
      }
    } catch (err: any) {
      showToast("error", err.message)
    } finally {
      setLoading(false)
    }
  }

  // --------------------
  // Render Helpers
  // --------------------
  const TimerDisplay = () => (
    <div className="mt-2 text-center text-[10px] font-medium text-blue-200">
        Neu in <span className="font-mono text-white">{remainingSec ? String(remainingSec).padStart(2, '0') : "--"}s</span>
    </div>
  )

  // --------------------
  // MAIN RENDER
  // --------------------

  // 1. Dashboard (Start Screen)
  if (!activeScenarioId) {
    const scenarioList = ["R2", "A2", "A3", "A0"]

    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 font-sans text-gray-900 p-6">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-500 mb-8">Bitte wählen Sie das nächste Szenario</p>
        
        <div className="w-full max-w-md space-y-4">
          {scenarioList.map((id) => {
            const config = SCENARIOS[id]
            
            return (
              <button 
                key={id}
                onClick={() => handleSelectScenario(id)}
                className="w-full flex items-center justify-center p-5 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <span className="font-bold text-gray-800 text-lg group-hover:text-blue-600">
                    {config.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // 2. Active Scenario View
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 p-4 font-sans text-gray-900 pb-28">
      <ToastNotification type={notification.type} message={notification.msg} onClose={handleCloseNotification} />

      {/* QR Code Overlay (Zoom) */}
      {isQrEnlarged && shortCodeData && (
        <div 
            className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setIsQrEnlarged(false)}
        >
            <div className="rounded-2xl bg-white p-6 shadow-2xl">
                <QRCode value={shortCodeData.qrPayload} size={300} />
                <div className="mt-4 text-center text-sm font-medium text-gray-500">Zum Schließen klicken</div>
            </div>
        </div>
      )}

      {/* Szenario: Interface (R2, A2, A3, A0) */}
      {currentConfig?.type === "interface" && (
        <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl md:flex-row min-h-[500px]">
          
          {/* Linke Seite (Blau) */}
          <div className="flex w-full flex-col justify-between bg-blue-600 p-8 text-white md:w-5/12">
            <div>
              <h1 className="text-2xl font-bold">Anywhere Academy</h1>
              <p className="text-blue-100 text-sm">Avatarbasiertes Lehren und Lernen in VR</p>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center py-6 gap-4">
              {view === "Profile" && (showQrCode || showShortCode) ? (
                <div className="flex flex-col gap-4 w-full items-center">
                  
                  {/* QR Code Block */}
                  {showQrCode && (
                    <div className="w-full max-w-[200px] rounded-xl bg-white/10 p-3 border border-white/20 backdrop-blur-sm text-center">
                          <div className="text-xs text-blue-200 mb-2 uppercase font-bold tracking-wider">QR-Code Login</div>
                          
                          <div 
                           className="group relative mx-auto w-fit cursor-pointer rounded-lg bg-white p-3 transition-transform hover:scale-105" 
                           onClick={() => setIsQrEnlarged(true)}
                          >
                           {shortCodeData ? (
                               <QRCode value={shortCodeData.qrPayload} size={140} />
                           ) : (
                               <div className="h-[140px] w-[140px] bg-gray-200 animate-pulse rounded" />
                           )}
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 rounded-lg transition-opacity">
                               <MagnifyingGlassPlusIcon className="w-8 h-8 text-gray-900" />
                           </div>
                          </div>
                          
                          <div 
                           className="mt-2 flex items-center justify-center gap-1 text-[10px] font-medium text-blue-200 opacity-80 cursor-pointer hover:text-white hover:opacity-100 transition-colors"
                           onClick={() => setIsQrEnlarged(true)}
                          >
                             <MagnifyingGlassPlusIcon className="h-3 w-3" /> Zum Vergrößern klicken
                          </div>

                          {!showShortCode && <TimerDisplay />}
                    </div>
                  )}

                  {/* Shortcode Block */}
                  {showShortCode && (
                    <div className="w-full max-w-[200px] rounded-xl bg-white/10 p-3 border border-white/20 backdrop-blur-sm text-center">
                        <div className="text-xs text-blue-200 mb-1 uppercase font-bold tracking-wider">Kurzcode Login</div>
                        <div className="font-mono text-3xl font-bold tracking-widest text-white">{shortCodeData?.code || "..."}</div>
                        <TimerDisplay />
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-blue-50 text-sm leading-relaxed">
                  Anywhere Academy bietet eine Palette an vielseitig einsetzbaren VR-Umgebungen, die für die höhere Lehre konzipiert sind. 
                </div>
              )}
            </div>
          </div>

          {/* Rechte Seite (Formular) */}
          <div className="flex flex-1 flex-col justify-center p-8 md:p-12 bg-white">
            <h2 className="mb-6 text-xl font-bold text-gray-800">
              {view === "Login" && "Anmelden"}
              {view === "Register" && "Konto erstellen"}
              {view === "Profile" && "Mein Profil"}
            </h2>

            {view === "Profile" ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Angemeldet als</div>
                    <div className="font-medium text-gray-900">{user?.displayName || "Benutzer"}</div>
                    <div className="text-sm text-gray-600">{user?.email}</div>
                </div>
                <Button variant="secondary" onClick={handleLogout} className="w-full">
                  <ArrowRightOnRectangleIcon className="h-4 w-4" /> Abmelden
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {view === "Register" && (
                  <InputField
                    name="displayName"
                    placeholder="Anzeigename"
                    value={formData.displayName}
                    onChange={(e: any) => setFormData({ ...formData, displayName: e.target.value })}
                    icon={<UserIcon className="h-4 w-4" />}
                  />
                )}
                
                <InputField
                  name="email"
                  type="email"
                  placeholder="E-Mail Adresse"
                  value={formData.email}
                  onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                  icon={<EnvelopeIcon className="h-4 w-4" />}
                />

                <InputField
                  name="password"
                  isPassword
                  placeholder="Passwort"
                  value={formData.password}
                  onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
                  icon={<LockClosedIcon className="h-4 w-4" />}
                />

                {view === "Register" && (
                    <>
                      <InputField
                        name="confirmPassword"
                        isPassword
                        placeholder="Passwort wiederholen"
                        value={formData.confirmPassword}
                        onChange={(e: any) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        icon={<LockClosedIcon className="h-4 w-4" />}
                      />
                      <div className="px-1 text-[11px] leading-tight text-gray-500">
                        Mindestens 8 Zeichen, 1 Großbuchstaben, 1 Kleinbuchstaben, 1 Zahl, 1 Sonderzeichen.
                      </div>
                    </>
                )}

                <Button type="submit" disabled={loading} className="mt-2 w-full">
                  {view === "Login" ? "Anmelden" : "Registrieren"}
                </Button>

                <div className="mt-2 text-center text-xs text-gray-500">
                  <button
                    type="button"
                    onClick={() => {
                        setView(view === "Login" ? "Register" : "Login")
                        setFormData({ email: "", displayName: "", password: "", confirmPassword: "" })
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    {view === "Login" ? "Noch kein Konto? Registrieren" : "Bereits ein Konto? Anmelden"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="fixed bottom-8 left-0 right-0 mx-auto flex w-fit max-w-[90vw] items-center gap-6 rounded-2xl bg-white px-6 py-4 shadow-xl border border-gray-200 z-40">
        <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Aktives Szenario
            </span>
            <span className="text-base font-bold text-gray-800">
                {currentConfig?.title}
            </span>
        </div>
        
        <div className="h-10 w-px bg-gray-200 hidden sm:block"></div>

        <button 
            onClick={handleFinishScenario}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-gray-100 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
        >
            <ArrowLeftIcon className="h-4 w-4" /> Szenario beenden
        </button>
      </div>
    </div>
  )
}