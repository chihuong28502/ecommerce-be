import { ApiProperty } from '@nestjs/swagger';

export class UserResponse {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID của người dùng',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email của người dùng',
  })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'Tên của người dùng',
  })
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Họ của người dùng',
  })
  lastName?: string;
}

export class LoginResponse {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Thông tin người dùng',
    type: UserResponse,
  })
  user: UserResponse;
}