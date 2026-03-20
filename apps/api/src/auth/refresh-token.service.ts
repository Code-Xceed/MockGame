import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a new refresh token for a user */
  async create(userId: string): Promise<string> {
    const token = randomBytes(48).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });

    return token;
  }

  /** Validate and consume a refresh token (rotate) */
  async rotate(token: string): Promise<{ userId: string; newToken: string } | null> {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!existing) return null;
    if (existing.revokedAt) return null;
    if (existing.expiresAt < new Date()) return null;

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    // Issue new token
    const newToken = await this.create(existing.userId);

    return { userId: existing.userId, newToken };
  }

  /** Revoke all tokens for a user (logout everywhere) */
  async revokeAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Clean up expired tokens (call periodically) */
  async cleanup() {
    await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });
  }
}
