import { Module } from '@nestjs/common';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingService } from './matchmaking.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { GameModule } from '../game/game.module';

@Module({
  imports: [PrismaModule, AuthModule, RedisModule, GameModule],
  controllers: [MatchmakingController],
  providers: [MatchmakingService],
})
export class MatchmakingModule {}
