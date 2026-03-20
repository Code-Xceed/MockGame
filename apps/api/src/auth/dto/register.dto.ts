import { ExamTrack } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  displayName!: string;

  @IsEnum(ExamTrack)
  examTrack!: ExamTrack;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  region?: string;
}
