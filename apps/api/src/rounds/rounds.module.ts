import { Module } from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RoundsService],
  exports: [RoundsService],
})
export class RoundsModule {}
