import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email đăng ký tài khoản',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Mật khẩu đăng ký',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'Tên của người dùng',
    required: false, // 👈 Không bắt buộc
  })
  @IsString({ message: 'firstName phải là chuỗi' })
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Họ của người dùng',
    required: false, // 👈 Không bắt buộc
  })
  @IsString({ message: 'lastName phải là chuỗi' })
  @IsOptional()
  lastName?: string;
}
