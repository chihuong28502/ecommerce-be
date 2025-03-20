import { ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";

// @/common/exceptions/auth.exception.ts
export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Email hoặc mật khẩu không chính xác');
  }
}

export class UserExistsException extends ConflictException {
  constructor(email: string) {
    super(`Email ${email} đã tồn tại trong hệ thống`);
  }
}

export class UserNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`Không tìm thấy người dùng với ${identifier}`);
  }
}