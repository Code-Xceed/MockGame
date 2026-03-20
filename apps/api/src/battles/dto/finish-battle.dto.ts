import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class FinishBattleDto {
  @IsInt()
  @Min(0)
  @Max(3)
  playerAScore!: number;

  @IsInt()
  @Min(0)
  @Max(3)
  playerBScore!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;
}
