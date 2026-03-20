import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GameGateway } from './game.gateway';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [GameGateway],
  exports: [GameGateway],
})
export class GameModule {}
