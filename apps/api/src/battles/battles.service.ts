import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AntiCheatSeverity,
  Difficulty,
  ExamTrack,
  MatchStatus,
  Prisma,
  Subject,
  UserRole,
} from '@prisma/client';
import { AnalyticsService } from '../analytics/analytics.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { GameGateway } from '../game/game.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { FinishBattleDto } from './dto/finish-battle.dto';
import { StartBattleDto } from './dto/start-battle.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

const ELO_K = 32;
const ROUND_COUNT = 3;
const FAST_ANSWER_MS = 250;
const VERY_FAST_ANSWER_MS = 450;
const COLLUSION_TIME_DELTA_MS = 35;

type MatchParticipant = {
  id: string;
  examTrack: ExamTrack;
  status: MatchStatus;
  preferredSubject: Subject | null;
  preferredDifficulty: Difficulty | null;
  roundTimeSeconds: number;
  playerAId: string;
  playerBId: string;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
};

type RoundWithQuestion = Prisma.RoundGetPayload<{
  include: {
    question: {
      select: {
        id: true;
        body: true;
        optionA: true;
        optionB: true;
        optionC: true;
        optionD: true;
        correctOption: true;
        subject: true;
        difficulty: true;
      };
    };
  };
}>;

@Injectable()
export class BattlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gameGateway: GameGateway,
    private readonly analyticsService: AnalyticsService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async startBattle(userId: string, matchId: string, input: StartBattleDto) {
    const match = await this.getParticipantMatchOrThrow(userId, matchId);

    if (match.status === MatchStatus.COMPLETED || match.status === MatchStatus.CANCELLED) {
      throw new BadRequestException('Battle is already closed');
    }

    if (match.status === MatchStatus.FOUND) {
      await this.prisma.$transaction(async (tx) => {
        const roundCount = await tx.round.count({
          where: { matchId: match.id },
        });

        if (roundCount === 0) {
          const questions = await this.pickQuestionsForMatch(tx, match, ROUND_COUNT);
          await tx.round.createMany({
            data: questions.map((question, index) => ({
              matchId: match.id,
              questionId: question.id,
              roundNumber: index + 1,
            })),
          });
        }

        await tx.match.updateMany({
          where: { id: match.id, status: MatchStatus.FOUND },
          data: {
            status: MatchStatus.ACTIVE,
            startedAt: new Date(),
          },
        });
      });
    }

    const refreshed = await this.getParticipantMatchOrThrow(userId, matchId);
    const rounds = await this.getMatchRounds(refreshed.id);
    const publicRounds = rounds.map((round) =>
      this.toPublicRound(round, refreshed, userId),
    );

    const payload = {
      matchId: refreshed.id,
      status: refreshed.status,
      startedAt: refreshed.startedAt,
      rounds: publicRounds,
      settings: {
        subject: refreshed.preferredSubject,
        difficulty: refreshed.preferredDifficulty,
        roundTimeSeconds: refreshed.roundTimeSeconds,
      },
      clientVersion: input.clientVersion ?? null,
    };

    this.gameGateway.emitToUser(refreshed.playerAId, 'battle_started', payload);
    this.gameGateway.emitToUser(refreshed.playerBId, 'battle_started', payload);
    this.gameGateway.emitToMatch(refreshed.id, 'battle_started', payload);

    return payload;
  }

  async submitAnswer(userId: string, matchId: string, input: SubmitAnswerDto) {
    const match = await this.getParticipantMatchOrThrow(userId, matchId);
    if (match.status !== MatchStatus.ACTIVE) {
      throw new BadRequestException('Battle is not active');
    }

    const isPlayerA = userId === match.playerAId;
    const answerColumn = isPlayerA ? 'playerAAnswer' : 'playerBAnswer';
    const timeColumn = isPlayerA ? 'playerATimeMs' : 'playerBTimeMs';
    const correctColumn = isPlayerA ? 'playerACorrect' : 'playerBCorrect';

    const submission = await this.prisma.$transaction(async (tx) => {
      const round = await tx.round.findUnique({
        where: {
          matchId_roundNumber: {
            matchId: match.id,
            roundNumber: input.roundNumber,
          },
        },
        include: {
          question: {
            select: {
              id: true,
              body: true,
              optionA: true,
              optionB: true,
              optionC: true,
              optionD: true,
              correctOption: true,
              subject: true,
              difficulty: true,
            },
          },
        },
      });

      if (!round) {
        throw new NotFoundException('Round not found');
      }

      if (round[answerColumn]) {
        return { round, accepted: false };
      }

      const isCorrect = input.answer === round.question.correctOption;
      const updatedCount = await tx.round.updateMany({
        where: {
          id: round.id,
          [answerColumn]: null,
        },
        data: {
          [answerColumn]: input.answer,
          [timeColumn]: input.timeMs,
          [correctColumn]: isCorrect,
        },
      });

      if (updatedCount.count === 0) {
        const latest = await tx.round.findUnique({
          where: { id: round.id },
          include: {
            question: {
              select: {
                id: true,
                body: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true,
                correctOption: true,
                subject: true,
                difficulty: true,
              },
            },
          },
        });

        if (!latest) {
          throw new NotFoundException('Round not found');
        }
        return { round: latest, accepted: false };
      }

      const updated = await tx.round.findUnique({
        where: { id: round.id },
        include: {
          question: {
            select: {
              id: true,
              body: true,
              optionA: true,
              optionB: true,
              optionC: true,
              optionD: true,
              correctOption: true,
              subject: true,
              difficulty: true,
            },
          },
        },
      });

      if (!updated) {
        throw new NotFoundException('Round not found');
      }

      if (input.timeMs <= FAST_ANSWER_MS) {
        await tx.antiCheatFlag.create({
          data: {
            matchId: match.id,
            userId,
            type: 'IMPOSSIBLE_REACTION_TIME',
            severity: AntiCheatSeverity.HIGH,
            details: {
              roundNumber: input.roundNumber,
              timeMs: input.timeMs,
              thresholdMs: FAST_ANSWER_MS,
            },
          },
        });
      } else if (input.timeMs <= VERY_FAST_ANSWER_MS) {
        await tx.antiCheatFlag.create({
          data: {
            matchId: match.id,
            userId,
            type: 'VERY_FAST_REACTION_TIME',
            severity: AntiCheatSeverity.MEDIUM,
            details: {
              roundNumber: input.roundNumber,
              timeMs: input.timeMs,
              thresholdMs: VERY_FAST_ANSWER_MS,
            },
          },
        });
      }

      if (
        updated.playerAAnswer &&
        updated.playerBAnswer &&
        updated.playerAAnswer === updated.playerBAnswer &&
        updated.playerATimeMs !== null &&
        updated.playerBTimeMs !== null &&
        Math.abs(updated.playerATimeMs - updated.playerBTimeMs) <= COLLUSION_TIME_DELTA_MS
      ) {
        await tx.antiCheatFlag.create({
          data: {
            matchId: match.id,
            type: 'SYNCHRONIZED_ANSWER_PATTERN',
            severity: AntiCheatSeverity.MEDIUM,
            details: {
              roundNumber: updated.roundNumber,
              playerAAnswer: updated.playerAAnswer,
              playerBAnswer: updated.playerBAnswer,
              playerATimeMs: updated.playerATimeMs,
              playerBTimeMs: updated.playerBTimeMs,
              deltaMs: Math.abs(updated.playerATimeMs - updated.playerBTimeMs),
              thresholdMs: COLLUSION_TIME_DELTA_MS,
            },
          },
        });
      }

      return { round: updated, accepted: true };
    });

    const publicRound = this.toPublicRound(submission.round, match, userId);

    if (!submission.accepted) {
      return {
        status: 'ALREADY_SUBMITTED',
        round: publicRound,
      };
    }

    // Track analytics for accepted answer.
    const isCurrentCorrect = isPlayerA
      ? submission.round.playerACorrect
      : submission.round.playerBCorrect;
    await this.analyticsService.trackQuestionAnswered({
      questionId: submission.round.questionId,
      userId,
      correct: Boolean(isCurrentCorrect),
      timeMs: input.timeMs,
      matchId: match.id,
    });

    const roundResolved =
      submission.round.playerAAnswer !== null && submission.round.playerBAnswer !== null;
    if (roundResolved) {
      this.gameGateway.emitToMatch(match.id, 'round_result', {
        matchId: match.id,
        roundNumber: submission.round.roundNumber,
        playerA: {
          answer: submission.round.playerAAnswer,
          correct: submission.round.playerACorrect,
          timeMs: submission.round.playerATimeMs,
        },
        playerB: {
          answer: submission.round.playerBAnswer,
          correct: submission.round.playerBCorrect,
          timeMs: submission.round.playerBTimeMs,
        },
      });
    }

    const rounds = await this.getMatchRounds(match.id);
    const allResolved =
      rounds.length > 0 &&
      rounds.every((round) => round.playerAAnswer !== null && round.playerBAnswer !== null);

    if (!allResolved) {
      return {
        status: 'ANSWER_ACCEPTED',
        round: publicRound,
      };
    }

    const finalResult = await this.finalizeBattleFromRounds(match, rounds);
    return {
      status: 'MATCH_COMPLETED',
      round: publicRound,
      result: finalResult,
    };
  }

  async finishBattle(
    userId: string,
    role: UserRole,
    matchId: string,
    input: FinishBattleDto,
  ) {
    const match =
      role === UserRole.ADMIN
        ? await this.getMatchByIdOrThrow(matchId)
        : await this.getParticipantMatchOrThrow(userId, matchId);

    if (match.status === MatchStatus.FOUND) {
      throw new BadRequestException('Battle has not started yet');
    }

    if (match.status === MatchStatus.COMPLETED || match.status === MatchStatus.CANCELLED) {
      throw new BadRequestException('Battle is already closed');
    }

    // Manual/admin fallback: allow explicit score resolution including draw.
    const rounds = await this.getMatchRounds(match.id);
    const syntheticRounds = rounds.map((round, index) => ({
      ...round,
      playerACorrect: index < input.playerAScore,
      playerBCorrect: index < input.playerBScore,
      playerATimeMs: round.playerATimeMs ?? 5000,
      playerBTimeMs: round.playerBTimeMs ?? 5000,
    }));

    return this.finalizeBattleFromRounds(match, syntheticRounds, input.durationSeconds ?? 0);
  }

  async quitBattle(userId: string, matchId: string) {
    const match = await this.getParticipantMatchOrThrow(userId, matchId);

    if (match.status !== MatchStatus.ACTIVE) {
      throw new BadRequestException('Only active matches can be quit');
    }

    const quitterId = userId;
    const opponentId = match.playerAId === userId ? match.playerBId : match.playerAId;
    const endedAt = new Date();

    const cancellation = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.match.updateMany({
        where: {
          id: match.id,
          status: MatchStatus.ACTIVE,
        },
        data: {
          status: MatchStatus.CANCELLED,
          winnerId: opponentId,
          endedAt,
          playerAScore: null,
          playerBScore: null,
        },
      });

      if (updated.count === 0) {
        return { cancelled: false };
      }

      // For abandoned matches, clear gameplay artifacts so no partial round data is retained.
      await tx.round.deleteMany({
        where: { matchId: match.id },
      });
      await tx.antiCheatFlag.deleteMany({
        where: { matchId: match.id },
      });

      return { cancelled: true };
    });

    if (!cancellation.cancelled) {
      return {
        matchId: match.id,
        status: 'ALREADY_CLOSED',
      };
    }

    const payload = {
      matchId: match.id,
      status: MatchStatus.CANCELLED,
      quitterId,
      opponentId,
      reason: 'PLAYER_QUIT',
      redirectTo: '/play',
    };

    this.gameGateway.emitToUser(match.playerAId, 'battle_abandoned', payload);
    this.gameGateway.emitToUser(match.playerBId, 'battle_abandoned', payload);
    this.gameGateway.emitToMatch(match.id, 'battle_abandoned', payload);

    return {
      matchId: match.id,
      status: MatchStatus.CANCELLED,
      quitterId,
      redirected: true,
    };
  }

  async getBattleDetail(userId: string, matchId: string) {
    const match = await this.getParticipantMatchOrThrow(userId, matchId);
    const rounds = await this.getMatchRounds(match.id);

    const ratings = await this.prisma.rating.findMany({
      where: {
        examTrack: match.examTrack,
        userId: {
          in: [match.playerAId, match.playerBId],
        },
      },
      select: {
        userId: true,
        hiddenMmr: true,
        visibleTier: true,
        matchesPlayed: true,
        updatedAt: true,
      },
    });

    const unresolvedFlags = await this.prisma.antiCheatFlag.count({
      where: {
        matchId: match.id,
        resolvedAt: null,
      },
    });

    return {
      match,
      ratings,
      rounds: rounds.map((round) => this.toPublicRound(round, match, userId)),
      antiCheat: {
        unresolvedFlags,
      },
    };
  }

  private async finalizeBattleFromRounds(
    match: MatchParticipant,
    rounds: Array<{
      playerACorrect: boolean | null;
      playerBCorrect: boolean | null;
      playerATimeMs: number | null;
      playerBTimeMs: number | null;
    }>,
    durationSeconds?: number,
  ) {
    const playerAScore = rounds.reduce(
      (score, round) => score + (round.playerACorrect ? 1 : 0),
      0,
    );
    const playerBScore = rounds.reduce(
      (score, round) => score + (round.playerBCorrect ? 1 : 0),
      0,
    );

    const totalTimeA = rounds.reduce((sum, round) => sum + (round.playerATimeMs ?? 0), 0);
    const totalTimeB = rounds.reduce((sum, round) => sum + (round.playerBTimeMs ?? 0), 0);

    let winnerId: string | null = null;
    let tieBreaker: 'SCORE' | 'TIME' | 'DRAW' = 'SCORE';
    if (playerAScore > playerBScore) winnerId = match.playerAId;
    else if (playerBScore > playerAScore) winnerId = match.playerBId;
    else if (totalTimeA < totalTimeB) {
      winnerId = match.playerAId;
      tieBreaker = 'TIME';
    } else if (totalTimeB < totalTimeA) {
      winnerId = match.playerBId;
      tieBreaker = 'TIME';
    } else {
      tieBreaker = 'DRAW';
    }

    const playerARating = await this.ensureRating(match.playerAId, match.examTrack);
    const playerBRating = await this.ensureRating(match.playerBId, match.examTrack);

    const outcomeA =
      winnerId === match.playerAId ? 1 : winnerId === match.playerBId ? 0 : 0.5;
    const outcomeB =
      winnerId === match.playerBId ? 1 : winnerId === match.playerAId ? 0 : 0.5;

    const expectedA = this.expectedScore(playerARating.hiddenMmr, playerBRating.hiddenMmr);
    const expectedB = this.expectedScore(playerBRating.hiddenMmr, playerARating.hiddenMmr);

    const nextMmrA = this.normalizeMmr(
      Math.round(playerARating.hiddenMmr + ELO_K * (outcomeA - expectedA)),
    );
    const nextMmrB = this.normalizeMmr(
      Math.round(playerBRating.hiddenMmr + ELO_K * (outcomeB - expectedB)),
    );

    const endedAt = new Date();
    const transactionResult = await this.prisma.$transaction(async (tx) => {
      const matchUpdate = await tx.match.updateMany({
        where: { id: match.id, status: MatchStatus.ACTIVE },
        data: {
          status: MatchStatus.COMPLETED,
          winnerId,
          playerAScore,
          playerBScore,
          startedAt: match.startedAt ?? endedAt,
          endedAt,
        },
      });

      if (matchUpdate.count === 0) {
        const existing = await tx.match.findUnique({
          where: { id: match.id },
          select: {
            id: true,
            status: true,
            winnerId: true,
            playerAScore: true,
            playerBScore: true,
            endedAt: true,
          },
        });

        return {
          alreadyFinalized: true,
          existing,
        };
      }

      await tx.rating.update({
        where: { id: playerARating.id },
        data: {
          hiddenMmr: nextMmrA,
          visibleTier: this.mmrToTier(nextMmrA),
          matchesPlayed: { increment: 1 },
        },
      });

      await tx.rating.update({
        where: { id: playerBRating.id },
        data: {
          hiddenMmr: nextMmrB,
          visibleTier: this.mmrToTier(nextMmrB),
          matchesPlayed: { increment: 1 },
        },
      });

      return { alreadyFinalized: false as const };
    });

    if (transactionResult.alreadyFinalized) {
      return {
        matchId: match.id,
        status: transactionResult.existing?.status ?? MatchStatus.COMPLETED,
        winnerId: transactionResult.existing?.winnerId ?? null,
        score: {
          playerA: transactionResult.existing?.playerAScore ?? null,
          playerB: transactionResult.existing?.playerBScore ?? null,
        },
        ratingDelta: null,
        ratingAfter: null,
        tieBreaker: 'DRAW',
        durationSeconds: durationSeconds ?? null,
        endedAt: transactionResult.existing?.endedAt ?? new Date(),
      };
    }

    const result = {
      matchId: match.id,
      status: MatchStatus.COMPLETED,
      winnerId,
      score: {
        playerA: playerAScore,
        playerB: playerBScore,
      },
      ratingDelta: {
        playerA: nextMmrA - playerARating.hiddenMmr,
        playerB: nextMmrB - playerBRating.hiddenMmr,
      },
      ratingAfter: {
        playerA: nextMmrA,
        playerB: nextMmrB,
      },
      tieBreaker,
      durationSeconds: durationSeconds ?? this.toDurationSeconds(match.startedAt, endedAt),
      endedAt,
    };

    this.gameGateway.emitToUser(match.playerAId, 'battle_finished', result);
    this.gameGateway.emitToUser(match.playerBId, 'battle_finished', result);
    this.gameGateway.emitToMatch(match.id, 'battle_finished', result);

    await Promise.allSettled([
      this.eventPublisher.publishMatchCompleted(match.id, winnerId, {
        [match.playerAId]: result.ratingDelta.playerA,
        [match.playerBId]: result.ratingDelta.playerB,
      }),
      this.eventPublisher.publishRatingUpdated(
        match.playerAId,
        match.examTrack,
        playerARating.hiddenMmr,
        nextMmrA,
      ),
      this.eventPublisher.publishRatingUpdated(
        match.playerBId,
        match.examTrack,
        playerBRating.hiddenMmr,
        nextMmrB,
      ),
      this.analyticsService.trackMatchCompleted({
        matchId: match.id,
        examTrack: match.examTrack,
        winnerId,
        durationSeconds: result.durationSeconds ?? 0,
        playerAMmrBefore: playerARating.hiddenMmr,
        playerBMmrBefore: playerBRating.hiddenMmr,
      }),
    ]);

    return result;
  }

  private toDurationSeconds(startedAt: Date | null, endedAt: Date) {
    if (!startedAt) return null;
    return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
  }

  private toPublicRound(round: RoundWithQuestion, match: MatchParticipant, viewerUserId: string) {
    const isViewerA = viewerUserId === match.playerAId;
    const isCompleted = match.status === MatchStatus.COMPLETED;

    const hideOpponentAData = !isCompleted && !isViewerA && round.playerBAnswer === null;
    const hideOpponentBData = !isCompleted && isViewerA && round.playerAAnswer === null;

    const playerAAnswer = hideOpponentAData ? null : round.playerAAnswer;
    const playerBAnswer = hideOpponentBData ? null : round.playerBAnswer;
    const playerACorrect = hideOpponentAData ? null : round.playerACorrect;
    const playerBCorrect = hideOpponentBData ? null : round.playerBCorrect;
    const playerATimeMs = hideOpponentAData ? null : round.playerATimeMs;
    const playerBTimeMs = hideOpponentBData ? null : round.playerBTimeMs;

    return {
      id: round.id,
      roundNumber: round.roundNumber,
      playerAAnswer,
      playerBAnswer,
      playerACorrect,
      playerBCorrect,
      playerATimeMs,
      playerBTimeMs,
      question: {
        id: round.question.id,
        body: round.question.body,
        optionA: round.question.optionA,
        optionB: round.question.optionB,
        optionC: round.question.optionC,
        optionD: round.question.optionD,
        subject: round.question.subject,
        difficulty: round.question.difficulty,
        correctOption: isCompleted ? round.question.correctOption : null,
      },
    };
  }

  private async getMatchRounds(matchId: string) {
    return this.prisma.round.findMany({
      where: { matchId },
      orderBy: { roundNumber: 'asc' },
      include: {
        question: {
          select: {
            id: true,
            body: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            correctOption: true,
            subject: true,
            difficulty: true,
          },
        },
      },
    });
  }

  private async pickQuestionsForMatch(
    tx: Prisma.TransactionClient,
    match: MatchParticipant,
    count: number,
  ) {
    const strictWhere: Prisma.QuestionWhereInput = {
      examTrack: match.examTrack,
      isActive: true,
      ...(match.preferredSubject ? { subject: match.preferredSubject } : {}),
      ...(match.preferredDifficulty ? { difficulty: match.preferredDifficulty } : {}),
    };

    let whereClause = strictWhere;
    let total = await tx.question.count({ where: whereClause });

    // Fallback for sparse pools: if strict preference pool is too small, relax to exam track only.
    if (total < count && (match.preferredSubject || match.preferredDifficulty)) {
      whereClause = { examTrack: match.examTrack, isActive: true };
      total = await tx.question.count({ where: whereClause });
    }

    if (total < count) {
      throw new BadRequestException(
        `Not enough active questions for ${match.examTrack}. Need at least ${count}, found ${total}.`,
      );
    }

    const skip = Math.max(0, Math.floor(Math.random() * Math.max(total - count, 1)));
    return tx.question.findMany({
      where: whereClause,
      select: { id: true },
      take: count,
      skip,
    });
  }

  private async getParticipantMatchOrThrow(userId: string, matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        examTrack: true,
        status: true,
        preferredSubject: true,
        preferredDifficulty: true,
        roundTimeSeconds: true,
        playerAId: true,
        playerBId: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const participant = match.playerAId === userId || match.playerBId === userId;
    if (!participant) {
      throw new ForbiddenException('You are not a participant in this match');
    }

    return match;
  }

  private async getMatchByIdOrThrow(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        examTrack: true,
        status: true,
        preferredSubject: true,
        preferredDifficulty: true,
        roundTimeSeconds: true,
        playerAId: true,
        playerBId: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return match;
  }

  private async ensureRating(userId: string, examTrack: ExamTrack) {
    const existing = await this.prisma.rating.findUnique({
      where: {
        userId_examTrack: {
          userId,
          examTrack,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.rating.create({
      data: {
        userId,
        examTrack,
        hiddenMmr: 1200,
        visibleTier: 'Bronze',
        matchesPlayed: 0,
      },
    });
  }

  private expectedScore(a: number, b: number) {
    return 1 / (1 + 10 ** ((b - a) / 400));
  }

  private normalizeMmr(value: number) {
    return Math.max(100, value);
  }

  private mmrToTier(mmr: number) {
    if (mmr < 1000) {
      return 'Bronze';
    }
    if (mmr < 1200) {
      return 'Silver';
    }
    if (mmr < 1400) {
      return 'Gold';
    }
    if (mmr < 1700) {
      return 'Platinum';
    }
    if (mmr < 2000) {
      return 'Diamond';
    }
    return 'Titan';
  }
}
