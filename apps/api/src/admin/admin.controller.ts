import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard summary stats' })
  stats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List users for admin panel (cursor pagination)' })
  @ApiQuery({ name: 'cursor', required: false })
  users(@Query('cursor') cursor?: string) {
    return this.adminService.listUsers(cursor);
  }

  @Get('matches')
  @ApiOperation({ summary: 'List matches for admin panel (cursor pagination)' })
  @ApiQuery({ name: 'cursor', required: false })
  matches(@Query('cursor') cursor?: string) {
    return this.adminService.listMatches(cursor);
  }

  @Get('questions')
  @ApiOperation({ summary: 'List questions for admin panel (cursor pagination)' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  questions(
    @Query('cursor') cursor?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.adminService.listQuestions(cursor, includeInactive === 'true');
  }

  @Get('anti-cheat/flags')
  @ApiOperation({ summary: 'List anti-cheat flags (cursor pagination)' })
  @ApiQuery({ name: 'cursor', required: false })
  antiCheatFlags(@Query('cursor') cursor?: string) {
    return this.adminService.listAntiCheatFlags(cursor);
  }
}
