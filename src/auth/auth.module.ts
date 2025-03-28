import { CartModule } from '@/cart/cart.module';
import { User, UserSchema } from '@/user/schemas/user.schema';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailConsumer } from './consumers/email.consumer';
import { EmailService } from './email.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UsersModule,
    CartModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueueAsync({
      name: 'send-email'
    }),
  ],
  providers: [AuthService, JwtStrategy, EmailService, EmailConsumer],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule { }