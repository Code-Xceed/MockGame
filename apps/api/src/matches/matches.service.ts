import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const PAGE_SIZE = 20;

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  /** List matches for a user with cursor-based pagination */
  async listForUser(userId: string, cursor?: string) {
    const items = await this.prisma.match.findMany({
      where: {
        OR: [{ playerAId: userId }, { playerBId: userId }],
      },
      take: PAGE_SIZE + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        examTrack: true,
        status: true,
        preferredSubject: true,
        preferredDifficulty: true,
        roundTimeSeconds: true,
        playerAId: true,
        playerBId: true,
        winnerId: true,
        playerAScore: true,
        playerBScore: true,
        createdAt: true,
        startedAt: true,
        endedAt: true,
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

  async getById(userId: string, matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        rounds: {
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
        },
        antiCheatFlags: {
          where: { resolvedAt: null },
          select: {
            id: true,
            type: true,
            severity: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        playerA: {
          select: { id: true, displayName: true, examTrack: true },
        },
        playerB: {
          select: { id: true, displayName: true, examTrack: true },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const isParticipant = match.playerAId === userId || match.playerBId === userId;
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this match');
    }

    const isViewerA = match.playerAId === userId;
    const isCompleted = match.status === MatchStatus.COMPLETED;

    return {
      ...match,
      rounds: match.rounds.map((round) => {
        const hidePlayerA = !isCompleted && !isViewerA && round.playerBAnswer === null;
        const hidePlayerB = !isCompleted && isViewerA && round.playerAAnswer === null;
        return {
          ...round,
          playerAAnswer: hidePlayerA ? null : round.playerAAnswer,
          playerACorrect: hidePlayerA ? null : round.playerACorrect,
          playerATimeMs: hidePlayerA ? null : round.playerATimeMs,
          playerBAnswer: hidePlayerB ? null : round.playerBAnswer,
          playerBCorrect: hidePlayerB ? null : round.playerBCorrect,
          playerBTimeMs: hidePlayerB ? null : round.playerBTimeMs,
          question: {
            ...round.question,
            correctOption: isCompleted ? round.question.correctOption : null,
          },
        };
      }),
      antiCheat: {
        unresolvedFlags: match.antiCheatFlags.length,
      },
    };
  }
}
