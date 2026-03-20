import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { BattlesService } from './battles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { FinishBattleDto } from './dto/finish-battle.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { StartBattleDto } from './dto/start-battle.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Battles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('battles')
export class BattlesController {
  constructor(private readonly battlesService: BattlesService) {}

  @Post(':matchId/start')
  @ApiOperation({ summary: 'Start a battle (transition match to ACTIVE)' })
  start(
    @CurrentUser() user: AuthenticatedUser,
    @Param('matchId') matchId: string,
    @Body() body: StartBattleDto,
  ) {
    return this.battlesService.startBattle(user.userId, matchId, body);
  }

  @Post(':matchId/answer')
  @ApiOperation({ summary: 'Submit answer for an active round (authoritative scoring)' })
  submitAnswer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('matchId') matchId: string,
    @Body() body: SubmitAnswerDto,
  ) {
    return this.battlesService.submitAnswer(user.userId, matchId, body);
  }

  @Post(':matchId/finish')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Finish a battle and calculate rating changes' })
  finish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('matchId') matchId: string,
    @Body() body: FinishBattleDto,
  ) {
    return this.battlesService.finishBattle(user.userId, user.role, matchId, body);
  }

  @Post(':matchId/quit')
  @ApiOperation({
    summary: 'Quit an active battle and notify both players to return to /play',
  })
  quit(@CurrentUser() user: AuthenticatedUser, @Param('matchId') matchId: string) {
    return this.battlesService.quitBattle(user.userId, matchId);
  }

  @Get(':matchId')
  @ApiOperation({ summary: 'Get battle detail with ratings' })
  detail(@CurrentUser() user: AuthenticatedUser, @Param('matchId') matchId: string) {
    return this.battlesService.getBattleDetail(user.userId, matchId);
  }
}
