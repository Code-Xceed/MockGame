import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthenticatedUser } from './authenticated-user.interface';

type RequestWithUser = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      });

      request.user = {
        userId: payload.sub as string,
        email: payload.email as string,
        role: payload.role as UserRole,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) {
      return null;
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
