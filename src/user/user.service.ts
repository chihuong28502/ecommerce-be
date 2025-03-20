import { Role } from '@/common/enums/role.enum';
import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) { }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    try {
      // Validate input
      if (!createUserDto.email) {
        throw new BadRequestException('Email không được để trống');
      }

      // Kiểm tra email tồn tại
      const existingUser = await this.userModel.findOne({
        email: createUserDto.email
      });

      if (existingUser) {
        throw new ConflictException('Email đã tồn tại trong hệ thống');
      }

      // Tạo user mới
      const newUser = new this.userModel({
        ...createUserDto,
        roles: [Role.USER] // Default role
      });

      return await newUser.save();
    } catch (error) {
      if (error instanceof BadRequestException ||
        error instanceof ConflictException) {
        throw error;
      }
      if (error.code === 11000) { // MongoDB duplicate key error
        throw new ConflictException('Email đã tồn tại trong hệ thống');
      }
      throw new InternalServerErrorException('Có lỗi xảy ra khi tạo người dùng');
    }
  }

  async findById(id: string): Promise<UserDocument> {
    try {
      if (!id) {
        throw new BadRequestException('ID không được để trống');
      }

      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }
      return user;
    } catch (error) {
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException) {
        throw error;
      }
      if (error.name === 'CastError') {
        throw new BadRequestException('ID không hợp lệ');
      }
      throw new InternalServerErrorException('Có lỗi xảy ra khi tìm kiếm người dùng');
    }
  }

  async findByEmail(email: string): Promise<UserDocument> {
    try {
      if (!email) {
        throw new BadRequestException('Email không được để trống');
      }

      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }
      return user;
    } catch (error) {
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Có lỗi xảy ra khi tìm kiếm người dùng');
    }
  }

  async update(id: string, updateUserDto: any): Promise<UserDocument> {
    try {
      if (!id) {
        throw new BadRequestException('ID không được để trống');
      }

      // Hash password nếu được cung cấp
      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateUserDto, { new: true })
        .exec();

      if (!updatedUser) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Có lỗi xảy ra khi cập nhật người dùng');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      if (!id) {
        throw new BadRequestException('ID không được để trống');
      }

      const result = await this.userModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }
    } catch (error) {
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Có lỗi xảy ra khi xóa người dùng');
    }
  }

  async findAll(query: any = {}): Promise<UserDocument[]> {
    try {
      return await this.userModel.find(query).exec();
    } catch (error) {
      throw new InternalServerErrorException('Có lỗi xảy ra khi lấy danh sách người dùng');
    }
  }


  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    try {
      if (!id || !oldPassword || !newPassword) {
        throw new BadRequestException('Thiếu thông tin cần thiết');
      }

      if (newPassword.length < 6) {
        throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
      }

      const user = await this.findById(id);
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

      if (!isPasswordValid) {
        throw new BadRequestException('Mật khẩu cũ không chính xác');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.update(id, { password: hashedPassword });
    } catch (error) {
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Có lỗi xảy ra khi đổi mật khẩu');
    }
  }

  async addRole(id: string, role: Role): Promise<UserDocument> {
    try {
      if (!id || !role) {
        throw new BadRequestException('Thiếu thông tin cần thiết');
      }

      const user = await this.findById(id);
      if (!user.roles.includes(role)) {
        user.roles.push(role);
        return await user.save();
      }
      return user;
    } catch (error) {
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Có lỗi xảy ra khi thêm role');
    }
  }

  async removeRole(id: string, role: Role): Promise<UserDocument> {
    try {
      if (!id || !role) {
        throw new BadRequestException('Thiếu thông tin cần thiết');
      }

      const user = await this.findById(id);
      user.roles = user.roles.filter(r => r !== role);
      return await user.save();
    } catch (error) {
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Có lỗi xảy ra khi xóa role');
    }
  }
}