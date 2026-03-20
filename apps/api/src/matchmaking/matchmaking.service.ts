import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Difficulty, ExamTrack, MatchStatus, Subject } from '@prisma/client';
import { EventPublisherService } from '../events/event-publisher.service';
import { GameGateway } from '../game/game.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { JoinQueueDto } from './dto/join-queue.dto';

type QueueStatus = 'QUEUED' | 'MATCH_FOUND';
const FOUND_MATCH_TTL_MS = 10 * 60 * 1000;
const DEFAULT_ROUND_TIME_SECONDS = 45;

type QueuePreference = {
  subject: Subject | null;
  difficulty: Difficulty | null;
  roundTimeSeconds: 30 | 45 | 60;
};

type QueueEntry = {
  userId: string;
  mmr: number;
  preference: QueuePreference;
};

type QueueVisibleMatch = {
  id: string;
  playerAId: string;
  playerBId: string;
  status: MatchStatus;
  examTrack: ExamTrack;
  createdAt: Date;
  preferredSubject: Subject | null;
  preferredDifficulty: Difficulty | null;
  roundTimeSeconds: number;
};

/**
 * In-memory queue fallback when Redis is unavailable.
 * Keyed by examTrack, stores queue entries with MMR and queue preferences.
 */
const memoryQueues = new Map<ExamTrack, QueueEntry[]>();

