import { ExamTrack } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class LeaderboardQueryDto {
  @IsOptional()
  @IsEnum(ExamTrack)
  examTrack?: ExamTrack;
}
