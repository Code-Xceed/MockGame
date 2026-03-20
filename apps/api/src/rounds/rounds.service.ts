import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoundsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Record a round result after both players answer */
  async recordRound(input: {
    matchId: string;
    questionId: string;
    roundNumber: number;
    playerAAnswer: string | null;
    playerBAnswer: string | null;
  }) {
    // Fetch correct answer
    const question = await this.prisma.question.findUnique({
      where: { id: input.questionId },
      select: { correctOption: true },
    });

    if (!question) throw new NotFoundException('Question not found');

    const playerACorrect = input.playerAAnswer === question.correctOption;
    const playerBCorrect = input.playerBAnswer === question.correctOption;

    return this.prisma.round.upsert({
      where: {
        matchId_roundNumber: {
          matchId: input.matchId,
          roundNumber: input.roundNumber,
        },
      },
      create: {
        matchId: input.matchId,
        questionId: input.questionId,
        roundNumber: input.roundNumber,
        playerAAnswer: input.playerAAnswer,
        playerBAnswer: input.playerBAnswer,
        playerACorrect,
        playerBCorrect,
      },
      update: {
        playerAAnswer: input.playerAAnswer,
        playerBAnswer: input.playerBAnswer,
        playerACorrect,
        playerBCorrect,
      },
    });
  }

  /** Get all rounds for a match */
  async getRounds(matchId: string) {
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

  /**
   * Calculate match score from completed rounds.
   * Returns { playerAScore, playerBScore, winnerId | null }
   */
  calculateMatchScore(
    rounds: { playerACorrect: boolean | null; playerBCorrect: boolean | null }[],
    playerAId: string,
    playerBId: string,
  ) {
    let playerAScore = 0;
    let playerBScore = 0;

    for (const round of rounds) {
      if (round.playerACorrect) playerAScore++;
      if (round.playerBCorrect) playerBScore++;
    }

    let winnerId: string | null = null;
    if (playerAScore > playerBScore) winnerId = playerAId;
    else if (playerBScore > playerAScore) winnerId = playerBId;

    return { playerAScore, playerBScore, winnerId };
  }
}
