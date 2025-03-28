import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private configService: ConfigService) { }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'store',
  ): Promise<CloudinaryResponse> {
    try {
      if (!file) {
        throw new BadRequestException('Không có file được tải lên');
      }
      return new Promise<CloudinaryResponse>((resolve, reject) => {
        // Create upload stream
        const uploadOptions: any = {
          folder,
          resource_type: 'auto',
        };

        // The correct way to use upload_stream
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              this.logger.error(`Upload error: ${error.message}`);
              return reject(new BadRequestException(`Upload thất bại: ${error.message}`));
            }

            if (!result) {
              return reject(new BadRequestException('Upload thất bại: Không nhận được kết quả từ Cloudinary'));
            }

            // This callback is executed after upload completes
            resolve({
              url: result.secure_url,
              publicId: result.public_id
            });
          }
        );

        // Stream file buffer to Cloudinary
        const fileStream = Readable.from(file.buffer);
        fileStream.pipe(uploadStream);
      });
    } catch (error) {
      this.logger.error(`Upload error: ${error.message}`);
      throw new BadRequestException(`Upload thất bại: ${error.message}`);
    }
  }

  async uploadFiles(
    files: Express.Multer.File[],
    folder = 'store',
  ): Promise<CloudinaryResponse[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Không có file được tải lên');
    }

    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  async uploadBase64Image(
    base64String: string,
    folder = 'store',
  ): Promise<CloudinaryResponse> {
    try {
      if (!base64String) {
        throw new BadRequestException('Không có dữ liệu hình ảnh');
      }

      // Ensure the base64 string has the correct format
      if (!base64String.startsWith('data:image')) {
        throw new BadRequestException('Dữ liệu không phải là hình ảnh hợp lệ');
      }

      // Upload to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(base64String, {
        folder,
        resource_type: 'image',
      });

      return {
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
      };
    } catch (error) {
      this.logger.error(`Base64 upload error: ${error.message}`);
      throw new BadRequestException(`Upload thất bại: ${error.message}`);
    }
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      this.logger.error(`Delete error: ${error.message}`);
      throw new BadRequestException(`Xóa thất bại: ${error.message}`);
    }
  }

  async deleteFiles(publicIds: string[]): Promise<boolean> {
    try {
      if (!publicIds || publicIds.length === 0) {
        throw new BadRequestException('Không có mã định danh public nào được cung cấp');
      }
      const result = await cloudinary.api.delete_resources(publicIds);
      const deletedCount = Object.keys(result.deleted || {}).length;
      this.logger.log(`Đã xóa ${deletedCount}/${publicIds.length} tài nguyên`);
      if (result.partial) {
        this.logger.warn('Xóa một phần: Một số tài nguyên không thể xóa được');
      }
      return true;
    } catch (error) {
      this.logger.error(`Lỗi khi xóa nhiều file: ${error.message}`, error.stack);
      throw new BadRequestException(`Xóa thất bại: ${error.message}`);
    }
  }

  async deleteFolder(folder: string): Promise<boolean> {
    try {
      // Delete all files in the folder first
      const resources = await this.getFolderResources(folder);
      if (resources.length > 0) {
        const publicIds = resources.map((res) => res.public_id);
        await this.deleteFiles(publicIds);
      }

      // Then delete the folder
      await cloudinary.api.delete_folder(folder);
      return true;
    } catch (error) {
      this.logger.error(`Delete folder error: ${error.message}`);
      throw new BadRequestException(`Xóa thư mục thất bại: ${error.message}`);
    }
  }

  async getFolderResources(folder: string): Promise<any[]> {
    try {
      const result = await cloudinary.search
        .expression(`folder:${folder}`)
        .max_results(500)
        .execute();
      return result.resources;
    } catch (error) {
      this.logger.error(`Get folder resources error: ${error.message}`);
      throw new BadRequestException(
        `Lấy danh sách tài nguyên thất bại: ${error.message}`,
      );
    }
  }

  generateSignature(paramsToSign: any): string {
    return cloudinary.utils.api_sign_request(
      paramsToSign,
      this.configService.getOrThrow<string>('CLOUDINARY_API_SECRET'),
    );
  }

  generateUploadUrl(folder: string): {
    timestamp: number;
    signature: string;
    apiKey: string;
    folder: string;
  } {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      timestamp,
      folder,
      // Thêm các tham số khác nếu cần
    };
    return {
      timestamp,
      signature: this.generateSignature(params),
      apiKey: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      folder,
    };
  }
}

export interface CloudinaryResponse {
  url: string;
  publicId: string;
}