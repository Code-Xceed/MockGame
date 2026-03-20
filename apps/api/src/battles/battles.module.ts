import { Module } from '@nestjs/common';
import { BattlesController } from './battles.controller';
import { BattlesService } from './battles.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GameModule } from '../game/game.module';

@Module({
  imports: [PrismaModule, AuthModule, GameModule],
  controllers: [BattlesController],
  providers: [BattlesService],
})
export class BattlesModule {}
