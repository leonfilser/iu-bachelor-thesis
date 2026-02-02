import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtPayload } from './jwt-payload.interface';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ---------------------------------------------------------
  // VALIDIERUNGS-LOGIK (NEU)
  // ---------------------------------------------------------

  /**
   * Prüft das Format der E-Mail-Adresse
   */
  private validateEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Die angegebene E-Mail-Adresse ist ungültig.');
    }
  }

  /**
   * Prüft die Passwort-Komplexität:
   * - Min. 8 Zeichen
   * - 1 Großbuchstabe, 1 Kleinbuchstabe
   * - 1 Zahl
   * - 1 Sonderzeichen
   */
  private validatePassword(password: string) {
    const minLength = 8;
    // Regex Erklärung:
    // (?=.*[a-z]) -> Mindestens ein Kleinbuchstabe
    // (?=.*[A-Z]) -> Mindestens ein Großbuchstabe
    // (?=.*\d)    -> Mindestens eine Zahl
    // (?=.*[\W_]) -> Mindestens ein Sonderzeichen
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!strongPasswordRegex.test(password)) {
      throw new BadRequestException(
        `Das Passwort ist zu schwach. Es muss mindestens ${minLength} Zeichen lang sein und jeweils einen Großbuchstaben, einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten.`
      );
    }
  }

  // ---------------------------------------------------------
  // ENDPOINTS
  // ---------------------------------------------------------

  // POST /auth/register
  async register(dto: RegisterDto) {
    // 1. Validierung (NEU)
    this.validateEmail(dto.email);
    this.validatePassword(dto.password);

    // 2. Prüfen ob User existiert
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Diese E-Mail-Adresse wird bereits verwendet.');
    }

    // 3. User anlegen
    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        displayName: dto.displayName ?? null,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    });

    return user;
  }

  // POST /auth/login
  async login(dto: LoginDto) {
    // Hier prüfen wir nur grob, ob Felder da sind, keine strenge Passwort-Policy,
    // um User Enumeration Attacks nicht zu erleichtern bzw. alte Passwörter noch zuzulassen.
    if (!dto.email || !dto.password) {
        throw new BadRequestException('Bitte E-Mail und Passwort angeben.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Ungültige Zugangsdaten');
    }

    const passwordValid = await argon2.verify(user.password, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Ungültige Zugangsdaten');
    }

    const tokens = await this.issueTokens(user.id, user.email);

    // Refresh Token speichern (gehasht)
    const hashedRefreshToken = await argon2.hash(tokens.refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      ...tokens,
    };
  }

  // POST /auth/refresh
  async refresh(dto: RefreshDto) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        },
      );

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Ungültiger Refresh-Token');
      }

      const refreshTokenMatches = await argon2.verify(
        user.refreshToken,
        dto.refreshToken,
      );

      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Ungültiger Refresh-Token');
      }

      const tokens = await this.issueTokens(user.id, user.email);

      const newHashedRefreshToken = await argon2.hash(tokens.refreshToken);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newHashedRefreshToken },
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Ungültiger Refresh-Token');
    }
  }

  // POST /auth/logout
  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { success: true };
  }

  // GET /auth/me
  async getMe(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // PATCH /auth/me
  async updateMe(userId: number, dto: UpdateUserDto) {
    const data: any = {};

    if (dto.email) {
      // Validierung bei Update (NEU)
      this.validateEmail(dto.email);
      
      // Prüfen ob die neue Email schon von JEMAND ANDEREM verwendet wird
      const existing = await this.prisma.user.findUnique({
          where: { email: dto.email }
      });
      // Wenn es einen User gibt UND es nicht der aktuelle User ist -> Fehler
      if (existing && existing.id !== userId) {
          throw new BadRequestException('Diese E-Mail-Adresse wird bereits verwendet.');
      }
      
      data.email = dto.email;
    }

    if (dto.displayName !== undefined) {
      data.displayName = dto.displayName;
    }

    if (dto.password) {
      // Validierung bei Update (NEU)
      this.validatePassword(dto.password);
      data.password = await argon2.hash(dto.password);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  // DELETE /auth/me
  async deleteMe(userId: number) {
    await this.prisma.user.delete({
      where: { id: userId },
    });
    return { success: true };
  }

  // Hilfsfunktion: Access + Refresh Token ausstellen
  private async issueTokens(userId: number, email: string) {
    const payload: JwtPayload = { sub: userId, email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'access-secret',
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 15 * 60, // Sekunden
    };
  }

  // ---------------------------
  // Shortcode: on-demand + RAM
  // ---------------------------

  private readonly SHORT_CODE_TTL_MS = 90_000; // 90s
  private readonly SHORT_CODE_LENGTH = 6;

  // NUR ZIFFERN
  private readonly SHORT_CODE_CHARSET = '0123456789';

  // RAM-Store: code -> { userId, expiresAt }
  private readonly shortCodeStore = new Map<
    string,
    { userId: number; expiresAt: number }
  >();

  private cleanupExpiredShortCodes() {
    const now = Date.now();
    for (const [code, entry] of this.shortCodeStore.entries()) {
      if (entry.expiresAt <= now) {
        this.shortCodeStore.delete(code);
      }
    }
  }

  private generateShortCode() {
    // simpel, zufällig, 6-stellig, NUR ZIFFERN
    const bytes = crypto.randomBytes(this.SHORT_CODE_LENGTH);
    let code = '';
    for (let i = 0; i < this.SHORT_CODE_LENGTH; i++) {
      code +=
        this.SHORT_CODE_CHARSET[bytes[i] % this.SHORT_CODE_CHARSET.length];
    }
    return code;
  }

  // GET /auth/shortcode
  async getShortCode(userId: number) {
    this.cleanupExpiredShortCodes();

    let code = this.generateShortCode();
    while (this.shortCodeStore.has(code)) {
      code = this.generateShortCode();
    }

    const expiresAtMs = Date.now() + this.SHORT_CODE_TTL_MS;
    this.shortCodeStore.set(code, { userId, expiresAt: expiresAtMs });

    return {
      code,
      expiresAt: new Date(expiresAtMs).toISOString(),
      qrPayload: code,
    };
  }

  // POST /auth/shortcode
  async authenticateWithShortCode(code: string) {
    if (!code) {
      throw new BadRequestException('Code ist erforderlich');
    }

    // optional: einfache Validierung, da nur Ziffern erlaubt sind
    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('Code muss aus 6 Ziffern bestehen');
    }

    this.cleanupExpiredShortCodes();

    const entry = this.shortCodeStore.get(code);
    if (!entry) {
      throw new UnauthorizedException('Code ist ungültig oder abgelaufen');
    }

    if (entry.expiresAt <= Date.now()) {
      this.shortCodeStore.delete(code);
      throw new UnauthorizedException('Code ist ungültig oder abgelaufen');
    }

    // One-time use
    this.shortCodeStore.delete(code);

    const user = await this.prisma.user.findUnique({
      where: { id: entry.userId },
      select: { id: true, email: true, displayName: true },
    });

    if (!user) {
      throw new UnauthorizedException('Code ist ungültig oder abgelaufen');
    }

    const tokens = await this.issueTokens(user.id, user.email);

    // RefreshToken speichern, damit Refresh später funktioniert
    const hashedRefreshToken = await argon2.hash(tokens.refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      ...tokens,
    };
  }
}