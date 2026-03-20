import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
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
        updatedAt: true,
        ratings: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, input: UpdateProfileDto) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          displayName: input.displayName,
          timezone: input.timezone,
          region: input.region,
          examTrack: input.examTrack,
        },
      });

      if (input.examTrack) {
        await tx.rating.upsert({
          where: {
            userId_examTrack: {
              userId,
              examTrack: input.examTrack,
            },
          },
          update: {},
          create: {
            userId,
            examTrack: input.examTrack,
            hiddenMmr: 1200,
            visibleTier: 'Bronze',
            matchesPlayed: 0,
          },
        });
      }

      return user;
    });

    return this.getProfile(updated.id);
  }
}
