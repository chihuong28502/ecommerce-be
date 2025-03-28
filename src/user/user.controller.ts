import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response.decorator';
import { Role } from '@/common/decorators/roles.decorator';
import { ROLE } from '@/common/enums/role.enum';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RoleGuard } from '@/common/guards/roles.guard';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserDocument } from './schemas/user.schema';
import { UsersService } from './user.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RoleGuard)
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Get('profile')
  @ResponseMessage('Lấy thông tin profile thành công')
  getProfile(@CurrentUser() user: any): Promise<UserDocument> {
    return this.usersService.filterPassword(user);
  }

  @Get()
  @Role(ROLE.ADMIN) // Chỉ admin có thể gọi API này
  async getUsers(@Query() query: any): Promise<UserDocument[]> {
    return await this.usersService.findAll(query)
  }
}