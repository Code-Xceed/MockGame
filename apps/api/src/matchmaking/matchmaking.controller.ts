import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MatchmakingService } from './matchmaking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { JoinQueueDto } from './dto/join-queue.dto';

@ApiTags('Matchmaking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matchmaking')
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  @Post('queue/join')
  @ApiOperation({ summary: 'Join the matchmaking queue' })
  joinQueue(@CurrentUser() user: AuthenticatedUser, @Body() body: JoinQueueDto) {
    return this.matchmakingService.joinQueue(user.userId, body);
  }

  @Post('queue/leave')
  @ApiOperation({ summary: 'Leave the matchmaking queue' })
  leaveQueue(@CurrentUser() user: AuthenticatedUser, @Body() body: JoinQueueDto) {
    return this.matchmakingService.leaveQueue(user.userId, body.examTrack);
  }

  @Get('queue/status')
  @ApiOperation({ summary: 'Check current queue status' })
  queueStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.matchmakingService.queueStatus(user.userId);
  }

  @Post('match/:matchId/dismiss')
  @ApiOperation({ summary: 'Dismiss an unstarted FOUND match for current user' })
  dismissFoundMatch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('matchId') matchId: string,
  ) {
    return this.matchmakingService.dismissFoundMatch(user.userId, matchId);
  }
}
