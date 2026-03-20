import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { PrismaModule } from '../prisma/prisma.module';

const jwtExpiresInSeconds = Number(
  process.env.JWT_EXPIRES_IN_SECONDS ?? 60 * 60 * 24 * 7,
);

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: jwtExpiresInSeconds },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, RefreshTokenService, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
