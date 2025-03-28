import { Public } from '@/common/decorators/public.decorator';
import { ResponseMessage } from '@/common/decorators/response.decorator';
import { UserDocument } from '@/user/schemas/user.schema';
import { UsersService } from '@/user/user.service';
import { Body, ConflictException, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginResponse } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  // Cấu hình cookie mặc định
  private readonly COOKIE_CONFIG = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  } as const;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService

  ) { }

  private setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie('refreshToken', token, this.COOKIE_CONFIG);
  }

  @Public()
  @Post('login')
  @ResponseMessage('Đăng nhập thành công')
  @ApiOperation({ summary: 'Đăng nhập người dùng' })
  @ApiResponse({
    status: 200,
    type: LoginResponse,
    description: 'Đăng nhập thành công'
  })
  async login(
    @Body() { email, password }: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const { accessToken, refreshToken, user: userDetails } =
      await this.authService.login(user);

    this.setRefreshTokenCookie(res, refreshToken);

    return { accessToken, user: userDetails };
  }

  @Public()
  @Post('register')
  @ResponseMessage('Đăng ký tài khoản thành công')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({
    status: 201,
    type: LoginResponse,
    description: 'Đăng ký thành công'
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<UserDocument> {
    const existingUser = await this.authService.findByEmailByRegister(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email đã tồn tại trong hệ thống');
    }
    return await this.authService.register(registerDto);
  }

  @Public()
  @Post('refresh')
  @ResponseMessage('Làm mới token successfully')
  async refreshToken(@Req() req: any): Promise<{ accessToken: string }> {
    const token = req.cookies['refreshToken'];
    return this.authService.refreshToken(token);
  }

  @Public()
  @Get('verify-email')
  @ResponseMessage('Xác thực tài khoản thành công')
  @HttpCode(HttpStatus.OK)
  async activeAccountByEmail(@Query('token') token: string): Promise<{ success: boolean }> {
    const verifiedEmail = await this.authService.verifyToken(token);
    return await this.userService.activateAccount(verifiedEmail.email);
  }
}
