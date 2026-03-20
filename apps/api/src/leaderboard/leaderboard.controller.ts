import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ExamTrack } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

@ApiTags('Leaderboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('top')
  @ApiOperation({ summary: 'Get top players for an exam track' })
  @ApiQuery({ name: 'examTrack', enum: ExamTrack, required: false })
  top(@Query() query: LeaderboardQueryDto) {
    return this.leaderboardService.top(query.examTrack ?? ExamTrack.JEE_MAIN);
  }
}
