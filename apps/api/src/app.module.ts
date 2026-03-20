import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BattlesModule } from './battles/battles.module';
import { EventsModule } from './events/events.module';
import { GameModule } from './game/game.module';
import { HealthController } from './health/health.controller';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { MatchesModule } from './matches/matches.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { QuestionsModule } from './questions/questions.module';
import { RedisModule } from './redis/redis.module';
import { RoundsModule } from './rounds/rounds.module';

@Module({
  imports: [
    // Infrastructure
    PrismaModule,
    RedisModule,
    EventsModule,
    AnalyticsModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 1 minute window
      limit: 100,  // 100 requests per minute
    }]),

    // Core modules
    AuthModule,
    AdminModule,
    BattlesModule,
    ProfileModule,
    MatchmakingModule,
    MatchesModule,
    LeaderboardModule,

    // New modules
    QuestionsModule,
    RoundsModule,
    GameModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
