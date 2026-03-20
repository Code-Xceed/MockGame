import { IsOptional, IsString, MaxLength } from 'class-validator';

export class StartBattleDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  clientVersion?: string;
}
