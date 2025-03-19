import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'defaultSecretKey'), // Giá trị mặc định
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.userId); 

    if (!user) {
      this.logger.warn(`Unauthorized access attempt with payload: ${ JSON.stringify(payload) }`);
      throw new UnauthorizedException('User not found or token invalid');
    }

    return user;
  }
}
