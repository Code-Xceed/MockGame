import { Injectable } from '@nestjs/common';
import { ExamTrack } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async top(examTrack: ExamTrack) {
    const rows = await this.prisma.rating.findMany({
      where: { examTrack },
      orderBy: [{ hiddenMmr: 'desc' }, { updatedAt: 'asc' }],
      take: 50,
      select: {
        hiddenMmr: true,
        visibleTier: true,
        matchesPlayed: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    return rows.map((item, index) => ({
      rank: index + 1,
      userId: item.user.id,
      displayName: item.user.displayName,
      hiddenMmr: item.hiddenMmr,
      visibleTier: item.visibleTier,
      matchesPlayed: item.matchesPlayed,
      updatedAt: item.updatedAt,
      examTrack,
    }));
  }
}
