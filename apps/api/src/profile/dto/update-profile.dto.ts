import { ExamTrack } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  displayName?: string;

  @IsOptional()
  @IsEnum(ExamTrack)
  examTrack?: ExamTrack;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  region?: string;
}
