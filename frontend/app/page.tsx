"use client"

import { useCallback, useEffect, useState } from "react"
import QRCode from "react-qr-code"
import {
  ArrowTopRightOnSquareIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon,
  XMarkIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  FlagIcon,
  BackwardIcon,
  StopIcon,
  AcademicCapIcon, // Neu für die Intro-Seite
} from "@heroicons/react/24/solid"

// --- Typen & Konstanten ---

type User = {
  id: number
  email: string
  displayName: string
}

type LinkCodeResponse = {
  code: string
  expiresAt: string
  qrPayload: string
}

type ViewMode = "Login" | "Register" | "Profile"
type NotificationType = "success" | "error" | null

// Szenario Beschreibungen
const SCENARIOS: Record<number, { title: string; description: string }> = {
  1: {
    title: "VR-Only Registrierung",
    description: "In diesem Szenario nutzen Sie ausschließlich das VR-Headset. Registrieren Sie sich und loggen Sie sich direkt dort mithilfe der Controller oder Handgesten ein."
  },
  2: {
    title: "Web-Registrierung & VR-Login",
    description: "Erstellen Sie Ihr Konto hier im Web. Das Einloggen erfolgt anschließend manuell über die Tastatur im VR-Headset. Datenänderungen können Sie jederzeit hier vornehmen."
  },
  3: {
    title: "Login via Kurzcode",
    description: "Registrieren und loggen Sie sich hier ein. Nutzen Sie anschließend den angezeigten 6-stelligen Code, um Ihr Headset schnell und ohne Tippen zu verbinden."
  },
  4: {
    title: "Login via QR-Code",
    description: "Registrieren und loggen Sie sich hier ein. Scannen Sie danach einfach den QR-Code mit dem Headset, um sofort loszulegen."
  },
}

// Hilfsfunktion: Passwort-Stärke
const validatePassword = (pw: string) => {
  return {
    length: pw.length >= 8 && pw.length <= 64,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  }
}

const isPasswordSecure = (pw: string) => {
  const check = validatePassword(pw)
  return Object.values(check).every(Boolean)
}

// --- UI Komponenten ---

const ToastNotification = ({ type, message, onClose }: { type: NotificationType, message: string | null, onClose: () => void }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => onClose(), 3000)
      return () => clearTimeout(timer)
    }
  }, [message, onClose])

  if (!message || !type) return null
  const isError = type === "error"

  return (
    <div className="fixed top-48 left-0 right-0 mx-auto z-[100] flex w-fit min-w-[320px] max-w-md animate-[slideDown_0.3s_ease-out] items-center gap-3 rounded-full bg-white px-6 py-3 shadow-xl ring-1 ring-black/5">
      {isError ? <ExclamationCircleIcon className="h-6 w-6 text-red-500" /> : <CheckCircleIcon className="h-6 w-6 text-green-500" />}
      <div className="flex-1 text-sm font-medium text-gray-700">{message}</div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-4 w-4" /></button>
    </div>
  )
}

