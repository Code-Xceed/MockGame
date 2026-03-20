import { Difficulty, ExamTrack, Subject } from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

export class JoinQueueDto {
  @IsOptional()
  @IsEnum(ExamTrack)
  examTrack?: ExamTrack;

  @IsOptional()
  @IsEnum(Subject)
  subject?: Subject;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsIn([30, 45, 60])
  roundTimeSeconds?: 30 | 45 | 60;
}
