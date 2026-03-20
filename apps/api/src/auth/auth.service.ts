import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshTokenService } from './refresh-token.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(input: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const hash = await bcrypt.hash(input.password, 10);
    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash: hash,
          displayName: input.displayName,
          examTrack: input.examTrack,
          role: UserRole.STUDENT,
          timezone: input.timezone,
          region: input.region,
        },
      });

      await tx.rating.create({
        data: {
          userId: user.id,
          examTrack: input.examTrack,
          hiddenMmr: 1200,
          visibleTier: 'Bronze',
          matchesPlayed: 0,
        },
      });

      return user;
    });

    return this.toAuthPayload(created.id, created.email, created.role);
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordOk = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.toAuthPayload(user.id, user.email, user.role);
  }

  async refresh(refreshToken: string) {
    const result = await this.refreshTokenService.rotate(refreshToken);
    if (!result) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: result.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken: result.newToken,
      tokenType: 'Bearer',
    };
  }

  async logout(userId: string) {
    await this.refreshTokenService.revokeAll(userId);
    return { message: 'Logged out from all devices' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        examTrack: true,
        timezone: true,
        region: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async toAuthPayload(userId: string, email: string, role: UserRole) {
    const token = this.jwtService.sign({
      sub: userId,
      email,
      role,
    });

    const refreshToken = await this.refreshTokenService.create(userId);

    return {
      accessToken: token,
      refreshToken,
      tokenType: 'Bearer',
    };
  }
}
