import { Injectable } from '@nestjs/common';
import { AntiCheatSeverity, MatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const PAGE_SIZE = 20;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalUsers,
      totalMatches,
      activeMatches,
      completedMatches,
      cancelledMatches,
      totalQuestions,
      activeQuestions,
      unresolvedFlags,
      highSeverityFlags,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.match.count(),
      this.prisma.match.count({ where: { status: MatchStatus.ACTIVE } }),
      this.prisma.match.count({ where: { status: MatchStatus.COMPLETED } }),
      this.prisma.match.count({ where: { status: MatchStatus.CANCELLED } }),
      this.prisma.question.count(),
      this.prisma.question.count({ where: { isActive: true } }),
      this.prisma.antiCheatFlag.count({ where: { resolvedAt: null } }),
      this.prisma.antiCheatFlag.count({
        where: { resolvedAt: null, severity: AntiCheatSeverity.HIGH },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
      },
      matches: {
        total: totalMatches,
        active: activeMatches,
        completed: completedMatches,
        cancelled: cancelledMatches,
      },
      questions: {
        total: totalQuestions,
        active: activeQuestions,
      },
      antiCheat: {
        unresolved: unresolvedFlags,
        highSeverity: highSeverityFlags,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async listUsers(cursor?: string) {
    const items = await this.prisma.user.findMany({
      take: PAGE_SIZE + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        examTrack: true,
        region: true,
        timezone: true,
        createdAt: true,
        ratings: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: {
            hiddenMmr: true,
            visibleTier: true,
            matchesPlayed: true,
            updatedAt: true,
          },
        },
      },
    });

    const hasMore = items.length > PAGE_SIZE;
    const data = hasMore ? items.slice(0, PAGE_SIZE) : items;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    };
  }

  async listMatches(cursor?: string) {
    const items = await this.prisma.match.findMany({
      take: PAGE_SIZE + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        examTrack: true,
        status: true,
        playerAId: true,
        playerBId: true,
        playerAScore: true,
        playerBScore: true,
        winnerId: true,
        createdAt: true,
        startedAt: true,
        endedAt: true,
        playerA: {
          select: {
            id: true,
            displayName: true,
          },
        },
        playerB: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    const hasMore = items.length > PAGE_SIZE;
    const data = hasMore ? items.slice(0, PAGE_SIZE) : items;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    };
  }

  async listQuestions(cursor?: string, includeInactive = false) {
    const items = await this.prisma.question.findMany({
      where: includeInactive ? {} : { isActive: true },
      take: PAGE_SIZE + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        examTrack: true,
        subject: true,
        difficulty: true,
        body: true,
        correctOption: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const hasMore = items.length > PAGE_SIZE;
    const data = hasMore ? items.slice(0, PAGE_SIZE) : items;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    };
  }

  async listAntiCheatFlags(cursor?: string) {
    const items = await this.prisma.antiCheatFlag.findMany({
      take: PAGE_SIZE + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        match: {
          select: {
            id: true,
            examTrack: true,
            status: true,
          },
        },
      },
    });

    const hasMore = items.length > PAGE_SIZE;
    const data = hasMore ? items.slice(0, PAGE_SIZE) : items;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    };
  }
}
