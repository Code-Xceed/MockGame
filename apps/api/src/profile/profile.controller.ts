import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile with ratings' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getProfile(user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.userId, body);
  }
}
