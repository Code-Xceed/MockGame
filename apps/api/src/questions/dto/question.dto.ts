import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { Difficulty, ExamTrack, Subject } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty({ enum: ExamTrack })
  @IsEnum(ExamTrack)
  examTrack!: ExamTrack;

  @ApiProperty({ enum: Subject })
  @IsEnum(Subject)
  subject!: Subject;

  @ApiProperty({ enum: Difficulty })
  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @ApiProperty()
  @IsString()
  body!: string;

  @ApiProperty()
  @IsString()
  optionA!: string;

  @ApiProperty()
  @IsString()
  optionB!: string;

  @ApiProperty()
  @IsString()
  optionC!: string;

  @ApiProperty()
  @IsString()
  optionD!: string;

  @ApiProperty({ description: 'Correct option: A, B, C, or D' })
  @IsString()
  correctOption!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  optionA?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  optionB?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  optionC?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  optionD?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correctOption?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class QuestionQueryDto {
  @ApiPropertyOptional({ enum: ExamTrack })
  @IsOptional()
  @IsEnum(ExamTrack)
  examTrack?: ExamTrack;

  @ApiPropertyOptional({ enum: Subject })
  @IsOptional()
  @IsEnum(Subject)
  subject?: Subject;

  @ApiPropertyOptional({ enum: Difficulty })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;
}
