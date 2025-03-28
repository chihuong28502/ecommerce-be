import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    try {
      if (!email || !password) {
        throw new BadRequestException('Email và mật khẩu không được để trống');
      }

      const user = await this.usersService.findByEmail(email);

      if (!user) {
        throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
      }

      const userObject = user.toObject();
      const { password: _, ...result } = userObject;
      return result;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Có lỗi xảy ra khi xác thực người dùng',
      );
    }
  }

  async login(user: any) {
    try {
      if (!user || !user.email) {
        throw new BadRequestException('Thông tin người dùng không hợp lệ');
      }

      const payload = {
        email: user.email,
        userId: user._id,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);

      if (!accessToken) {
        throw new InternalServerErrorException('Không thể tạo token');
      }
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
      return {
        accessToken,
        refreshToken,
        user,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Có lỗi xảy ra trong quá trình đăng nhập',
      );
    }
  }

  async findByEmail(email: string) {
    try {
      if (!email) {
        throw new BadRequestException('Email không được để trống');
      }

      const user = await this.usersService.findByEmail(email).catch((error) => {
        if (error instanceof NotFoundException) {
          return null;
        }
        throw error;
      });

      return user;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Có lỗi xảy ra khi tìm kiếm người dùng',
      );
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      if (!registerDto.email || !registerDto.password) {
        throw new BadRequestException('Email và mật khẩu không được để trống');
      }
      // Hash password
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      if (!hashedPassword) {
        throw new InternalServerErrorException(
          'Có lỗi xảy ra khi mã hóa mật khẩu',
        );
      }
      // Tạo user mới
      const newUser = await this.usersService.create({
        ...registerDto,
        email: registerDto.email,
        password: hashedPassword
      });

      const { password, ...result } = newUser.toObject();
      return result;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Có lỗi xảy ra trong quá trình đăng ký',
      );
    }
  }

  async refreshToken(token: any) {
    try {
      // Kiểm tra token có tồn tại không
      if (!token) {
        throw new BadRequestException('Token không được để trống');
      }

      // Giải mã token
      const payload = this.jwtService.decode(token);
      if (!payload || typeof payload !== 'object' || !payload.email) {
        throw new UnauthorizedException('Token không hợp lệ');
      }

      // Tìm kiếm người dùng dựa trên email từ payload
      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        throw new UnauthorizedException(
          'Người dùng không tồn tại hoặc token không hợp lệ',
        );
      }

      // Tạo access token mới với thông tin người dùng
      const newAccessToken = this.jwtService.sign({
        email: user.email,
        userId: user._id,
        role: user.role,
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      // Nếu error là một lỗi đã biết thì chuyển tiếp lỗi đó
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      // Nếu không, ném lỗi server chung
      throw new InternalServerErrorException(
        'Có lỗi xảy ra trong quá trình làm mới token',
      );
    }
  }
}