const ConfirmationModal = ({ isOpen, onConfirm, onCancel, title, message }: { isOpen: boolean, onConfirm: () => void, onCancel: () => void, title: string, message: string }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-[zoomIn_0.2s_ease-out]">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="rounded-full bg-red-100 p-3 text-red-600"><ExclamationTriangleIcon className="h-8 w-8" /></div>
          <div><h3 className="text-lg font-bold text-gray-900">{title}</h3><p className="mt-2 text-sm text-gray-500">{message}</p></div>
          <div className="mt-2 flex w-full gap-3">
            <button onClick={onCancel} className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Abbrechen</button>
            <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-200">Löschen bestätigen</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const InputField = ({ icon, type = "text", placeholder, value, name, onChange, disabled = false, readOnly = false, isPassword = false, actionButton, isValid = null }: any) => {
  const [showPassword, setShowPassword] = useState(false)
  const inputType = isPassword ? (showPassword ? "text" : "password") : type
  const borderColor = isValid === true ? "border-green-500 focus:border-green-500 focus:ring-green-100" : isValid === false ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
  const iconColor = isValid === true ? "text-green-500" : isValid === false ? "text-red-400" : "text-blue-400/80"

  return (
    <div className={`relative w-full transition-opacity ${disabled ? "opacity-60" : "opacity-100"}`}>
      {icon && <div className={`pointer-events-none absolute inset-y-0 left-4 flex items-center transition-colors ${iconColor}`}>{icon}</div>}
      <input type={inputType} name={name} placeholder={placeholder} value={value} onChange={onChange} disabled={disabled} readOnly={readOnly} className={`w-full rounded-xl border bg-gray-50 py-3 text-gray-700 shadow-sm transition-all placeholder:text-gray-400 ${borderColor} ${!readOnly && !disabled ? "bg-white focus:outline-none focus:ring-2" : "cursor-default border-transparent bg-gray-100/50"} ${icon ? "pl-11" : "px-4"} ${actionButton || isPassword ? "pr-12" : "pr-4"}`} />
      <div className="absolute inset-y-0 right-3 flex items-center gap-2">
        {isPassword && !disabled && (<button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-500 focus:outline-none">{showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button>)}
        {actionButton}
      </div>
    </div>
  )
}

const Button = ({ onClick, disabled, variant = "primary", children, type = "button", className = "" }: any) => {
  const base = "flex items-center justify-center gap-2 rounded-full px-6 py-2.5 font-medium transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50"
  const variants: any = {
    primary: "bg-blue-500 text-white shadow-blue-200 hover:bg-blue-600 shadow-lg hover:shadow-xl",
    secondary: "bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-transparent",
    ghost: "text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 bg-transparent",
    dark: "bg-gray-800 text-white hover:bg-gray-900 shadow-lg",
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {disabled && variant === "primary" ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
      {children}
    </button>
  )
}

const PasswordRequirements = ({ password, confirmPassword }: { password: string, confirmPassword?: string }) => {
  if (!password) return null
  const status = validatePassword(password)
  const match = confirmPassword !== undefined ? (password === confirmPassword && confirmPassword.length > 0) : true
  const Item = ({ met, text }: { met: boolean, text: string }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors ${met ? "text-green-600" : "text-gray-400"}`}>
      {met ? <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" /> : <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-gray-300" />}
      <span>{text}</span>
    </div>
  )
  return (
    <div className="grid grid-cols-1 gap-y-1 gap-x-4 px-2 pt-1 sm:grid-cols-2 animate-[fadeIn_0.3s_ease-out]">
      <Item met={status.length} text="8-64 Zeichen" />
      <Item met={status.upper} text="1 Großbuchstabe" />
      <Item met={status.lower} text="1 Kleinbuchstabe" />
      <Item met={status.number} text="1 Zahl" />
      <Item met={status.special} text="1 Sonderzeichen" />
      {confirmPassword !== undefined && <Item met={match} text="Passwörter stimmen überein" />}
    </div>
  )
}

const ProfileField = ({ label, fieldKey, icon, formData, editingField, user, setEditingField, setFormData, handleUpdateProfile, handleInputChange }: any) => {
  const isEditing = fieldKey === editingField
  return (
    <div className="group relative">
      <label className="mb-1 ml-1 block text-xs font-medium text-gray-500">{label}</label>
      <InputField
        name={fieldKey} type={fieldKey === "email" ? "email" : "text"} icon={icon} placeholder={label} value={formData[fieldKey]} onChange={handleInputChange} readOnly={!isEditing} disabled={!isEditing && editingField !== "none"}
        actionButton={isEditing ? (
            <div className="flex items-center gap-1">
              <button onClick={() => handleUpdateProfile(fieldKey)} className="rounded-full bg-blue-500 p-1.5 text-white shadow-md hover:bg-blue-600" title="Speichern"><CheckIcon className="h-4 w-4" /></button>
              <button onClick={() => { setEditingField("none"); setFormData((prev: any) => ({...prev, [fieldKey]: user ? user[fieldKey] : ""})) }} className="rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200" title="Abbrechen"><XMarkIcon className="h-4 w-4" /></button>
            </div>
          ) : (
            <button onClick={() => setEditingField(fieldKey)} className="invisible p-1 text-gray-400 hover:text-blue-500 group-hover:visible"><PencilIcon className="h-4 w-4" /></button>
          )
        }
      />
    </div>
  )
}

// --- Hauptkomponente ---

export default function AuthPage() {
  const apiBaseUrl = "http://localhost:8080"
  
  // App Logic States
  const [view, setView] = useState<ViewMode>("Login")
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{ type: NotificationType; msg: string | null }>({ type: null, msg: null })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({ email: "", displayName: "", password: "", confirmPassword: "" })
  const [editingField, setEditingField] = useState<"none" | "displayName" | "email" | "password">("none")
  const [linkCode, setLinkCode] = useState<LinkCodeResponse | null>(null)
  const [remainingSec, setRemainingSec] = useState<number | null>(null)

  // Evaluation States
  const [showIntro, setShowIntro] = useState(true) // Startet mit Intro
  const [scenarioOrder, setScenarioOrder] = useState<number[]>([]) 
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0)
  
  // Start-Funktion (Randomisiert HIER, nicht beim Laden der Seite)
  const startEvaluation = () => {
    const shuffled = [1, 2, 3, 4].sort(() => Math.random() - 0.5)
    setScenarioOrder(shuffled)
    setCurrentScenarioIndex(0)
    setShowIntro(false)
  }

  const currentScenario = scenarioOrder[currentScenarioIndex] || 0 // Fallback für Typesafety
  const isEvaluationFinished = !showIntro && currentScenarioIndex >= scenarioOrder.length
  
  // Helper Variablen für UI
  const showMainCard = !showIntro && !isEvaluationFinished && currentScenario !== 1 
  const showQrCode = currentScenario === 4
  const showShortCode = currentScenario === 3

  const closeToast = useCallback(() => setNotification({ type: null, msg: null }), [])
  const showToast = useCallback((type: "success" | "error", msg: string) => setNotification({ type, msg }), [])
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value })), [])
  const getToken = () => localStorage.getItem("accessToken")

  const passwordSecure = isPasswordSecure(formData.password)
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0
  const formValid = passwordSecure && passwordsMatch

  const apiRequest = async (endpoint: string, method: string, body?: any) => {
    const token = getToken()
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`${apiBaseUrl}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || "Fehler aufgetreten")
    return data
  }

  const silentReset = async () => {
    try {
      const token = getToken()
      if (token) {
        await fetch(`${apiBaseUrl}/auth/me`, { 
            method: "DELETE", 
            headers: { Authorization: `Bearer ${token}` } 
        })
      }
    } catch (e) { /* ignore */ }
    localStorage.clear()
    setUser(null)
    setView("Login")
    setEditingField("none")
    setFormData({ email: "", displayName: "", password: "", confirmPassword: "" })
  }

  const handleScenarioSwitch = async (direction: "next" | "prev") => {
    await silentReset()
    if (direction === "next") {
        setCurrentScenarioIndex(prev => prev + 1)
    } else {
        setCurrentScenarioIndex(prev => Math.max(0, prev - 1))
    }
  }

  const fetchMe = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      const data = await apiRequest("/auth/me", "GET")
      setUser(data)
      setFormData(prev => ({ ...prev, email: data.email || "", displayName: data.displayName || "" }))
      setView("Profile")
    } catch { handleLogout() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.clear()
    setUser(null)
    setView("Login")
    setEditingField("none")
    setFormData({ email: "", displayName: "", password: "", confirmPassword: "" })
    showToast("success", "Erfolgreich abgemeldet")
  }, [showToast])

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (view === "Register") {
        if (!passwordSecure) throw new Error("Passwort erfüllt nicht die Sicherheitsanforderungen.")
        if (!passwordsMatch) throw new Error("Passwörter stimmen nicht überein.")
        await apiRequest("/auth/register", "POST", formData)
        showToast("success", "Registrierung erfolgreich! Bitte anmelden.")
        setView("Login")
        setFormData(prev => ({...prev, password: "", confirmPassword: ""}))
      } else if (view === "Login") {
        const data = await apiRequest("/auth/login", "POST", { email: formData.email, password: formData.password })
        localStorage.setItem("accessToken", data.accessToken)
        localStorage.setItem("refreshToken", data.refreshToken)
        showToast("success", "Willkommen zurück!")
        await fetchMe()
      }
    } catch (err: any) { showToast("error", err.message) } 
    finally { setLoading(false) }
  }

  const confirmDeleteProfile = async () => {
    setLoading(true)
    setShowDeleteModal(false)
    try {
      await apiRequest("/auth/me", "DELETE")
      localStorage.clear()
      setUser(null)
      setView("Login")
      setEditingField("none")
      setFormData({ email: "", displayName: "", password: "", confirmPassword: "" })
      showToast("success", "Ihr Profil wurde erfolgreich gelöscht")
    } catch (err: any) { showToast("error", err.message) } 
    finally { setLoading(false) }
  }

  const handleUpdateProfile = async (field: "displayName" | "email" | "password") => {
    setLoading(true)
    try {
      const payload: any = {}
      if (field === "password") {
        if (!passwordSecure) throw new Error("Passwort unsicher")
        if (!passwordsMatch) throw new Error("Passwörter stimmen nicht überein")
        payload.password = formData.password
      } else {
        payload[field] = formData[field as keyof typeof formData]
      }
      await apiRequest("/auth/me", "PATCH", payload)
      let successMsg = "Erfolgreich gespeichert"
      if (field === "password") successMsg = "Passwort erfolgreich aktualisiert"
      if (field === "displayName") successMsg = "Anzeigename erfolgreich aktualisiert"
      if (field === "email") successMsg = "E-Mail Adresse erfolgreich aktualisiert"
      showToast("success", successMsg)
      setEditingField("none")
      if(field === "password") setFormData(prev => ({...prev, password: "", confirmPassword: ""}))
      else await fetchMe()
    } catch (err: any) { showToast("error", err.message) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMe() }, [fetchMe])

  useEffect(() => {
    if (view !== "Profile") return
    let interval: NodeJS.Timeout
    const loadCode = async () => { try { const data = await apiRequest("/auth/link-code", "GET"); setLinkCode(data) } catch (e) { console.error(e) } }
    loadCode()
    const tick = setInterval(() => {
      setLinkCode(prev => {
        if(!prev) return null
        const secs = Math.max(0, Math.floor((new Date(prev.expiresAt).getTime() - Date.now()) / 1000))
        setRemainingSec(secs)
        if (secs <= 0) loadCode()
        return prev
      })
    }, 1000)
    return () => clearInterval(tick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  // --- RENDERING ---

  // 1. INTRO SCREEN
  if (showIntro) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F3F4F6] p-4 font-sans text-gray-900">
        <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-6 rounded-3xl bg-white p-12 text-center shadow-2xl animate-[fadeIn_0.5s_ease-out]">
          <div className="rounded-full bg-blue-100 p-6 text-blue-600">
             <AcademicCapIcon className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Willkommen</h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
            Im Rahmen meiner Bachelorarbeit evaluiere ich verschiedene Authentifizierungsmethoden für Virtual-Reality-Umgebungen.
            <br/><br/>
            Es folgen <strong>4 Szenarien</strong>, die Sie nacheinander durchlaufen. Bitte lesen Sie die Anweisungen zu jedem Szenario sorgfältig durch.
          </p>
          <div className="mt-4">
             <Button onClick={startEvaluation} className="px-8 py-3 text-lg shadow-xl shadow-blue-200">
                Evaluierung starten <PlayIcon className="ml-2 h-5 w-5" />
             </Button>
          </div>
        </div>
      </div>
    )
  }

  // 2. EVALUATION UI
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F3F4F6] p-4 font-sans text-gray-900">
      <ToastNotification type={notification.type} message={notification.msg} onClose={closeToast} />
      <ConfirmationModal isOpen={showDeleteModal} title="Profil löschen?" message="Möchten Sie Ihr Profil wirklich unwiderruflich löschen?" onCancel={() => setShowDeleteModal(false)} onConfirm={confirmDeleteProfile} />
      
      {/* --- Evaluation Header --- */}
      <div className="mb-8 flex flex-col items-center animate-[slideDown_0.5s_ease-out] w-full max-w-3xl z-20">
         {isEvaluationFinished ? (
           <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-xl border border-blue-100">
              <FlagIcon className="h-12 w-12 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-800">Evaluation beendet</h2>
              <p className="text-gray-500">Vielen Dank für die Teilnahme an der Studie.</p>
              <Button onClick={() => window.location.reload()} variant="secondary" className="mt-2">Zurück zum Start</Button>
           </div>
         ) : (
           <div className="flex items-center justify-between w-full rounded-2xl bg-white px-6 py-6 shadow-lg border border-gray-100 gap-6">
             {/* Previous */}
             <button 
                onClick={() => handleScenarioSwitch("prev")}
                disabled={currentScenarioIndex === 0}
                className="p-3 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                title="Vorheriges Szenario"
             >
                <BackwardIcon className="h-6 w-6" />
             </button>

             {/* Info Text */}
             <div className="flex flex-col items-center text-center flex-1">
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-1">
                  Szenario {currentScenarioIndex + 1} von 4
                </span>
                <span className="text-xl font-bold text-blue-600 leading-tight mb-2">
                    {SCENARIOS[currentScenario]?.title}
                </span>
                <p className="text-sm text-gray-600 leading-relaxed">
                    {SCENARIOS[currentScenario]?.description}
                </p>
             </div>
             
             {/* Next / Finish */}
             <Button variant="dark" onClick={() => handleScenarioSwitch("next")} className="px-6 py-2.5 text-sm shrink-0">
                {currentScenarioIndex === 3 ? "Beenden" : "Weiter"} 
                {currentScenarioIndex === 3 ? <StopIcon className="h-4 w-4 ml-2" /> : <PlayIcon className="h-4 w-4 ml-2" />}
             </Button>
           </div>
         )}
      </div>

      {/* --- Main Card --- */}
      {showMainCard && (
        <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl md:flex-row animate-[zoomIn_0.3s_ease-out]">
          
          {/* LEFT PANEL */}
          <div className="relative flex flex-1 flex-col justify-between overflow-hidden bg-blue-600 p-8 text-white md:p-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500 opacity-50 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500 opacity-50 blur-3xl" />
            <div className="relative z-10">
              <h1 className="text-3xl font-bold tracking-tight">Anywhere Academy</h1>
              <p className="mt-2 text-blue-100">Immersives Lernen in VR</p>
            </div>
            
            <div className="relative z-10 mt-8 flex flex-1 flex-col items-center justify-center">
              {view === "Profile" && currentScenario !== 2 ? (
                <div className="w-full max-w-xs rounded-2xl bg-white/10 p-6 backdrop-blur-md border border-white/20 text-center transition-all duration-500">
                  
                  {/* S4: QR Code Only */}
                  {showQrCode && (
                    <div className="mx-auto mb-4 w-fit rounded-xl bg-white p-3 shadow-lg">
                      {linkCode ? (
                           <QRCode value={linkCode.qrPayload} size={140} />
                      ) : (
                        <div className="h-[140px] w-[140px] animate-pulse bg-gray-200 rounded-lg" />
                      )}
                    </div>
                  )}

                  {/* S3: Kurzcode Only */}
                  {showShortCode && (
                    <>
                      <div className="font-mono text-3xl font-bold tracking-widest">{linkCode?.code || "..."}</div>
                      <div className="text-xs text-blue-200 mt-1">Code läuft ab in {remainingSec ? String(Math.floor(remainingSec / 60)).padStart(2,"0")+":"+String(remainingSec % 60).padStart(2,"0") : "--:--"}</div>
                    </>
                  )}

                </div>
              ) : (
                // Standardansicht für Login/Register UND Szenario 2
                <div className="space-y-6 text-center md:text-left">
                  <p className="max-w-md text-lg leading-relaxed text-blue-50">Verbinde dich mit deinem Avatar, betritt virtuelle Klassenräume und lerne gemeinsam mit anderen.</p>
                  <a href="https://anywhere.academy" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-medium backdrop-blur-sm transition hover:bg-white/20">Mehr erfahren <ArrowTopRightOnSquareIcon className="h-4 w-4" /></a>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex flex-1 flex-col justify-center bg-white p-8 md:p-16">
            <div className="mx-auto w-full max-w-sm">
              <div className="mb-8"><h2 className="text-2xl font-bold text-gray-900">{view === "Login" && "Willkommen zurück"}{view === "Register" && "Konto erstellen"}{view === "Profile" && "Profileinstellungen"}</h2></div>
              
              {view === "Profile" ? (
                <div className="flex flex-col gap-5 animate-[fadeIn_0.5s_ease-out]">
                  {editingField !== "password" && (
                    <>
                      <ProfileField label="Anzeigename (Optional)" fieldKey="displayName" icon={<UserIcon className="h-5 w-5" />} formData={formData} editingField={editingField} user={user} setEditingField={setEditingField} setFormData={setFormData} handleUpdateProfile={handleUpdateProfile} handleInputChange={handleInputChange} />
                      <ProfileField label="E-Mail Adresse" fieldKey="email" icon={<EnvelopeIcon className="h-5 w-5" />} formData={formData} editingField={editingField} user={user} setEditingField={setEditingField} setFormData={setFormData} handleUpdateProfile={handleUpdateProfile} handleInputChange={handleInputChange} />
                    </>
                  )}
                  {editingField === "password" ? (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-blue-900">Passwort ändern</h3>
                      <div className="space-y-3">
                        <InputField name="password" type="password" placeholder="Neues Passwort" value={formData.password} onChange={handleInputChange} isPassword icon={<KeyIcon className="h-5 w-5"/>} isValid={formData.password.length > 0 ? passwordSecure : null} />
                        <div className="animate-[fadeIn_0.2s_ease-out]"><InputField name="confirmPassword" type="password" placeholder="Passwort wiederholen" value={formData.confirmPassword} onChange={handleInputChange} isPassword icon={<KeyIcon className="h-5 w-5"/>} isValid={formData.confirmPassword.length > 0 ? passwordsMatch : null} /></div>
                        <PasswordRequirements password={formData.password} confirmPassword={formData.confirmPassword} />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button onClick={() => handleUpdateProfile("password")} disabled={loading || !formValid} className="flex-1 text-sm">Speichern</Button>
                        <Button variant="secondary" onClick={() => setEditingField("none")} className="flex-1 text-sm">Abbrechen</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-6">
                      <Button variant="secondary" onClick={() => setEditingField("password")}><KeyIcon className="h-4 w-4" /> Passwort ändern</Button>
                      <div className="grid grid-cols-2 gap-3">
                          <Button variant="ghost" onClick={handleLogout}><ArrowRightOnRectangleIcon className="h-4 w-4" /> Abmelden</Button>
                          <Button variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setShowDeleteModal(true)}><TrashIcon className="h-4 w-4" /> Löschen</Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 animate-[fadeIn_0.5s_ease-out]">
                  {view === "Register" && <InputField name="displayName" placeholder="Anzeigename (Optional)" value={formData.displayName} onChange={handleInputChange} icon={<UserIcon className="h-5 w-5" />} />}
                  <InputField name="email" type="email" placeholder="E-Mail Adresse" value={formData.email} onChange={handleInputChange} icon={<EnvelopeIcon className="h-5 w-5" />} />
                  <div className="space-y-3">
                      <InputField name="password" type="password" placeholder="Passwort" value={formData.password} onChange={handleInputChange} isPassword icon={<LockClosedIcon className="h-5 w-5" />} isValid={view === "Register" && formData.password.length > 0 ? passwordSecure : null} />
                      {view === "Register" && (
                          <>
                              <div className="animate-[fadeIn_0.2s_ease-out]"><InputField name="confirmPassword" type="password" placeholder="Passwort wiederholen" value={formData.confirmPassword} onChange={handleInputChange} isPassword icon={<LockClosedIcon className="h-5 w-5" />} isValid={formData.confirmPassword.length > 0 ? passwordsMatch : null} /></div>
                              <PasswordRequirements password={formData.password} confirmPassword={formData.confirmPassword} />
                          </>
                      )}
                  </div>
                  <div className="mt-4"><Button type="submit" disabled={loading || (view === "Register" && !formValid)} className="w-full">{loading ? "Verarbeite..." : (view === "Login" ? "Anmelden" : "Registrieren")}</Button></div>
                  <div className="mt-2 text-center text-sm text-gray-500">{view === "Login" ? "Neu hier? " : "Bereits ein Konto? "}<button type="button" onClick={() => { setView(view === "Login" ? "Register" : "Login"); setFormData({ email: "", displayName: "", password: "", confirmPassword: "" }) }} className="font-semibold text-blue-600 hover:underline">{view === "Login" ? "Jetzt registrieren" : "Hier anmelden"}</button></div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}