@Injectable()
export class MatchmakingService {
  private readonly mmrWindow = 150;
  private readonly logger = new Logger(MatchmakingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly gameGateway: GameGateway,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async joinQueue(userId: string, input: JoinQueueDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, examTrack: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const examTrack = input.examTrack ?? user.examTrack;
    const preference = this.toQueuePreference(input);
    const rating = await this.ensureRating(userId, examTrack);

    const hasActiveMatch = await this.prisma.match.findFirst({
      where: {
        OR: [{ playerAId: userId }, { playerBId: userId }],
        status: MatchStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (hasActiveMatch) {
      throw new BadRequestException('You already have an active match');
    }

    // If user re-enters queue, close previously found (unstarted) matches first.
    await this.cancelFoundMatchesForUser(userId);

    if (this.redis.isConnected()) {
      await this.removeUserFromAllRedisQueues(userId, examTrack);
      return this.joinQueueRedis(userId, examTrack, rating.hiddenMmr, preference);
    }

    this.removeUserFromAllMemoryQueues(userId, examTrack);
    return this.joinQueueMemory(userId, examTrack, rating.hiddenMmr, preference);
  }

  async leaveQueue(userId: string, examTrack?: ExamTrack) {
    if (!examTrack) {
      if (this.redis.isConnected()) {
        const removedCount = await this.removeUserFromAllRedisQueues(userId);
        return { removed: removedCount > 0, examTrack: null, removedCount };
      }

      const removedCount = this.removeUserFromAllMemoryQueues(userId);
      return { removed: removedCount > 0, examTrack: null, removedCount };
    }

    if (this.redis.isConnected()) {
      const redisClient = this.redis.getClient();
      const removed = await redisClient.zrem(this.queueKey(examTrack), userId);
      await redisClient.del(this.queuePreferenceKey(examTrack, userId));
      return { removed: removed > 0, examTrack };
    }

    const queue = memoryQueues.get(examTrack) ?? [];
    const before = queue.length;
    memoryQueues.set(
      examTrack,
      queue.filter((entry) => entry.userId !== userId),
    );
    return { removed: before > (memoryQueues.get(examTrack)?.length ?? 0), examTrack };
  }

  async queueStatus(userId: string) {
    const tracks = Object.values(ExamTrack) as ExamTrack[];
    const activeOrFoundMatch = await this.resolveVisibleCurrentMatch(userId);

    if (this.redis.isConnected()) {
      for (const track of tracks) {
        const score = await this.redis.getClient().zscore(this.queueKey(track), userId);
        if (score !== null) {
          return {
            inQueue: true,
            examTrack: track,
            hiddenMmr: Number(score),
            currentMatch: this.toCurrentMatchView(activeOrFoundMatch, userId),
          };
        }
      }

      return {
        inQueue: false,
        examTrack: null,
        hiddenMmr: null,
        currentMatch: this.toCurrentMatchView(activeOrFoundMatch, userId),
      };
    }

    for (const track of tracks) {
      const queue = memoryQueues.get(track) ?? [];
      const entry = queue.find((item) => item.userId === userId);
      if (entry) {
        return {
          inQueue: true,
          examTrack: track,
          hiddenMmr: entry.mmr,
          currentMatch: this.toCurrentMatchView(activeOrFoundMatch, userId),
        };
      }
    }

    return {
      inQueue: false,
      examTrack: null,
      hiddenMmr: null,
      currentMatch: this.toCurrentMatchView(activeOrFoundMatch, userId),
    };
  }

  async dismissFoundMatch(userId: string, matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        status: true,
        playerAId: true,
        playerBId: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.FOUND) {
      throw new BadRequestException('Only FOUND matches can be dismissed');
    }

    if (match.playerAId !== userId && match.playerBId !== userId) {
      throw new BadRequestException('You are not a participant of this match');
    }

    const cancelled = await this.prisma.match.updateMany({
      where: {
        id: matchId,
        status: MatchStatus.FOUND,
      },
      data: {
        status: MatchStatus.CANCELLED,
        endedAt: new Date(),
      },
    });

    if (cancelled.count === 0) {
      return { dismissed: false, matchId };
    }

    this.emitMatchCancelled(match, userId, 'USER_DISMISSED');
    return { dismissed: true, matchId };
  }

  // Redis-backed queue
  private async joinQueueRedis(
    userId: string,
    examTrack: ExamTrack,
    mmr: number,
    preference: QueuePreference,
  ) {
    const queueKey = this.queueKey(examTrack);
    const redisClient = this.redis.getClient();
    const preferenceKey = this.queuePreferenceKey(examTrack, userId);

    await redisClient.zadd(queueKey, mmr, userId);
    await this.saveRedisPreference(examTrack, userId, preference);

    const min = mmr - this.mmrWindow;
    const max = mmr + this.mmrWindow;
    const nearby = await redisClient.zrangebyscore(queueKey, min, max);

    let opponentId: string | null = null;
    let opponentPreference: QueuePreference | null = null;

    for (const candidateId of nearby) {
      if (candidateId === userId) {
        continue;
      }
      const candidatePreference = await this.loadRedisPreference(examTrack, candidateId);
      if (!candidatePreference) {
        continue;
      }
      if (!this.isQueuePreferenceCompatible(preference, candidatePreference)) {
        continue;
      }
      opponentId = candidateId;
      opponentPreference = candidatePreference;
      break;
    }

    if (!opponentId || !opponentPreference) {
      return {
        status: 'QUEUED' as QueueStatus,
        examTrack,
        hiddenMmr: mmr,
        settings: preference,
      };
    }

    const opponentRating = await this.ensureRating(opponentId, examTrack);
    const opponentPreferenceKey = this.queuePreferenceKey(examTrack, opponentId);

    const redisTx = redisClient.multi();
    redisTx.zrem(queueKey, userId);
    redisTx.zrem(queueKey, opponentId);
    redisTx.del(preferenceKey);
    redisTx.del(opponentPreferenceKey);
    const txResult = await redisTx.exec();

    const removedUser = Number(txResult?.[0]?.[1] ?? 0);
    const removedOpponent = Number(txResult?.[1]?.[1] ?? 0);

    if (removedUser !== 1 || removedOpponent !== 1) {
      await redisClient.zadd(queueKey, mmr, userId);
      await this.saveRedisPreference(examTrack, userId, preference);
      return {
        status: 'QUEUED' as QueueStatus,
        examTrack,
        hiddenMmr: mmr,
        settings: preference,
      };
    }

    const match = await this.createMatch(
      userId,
      opponentId,
      examTrack,
      mmr,
      opponentRating.hiddenMmr,
      preference,
      opponentPreference,
    );

    this.notifyMatchFound({
      matchId: match.id,
      examTrack,
      playerAId: userId,
      playerBId: opponentId,
      createdAt: match.createdAt,
      settings: {
        subject: match.preferredSubject,
        difficulty: match.preferredDifficulty,
        roundTimeSeconds: match.roundTimeSeconds,
      },
    });

    return { status: 'MATCH_FOUND' as QueueStatus, examTrack, match, opponentId };
  }

  // In-memory fallback queue
  private async joinQueueMemory(
    userId: string,
    examTrack: ExamTrack,
    mmr: number,
    preference: QueuePreference,
  ) {
    const queue = memoryQueues.get(examTrack) ?? [];
    const filtered = queue.filter((entry) => entry.userId !== userId);
    filtered.push({ userId, mmr, preference });

    const opponent = filtered.find(
      (entry) =>
        entry.userId !== userId &&
        Math.abs(entry.mmr - mmr) <= this.mmrWindow &&
        this.isQueuePreferenceCompatible(preference, entry.preference),
    );

    if (!opponent) {
      memoryQueues.set(examTrack, filtered);
      this.logger.debug(
        `[Memory Queue] ${userId} queued for ${examTrack} (MMR: ${mmr}, preference: ${JSON.stringify(preference)})`,
      );
      return { status: 'QUEUED' as QueueStatus, examTrack, hiddenMmr: mmr, settings: preference };
    }

    memoryQueues.set(
      examTrack,
      filtered.filter((entry) => entry.userId !== userId && entry.userId !== opponent.userId),
    );

    const match = await this.createMatch(
      userId,
      opponent.userId,
      examTrack,
      mmr,
      opponent.mmr,
      preference,
      opponent.preference,
    );

    this.notifyMatchFound({
      matchId: match.id,
      examTrack,
      playerAId: userId,
      playerBId: opponent.userId,
      createdAt: match.createdAt,
      settings: {
        subject: match.preferredSubject,
        difficulty: match.preferredDifficulty,
        roundTimeSeconds: match.roundTimeSeconds,
      },
    });

    this.logger.debug(`[Memory Queue] Match found: ${userId} vs ${opponent.userId}`);
    return { status: 'MATCH_FOUND' as QueueStatus, examTrack, match, opponentId: opponent.userId };
  }

  // Shared helpers
  private async createMatch(
    playerAId: string,
    playerBId: string,
    examTrack: ExamTrack,
    mmrA: number,
    mmrB: number,
    preferenceA: QueuePreference,
    preferenceB: QueuePreference,
  ) {
    const mergedPreference = this.mergeQueuePreference(preferenceA, preferenceB);

    return this.prisma.match.create({
      data: {
        examTrack,
        status: MatchStatus.FOUND,
        playerAId,
        playerBId,
        playerAMmrBefore: mmrA,
        playerBMmrBefore: mmrB,
        preferredSubject: mergedPreference.subject,
        preferredDifficulty: mergedPreference.difficulty,
        roundTimeSeconds: mergedPreference.roundTimeSeconds,
      },
      select: {
        id: true,
        createdAt: true,
        preferredSubject: true,
        preferredDifficulty: true,
        roundTimeSeconds: true,
      },
    });
  }

  private notifyMatchFound(input: {
    matchId: string;
    examTrack: ExamTrack;
    playerAId: string;
    playerBId: string;
    createdAt: Date;
    settings: {
      subject: Subject | null;
      difficulty: Difficulty | null;
      roundTimeSeconds: number;
    };
  }) {
    const matchPayload = {
      status: 'MATCH_FOUND' as QueueStatus,
      examTrack: input.examTrack,
      match: {
        id: input.matchId,
        createdAt: input.createdAt,
        settings: input.settings,
      },
      settings: input.settings,
    };

    this.gameGateway.emitToUser(input.playerAId, 'match_found', {
      ...matchPayload,
      opponentId: input.playerBId,
    });
    this.gameGateway.emitToUser(input.playerBId, 'match_found', {
      ...matchPayload,
      opponentId: input.playerAId,
    });

    void this.eventPublisher.publishMatchCreated(
      input.matchId,
      input.playerAId,
      input.playerBId,
      input.examTrack,
    );
  }

  private async ensureRating(userId: string, examTrack: ExamTrack) {
    const existing = await this.prisma.rating.findUnique({
      where: { userId_examTrack: { userId, examTrack } },
    });

    if (existing) return existing;

    return this.prisma.rating.create({
      data: { userId, examTrack, hiddenMmr: 1200, visibleTier: 'Bronze', matchesPlayed: 0 },
    });
  }

  private queueKey(examTrack: ExamTrack) {
    return `matchmaking:queue:${examTrack}`;
  }

  private queuePreferenceKey(examTrack: ExamTrack, userId: string) {
    return `matchmaking:queue:pref:${examTrack}:${userId}`;
  }

  private async saveRedisPreference(
    examTrack: ExamTrack,
    userId: string,
    preference: QueuePreference,
  ) {
    const redisClient = this.redis.getClient();
    await redisClient.set(
      this.queuePreferenceKey(examTrack, userId),
      JSON.stringify(preference),
      'EX',
      10 * 60,
    );
  }

  private async loadRedisPreference(examTrack: ExamTrack, userId: string) {
    const redisClient = this.redis.getClient();
    const raw = await redisClient.get(this.queuePreferenceKey(examTrack, userId));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<QueuePreference>;
      return {
        subject: parsed.subject ?? null,
        difficulty: parsed.difficulty ?? null,
        roundTimeSeconds:
          parsed.roundTimeSeconds === 30 ||
          parsed.roundTimeSeconds === 45 ||
          parsed.roundTimeSeconds === 60
            ? parsed.roundTimeSeconds
            : DEFAULT_ROUND_TIME_SECONDS,
      } as QueuePreference;
    } catch {
      return null;
    }
  }

  private async removeUserFromAllRedisQueues(userId: string, keepTrack?: ExamTrack) {
    const redisClient = this.redis.getClient();
    const tracks = Object.values(ExamTrack) as ExamTrack[];
    let removedCount = 0;

    for (const track of tracks) {
      if (keepTrack && track === keepTrack) {
        continue;
      }
      removedCount += await redisClient.zrem(this.queueKey(track), userId);
      await redisClient.del(this.queuePreferenceKey(track, userId));
    }

    return removedCount;
  }

  private removeUserFromAllMemoryQueues(userId: string, keepTrack?: ExamTrack) {
    const tracks = Object.values(ExamTrack) as ExamTrack[];
    let removedCount = 0;

    for (const track of tracks) {
      if (keepTrack && track === keepTrack) {
        continue;
      }
      const queue = memoryQueues.get(track) ?? [];
      const before = queue.length;
      const next = queue.filter((entry) => entry.userId !== userId);
      removedCount += before - next.length;
      memoryQueues.set(track, next);
    }

    return removedCount;
  }

  private toQueuePreference(input: JoinQueueDto): QueuePreference {
    return {
      subject: input.subject ?? null,
      difficulty: input.difficulty ?? null,
      roundTimeSeconds: input.roundTimeSeconds ?? DEFAULT_ROUND_TIME_SECONDS,
    };
  }

  private isQueuePreferenceCompatible(a: QueuePreference, b: QueuePreference) {
    if (a.roundTimeSeconds !== b.roundTimeSeconds) {
      return false;
    }

    if (a.subject && b.subject && a.subject !== b.subject) {
      return false;
    }

    if (a.difficulty && b.difficulty && a.difficulty !== b.difficulty) {
      return false;
    }

    return true;
  }

  private mergeQueuePreference(a: QueuePreference, b: QueuePreference): QueuePreference {
    return {
      subject: a.subject ?? b.subject ?? null,
      difficulty: a.difficulty ?? b.difficulty ?? null,
      roundTimeSeconds:
        a.roundTimeSeconds === b.roundTimeSeconds
          ? a.roundTimeSeconds
          : DEFAULT_ROUND_TIME_SECONDS,
    };
  }

  private async resolveVisibleCurrentMatch(userId: string): Promise<QueueVisibleMatch | null> {
    const candidates = await this.prisma.match.findMany({
      where: {
        OR: [{ playerAId: userId }, { playerBId: userId }],
        status: {
          in: [MatchStatus.FOUND, MatchStatus.ACTIVE],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        playerAId: true,
        playerBId: true,
        status: true,
        examTrack: true,
        createdAt: true,
        preferredSubject: true,
        preferredDifficulty: true,
        roundTimeSeconds: true,
      },
    });

    for (const match of candidates) {
      if (match.status === MatchStatus.ACTIVE) {
        return match;
      }

      if (match.status === MatchStatus.FOUND) {
        if (this.isFoundMatchExpired(match.createdAt)) {
          const cancelled = await this.prisma.match.updateMany({
            where: { id: match.id, status: MatchStatus.FOUND },
            data: {
              status: MatchStatus.CANCELLED,
              endedAt: new Date(),
            },
          });
          if (cancelled.count > 0) {
            this.emitMatchCancelled(match, null, 'EXPIRED');
          }
          continue;
        }

        return match;
      }
    }

    return null;
  }

  private isFoundMatchExpired(createdAt: Date) {
    return Date.now() - createdAt.getTime() > FOUND_MATCH_TTL_MS;
  }

  private toCurrentMatchView(match: QueueVisibleMatch | null, userId: string) {
    if (!match) return null;
    return {
      id: match.id,
      status: match.status,
      examTrack: match.examTrack,
      opponentId: match.playerAId === userId ? match.playerBId : match.playerAId,
      settings: {
        subject: match.preferredSubject,
        difficulty: match.preferredDifficulty,
        roundTimeSeconds: match.roundTimeSeconds,
      },
    };
  }

  private async cancelFoundMatchesForUser(userId: string) {
    const openFoundMatches = await this.prisma.match.findMany({
      where: {
        OR: [{ playerAId: userId }, { playerBId: userId }],
        status: MatchStatus.FOUND,
      },
      select: {
        id: true,
        playerAId: true,
        playerBId: true,
        status: true,
      },
      take: 20,
    });

    for (const match of openFoundMatches) {
      const cancelled = await this.prisma.match.updateMany({
        where: {
          id: match.id,
          status: MatchStatus.FOUND,
        },
        data: {
          status: MatchStatus.CANCELLED,
          endedAt: new Date(),
        },
      });

      if (cancelled.count > 0) {
        this.emitMatchCancelled(match, userId, 'REQUEUED');
      }
    }
  }

  private emitMatchCancelled(
    match: { id: string; playerAId: string; playerBId: string },
    cancelledByUserId: string | null,
    reason: 'USER_DISMISSED' | 'REQUEUED' | 'EXPIRED',
  ) {
    const payload = {
      matchId: match.id,
      cancelledByUserId,
      reason,
      redirectTo: '/play',
    };

    this.gameGateway.emitToUser(match.playerAId, 'match_cancelled', payload);
    this.gameGateway.emitToUser(match.playerBId, 'match_cancelled', payload);
    this.gameGateway.emitToMatch(match.id, 'match_cancelled', payload);
  }
}
