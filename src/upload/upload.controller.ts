import { ResponseMessage } from '@/common/decorators/response.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryResponse, UploadService } from './upload.service';
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ResponseMessage('Tải lên thành công')
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string = 'store',
  ): Promise<CloudinaryResponse> {
    return this.uploadService.uploadFile(file, folder);
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10)) // Giới hạn 10 files
  @ResponseMessage('Tải lên thành công')
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder: string = 'store',
  ): Promise<CloudinaryResponse[]> {
    return this.uploadService.uploadFiles(files, folder);
  }

  @Post('upload-base64')
  @ResponseMessage('Tải lên thành công')
  async uploadBase64(
    @Body('base64') base64String: string,
    @Body('folder') folder: string = 'store',
  ): Promise<CloudinaryResponse> {
    return this.uploadService.uploadBase64Image(base64String, folder);
  }

  @Delete(':publicId')
  @ResponseMessage('Xóa thành công')
  async deleteFile(@Param('publicId') publicId: string): Promise<{ success: boolean }> {
    const result = await this.uploadService.deleteFile(publicId);
    if (!result) {
      throw new BadRequestException('Không thể xóa file');
    }
    return { success: true };
  }

  @Delete('multi')
  @ResponseMessage('Xóa thành công nhiều file')
  async deleteMultipleFiles(@Body() body: { publicIds: string[] }
  ): Promise<{ success: boolean; deletedCount: number }> {
    // Kiểm tra đầu vào
    if (!body.publicIds || !Array.isArray(body.publicIds) || body.publicIds.length === 0) {
      throw new BadRequestException('Vui lòng cung cấp mảng các public ID hợp lệ');
    }
    
    const result = await this.uploadService.deleteFiles(body.publicIds);
    if (!result) {
      throw new BadRequestException('Không thể xóa file');
    }
    return { 
      success: result, 
      deletedCount: body.publicIds.length 
    };
  }
  @Delete('folder/:folderName')
  @ResponseMessage('Xóa thư mục thành công')
  async deleteFolder(@Param('folderName') folderName: string): Promise<{ success: boolean }> {
    const result = await this.uploadService.deleteFolder(folderName);
    return { success: result };
  }

  @Get('signature')
  @ResponseMessage('Lấy chữ ký thành công')
  generateSignature(@Body('folder') folder: string = 'store') {
    return this.uploadService.generateUploadUrl(folder);
  }
}