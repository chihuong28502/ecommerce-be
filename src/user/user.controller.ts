import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseMessage } from 'src/common/decorators/response.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
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