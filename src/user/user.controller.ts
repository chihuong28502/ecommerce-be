import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/role.enum';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './user.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @ResponseMessage('Lấy thông tin profile thành công')
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Get('admin-only')
  @ResponseMessage('Lấy nội dung admin thành công')
  @Roles(Role.ADMIN)
  getAdminOnly() {
    return { message: 'This is admin only content' };
  }
}