import { CartService } from '@/cart/cart.service';
import { User, UserDocument } from '@/user/schemas/user.schema';
import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Queue } from 'bull';
import { OAuth2Client } from 'google-auth-library';
import { Model } from 'mongoose';
import { UsersService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { generatePassword } from './utils/func';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private usersService: UsersService, private cartService: CartService,
    private configService: ConfigService, private jwtService: JwtService,
    @InjectQueue('send-email') private sendMail: Queue,
  ) { }
  async login(user: any) {
    try {
      if (!user || !user.email) {
        throw new BadRequestException('Thông tin người dùng không hợp lệ');
      }

      const payload: any = {
        email: user.email,
        _id: user._id,
        role: user.role,
      };
      const accessToken = await this.generateAccessToken(payload);
      if (!accessToken) {
        throw new InternalServerErrorException('Không thể tạo token');
      }
      const refreshToken = await this.generateRefreshToken(payload);
      if (!refreshToken) {
        throw new InternalServerErrorException('Không thể tạo token');
      }
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

  async loginGoogle(token: string): Promise<any> {
    const client = new OAuth2Client(
      this.configService.getOrThrow('CLIENT_ID_GOOGLE_CONSOLE'),
    );

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: this.configService.getOrThrow('CLIENT_ID_GOOGLE_CONSOLE'),
    });
    const payload: any = ticket.getPayload();
    const { email } = payload;
    let user = await this.userModel.findOne({ email });
    if (!user) {
      const password = generatePassword();
      await this.sendMail.add('send-info-o2', { email: email, password: password },
        { removeOnComplete: true });

      const hashedPassword = await bcrypt.hash(password, 10);
      user = await this.userModel.create({
        email: email,
        firstName: email,
        lastName: email,
        isActive: true,
        role: 'user',
        password: hashedPassword,
      });
    }
    const payloadUser: any = {
      email: user.email,
      _id: user._id,
      role: user.role,
    };
    const accessToken = await this.generateAccessToken(payloadUser);
    if (!accessToken) {
      throw new InternalServerErrorException('Không thể tạo token');
    }
    const refreshToken = await this.generateRefreshToken(payloadUser);
    if (!refreshToken) {
      throw new InternalServerErrorException('Không thể tạo token');
    }
    return {
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<UserDocument> {
    try {
      if (!registerDto.email || !registerDto.password) {
        throw new BadRequestException('Email và mật khẩu không được để trống');
      }
      const existingUser = await this.findByEmailByRegister(registerDto.email);

      if (existingUser) {
        throw new ConflictException('Email đã tồn tại trong hệ thống');
      }
      // Hash password
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      if (!hashedPassword) {
        throw new InternalServerErrorException(
          'Có lỗi xảy ra khi mã hóa mật khẩu',
        );
      }
      // Tạo user mới
      const newUser: UserDocument = await this.usersService.create({
        ...registerDto,
        email: registerDto.email,
        password: hashedPassword
      })
      if (!newUser || !newUser._id) {
        throw new InternalServerErrorException('Có lỗi xảy ra khi tạo người dùng hoặc không có _id hợp lệ',);
      }
      await this.cartService.createCartForUser(newUser._id.toString());
      const url = this.generateUrlVerificationToken(registerDto.email);
      await this.sendMail.add('register', { email: registerDto.email, verificationUrl: url },
        { removeOnComplete: true });
      return newUser.toObject()
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

  async refreshToken(token: any): Promise<{ accessToken: string }> {
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
      const newPayload: any = {
        email: user.email,
        _id: user._id,
        role: user.role,
      }
      const newAccessToken = await this.generateAccessToken(newPayload);
      if (!newAccessToken) {
        throw new InternalServerErrorException('Không thể tạo token');
      }
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


  async generateUrlVerificationToken(email: string): Promise<string> {
    const hostClient = await this.configService.get('NEXT_URL_CLIENT') || "http://localhost:4000";
    const token = this.jwtService.sign({ email }, { expiresIn: '5m' });
    const verificationUrl = `${hostClient}/verify-email?token=${token}`;
    return verificationUrl;
  }

  async verifyToken(token: string) {
    try {
      return await this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException('Hãy thử yêu cầu lại');
    }
  }

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

      const { password: _, ...result } = user.toObject();
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

  async findByEmailByRegister(email: string) {
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

  private async generateAccessToken(user: UserDocument): Promise<string> {
    const payload = {
      email: user.email,
      _id: user._id,
      role: user.role,
    };
    const accessTokenExpiry = this.configService.get<string>('TOKEN_TIME_ACCESS') || '1h';

    return this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiry
    });
  }
  private async generateRefreshToken(user: UserDocument): Promise<string> {
    const payload = {
      email: user.email,
      _id: user._id,
      role: user.role,
    };
    const refreshTokenExpiry = this.configService.get<string>('TOKEN_TIME_REFRESH') || '7d';
    return this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiry
    });
  }
}
