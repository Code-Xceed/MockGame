import { IsIn, IsInt, Max, Min } from 'class-validator';

export class SubmitAnswerDto {
  @IsInt()
  @Min(1)
  @Max(3)
  roundNumber!: number;

  @IsIn(['A', 'B', 'C', 'D'])
  answer!: 'A' | 'B' | 'C' | 'D';

  @IsInt()
  @Min(0)
  @Max(120000)
  timeMs!: number;
}
