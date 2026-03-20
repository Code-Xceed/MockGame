import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';

@ApiTags('Matches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  @ApiOperation({ summary: 'List match history with cursor pagination' })
  @ApiQuery({ name: 'cursor', required: false })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('cursor') cursor?: string,
  ) {
    return this.matchesService.listForUser(user.userId, cursor);
  }

  @Get(':matchId')
  @ApiOperation({ summary: 'Get match detail with rounds' })
  detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('matchId') matchId: string,
  ) {
    return this.matchesService.getById(user.userId, matchId);
  }
}
