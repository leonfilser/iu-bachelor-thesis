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

  // POST /auth/register
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email already in use');
    }

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
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.password, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user.id, user.email);

    // Refresh Token (gehasht oder plain – hier gehasht) speichern:
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
        throw new UnauthorizedException('Invalid refresh token');
      }

      const refreshTokenMatches = await argon2.verify(
        user.refreshToken,
        dto.refreshToken,
      );

      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.issueTokens(user.id, user.email);

      const newHashedRefreshToken = await argon2.hash(tokens.refreshToken);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newHashedRefreshToken },
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
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
      data.email = dto.email;
    }
    if (dto.displayName !== undefined) {
      data.displayName = dto.displayName;
    }
    if (dto.password) {
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

  private readonly SHORT_CODE_WINDOW_MS = 60_000;
  private readonly SHORT_CODE_LENGTH = 6;
  private readonly SHORT_CODE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  private generateShortCode(userId: number) {
    const now = Date.now();
    const window = Math.floor(now / this.SHORT_CODE_WINDOW_MS);

    const secret = process.env.SHORT_CODE_SECRET || 'short-code-dev-secret';

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${userId}:${window}`);
    const digest = hmac.digest(); // Buffer

    let code = '';
    for (let i = 0; i < this.SHORT_CODE_LENGTH; i++) {
      const byte = digest[i];
      code += this.SHORT_CODE_CHARSET[byte % this.SHORT_CODE_CHARSET.length];
    }

    const validUntilMs = (window + 1) * this.SHORT_CODE_WINDOW_MS;

    return {
      code,
      expiresAt: new Date(validUntilMs),
    };
  }

  async getLinkCode(userId: number) {
    const { code, expiresAt } = this.generateShortCode(userId);

    // Wenn du willst, kannst du hier statt "code" auch
    // ein URL-Schema zurückgeben, z.B.: vrpair://pair?code=XYZ123&uid=42
    // Für jetzt bleiben wir beim reinen Code als Payload.

    return {
      code, // 6-stellig, z.B. "A7K9Z2"
      expiresAt: expiresAt.toISOString(), // für die UI, um den Countdown zu berechnen
      qrPayload: code, // Frontend nutzt das 1:1 für den QR-Code
    };
  }
}
