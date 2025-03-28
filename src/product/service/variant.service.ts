import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateVariantDto, UpdateVariantDto } from '../dto/product.dto';
import { Product } from '../schemas/product.schema';
import { Variant } from '../schemas/variant.schema';

@Injectable()
export class VariantService {
  private readonly logger = new Logger(VariantService.name);

  constructor(
    @InjectModel(Variant.name) private variantModel: Model<Variant>,
    @InjectModel(Product.name) private productModel: Model<Product>
  ) { }

  /**
   * Tạo biến thể mới cho sản phẩm
   * @param createVariantDto Dữ liệu tạo biến thể
   * @returns Biến thể đã tạo
   */
  async create(createVariantDto: CreateVariantDto): Promise<Variant> {
    const session = await this.variantModel.startSession();
    session.startTransaction();

    try {
      // Validate product
      const product = await this.productModel.findById(createVariantDto.product);
      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID ${createVariantDto.product}`);
      }

      // Kiểm tra sự tồn tại của biến thể với size và color
      const existingVariant = await this.variantModel.findOne({
        product: createVariantDto.product,
        size: createVariantDto.size,
        color: createVariantDto.color
      });

      if (existingVariant) {
        throw new BadRequestException('Biến thể với size và color này đã tồn tại');
      }

      // Tạo biến thể mới
      const newVariant = new this.variantModel({
        ...createVariantDto,
        isAvailable: createVariantDto.isAvailable ?? true,
        stock: createVariantDto.stock || 0
      });

      // Lưu biến thể
      const savedVariant = await newVariant.save({ session });

      // Cập nhật sản phẩm
      await this.productModel.findByIdAndUpdate(
        createVariantDto.product,
        { $push: { variants: savedVariant._id } },
        { session }
      );

      // Cập nhật availableSizes và availableColors
      await this.updateProductSizesAndColors(createVariantDto.product, session);

      // Commit transaction
      await session.commitTransaction();

      return savedVariant;
    } catch (error) {
      // Rollback transaction
      await session.abortTransaction();

      this.logger.error(`Lỗi tạo biến thể: ${error.message}`, error.stack);

      // Xử lý các loại lỗi cụ thể
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      // Lỗi trùng key
      if (error.code === 11000) {
        throw new BadRequestException('Biến thể đã tồn tại');
      }

      throw new BadRequestException('Không thể tạo biến thể');
    } finally {
      // Kết thúc session
      session.endSession();
    }
  }

  /**
   * Cập nhật biến thể
   * @param id ID biến thể
   * @param updateVariantDto Dữ liệu cập nhật
   * @returns Biến thể đã cập nhật
   */
  async update(id: string, updateVariantDto: UpdateVariantDto): Promise<Variant> {
    const session = await this.variantModel.startSession();
    session.startTransaction();

    try {
      // Validate ID
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID biến thể không hợp lệ');
      }

      // Tìm biến thể hiện tại
      const existingVariant: any = await this.variantModel.findById(id);
      if (!existingVariant) {
        throw new NotFoundException('Không tìm thấy biến thể');
      }

      // Kiểm tra sự tồn tại của biến thể với size và color
      if (updateVariantDto.size || updateVariantDto.color) {
        const duplicateVariant = await this.variantModel.findOne({
          _id: { $ne: id },
          product: existingVariant.product,
          size: updateVariantDto.size || existingVariant.size,
          color: updateVariantDto.color || existingVariant.color
        });

        if (duplicateVariant) {
          throw new BadRequestException('Biến thể với size và color này đã tồn tại');
        }
      }

      // Cập nhật biến thể
      const updatedVariant: any = await this.variantModel
        .findByIdAndUpdate(
          id,
          {
            ...updateVariantDto,
            isAvailable: updateVariantDto.isAvailable ?? existingVariant.isAvailable
          },
          {
            new: true,
            runValidators: true
          }
        )
        .session(session);

      await this.updateProductSizesAndColors(existingVariant.product, session);

      // Commit transaction
      await session.commitTransaction();

      return updatedVariant;
    } catch (error) {
      // Rollback transaction
      await session.abortTransaction();

      this.logger.error(`Lỗi cập nhật biến thể: ${error.message}`, error.stack);

      // Xử lý các loại lỗi cụ thể
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Không thể cập nhật biến thể');
    } finally {
      // Kết thúc session
      session.endSession();
    }
  }

  /**
   * Xóa biến thể
   * @param id ID biến thể
   * @returns Thông báo xóa
   */
  async remove(id: string): Promise<{ message: string }> {
    const session = await this.variantModel.startSession();
    session.startTransaction();

    try {
      // Validate ID
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID biến thể không hợp lệ');
      }

      // Tìm biến thể
      const variant: any = await this.variantModel.findById(id);
      if (!variant) {
        throw new NotFoundException('Không tìm thấy biến thể');
      }

      // Xóa biến thể
      await this.variantModel.findByIdAndDelete(id).session(session);

      // Xóa tham chiếu biến thể khỏi sản phẩm
      await this.productModel.findByIdAndUpdate(
        variant.product,
        { $pull: { variants: id } },
        { session }
      );

      // Cập nhật availableSizes và availableColors
      await this.updateProductSizesAndColors(variant.product, session);

      // Commit transaction
      await session.commitTransaction();

      return { message: 'Xóa biến thể thành công' };
    } catch (error) {
      // Rollback transaction
      await session.abortTransaction();

      this.logger.error(`Lỗi xóa biến thể: ${error.message}`, error.stack);

      // Xử lý các loại lỗi cụ thể
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Không thể xóa biến thể');
    } finally {
      // Kết thúc session
      session.endSession();
    }
  }

  /**
   * Cập nhật tồn kho cho biến thể
   * @param id ID biến thể
   * @param quantity Số lượng thay đổi
   * @returns Biến thể đã cập nhật
   */
  async updateStock(id: string, quantity: number): Promise<Variant> {
    const session = await this.variantModel.startSession();
    session.startTransaction();

    try {
      // Validate ID
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID biến thể không hợp lệ');
      }

      // Tìm biến thể
      const variant: any = await this.variantModel.findById(id);
      if (!variant) {
        throw new NotFoundException('Không tìm thấy biến thể');
      }

      // Kiểm tra số lượng tồn kho
      if (variant.stock + quantity < 0) {
        throw new BadRequestException('Số lượng tồn kho không đủ');
      }

      // Cập nhật tồn kho
      const updatedVariant: any = await this.variantModel
        .findByIdAndUpdate(
          id,
          {
            $inc: {
              stock: quantity,
              soldCount: quantity < 0 ? Math.abs(quantity) : 0
            }
          },
          {
            new: true,
            runValidators: true
          }
        )
        .session(session);

      // Cập nhật trạng thái tồn kho của sản phẩm
      await this.updateProductStockStatus(variant.product, session);

      // Commit transaction
      await session.commitTransaction();

      return updatedVariant;
    } catch (error) {
      // Rollback transaction
      await session.abortTransaction();

      this.logger.error(`Lỗi cập nhật tồn kho: ${error.message}`, error.stack);

      // Xử lý các loại lỗi cụ thể
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Không thể cập nhật tồn kho');
    } finally {
      // Kết thúc session
      session.endSession();
    }
  }

  /**
   * Lấy danh sách biến thể của sản phẩm
   * @param productId ID sản phẩm
   * @returns Danh sách biến thể
   */
  async findByProduct(productId: string): Promise<Variant[]> {
    // Validate ID
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }

    // Kiểm tra sản phẩm tồn tại
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    // Lấy danh sách biến thể
    return await this.variantModel.find({ product: productId });
  }

  /**
   * Cập nhật sizes và colors của sản phẩm
   * @param productId ID sản phẩm
   * @param session Mongoose session
   */
  private async updateProductSizesAndColors(productId: string, session: any): Promise<void> {
    // Lấy tất cả các biến thể của sản phẩm
    const variants = await this.variantModel.find({ product: productId });

    // Trích xuất sizes và colors duy nhất
    const availableSizes = [...new Set(variants.map(v => v.size))];
    const availableColors = [...new Set(variants.map(v => v.color))];

    // Cập nhật sản phẩm
    await this.productModel.findByIdAndUpdate(
      productId,
      {
        availableSizes,
        availableColors
      },
      { session }
    );
  }

  /**
   * Cập nhật trạng thái tồn kho của sản phẩm
   * @param productId ID sản phẩm
   * @param session Mongoose session
   */
  private async updateProductStockStatus(productId: string, session: any): Promise<void> {
    // Kiểm tra tồn kho của các biến thể
    const variantsStock = await this.variantModel.aggregate([
      { $match: { product: new Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          totalStock: { $sum: '$stock' }
        }
      }
    ]);

    // Cập nhật trạng thái tồn kho của sản phẩm
    await this.productModel.findByIdAndUpdate(
      productId,
      {
        isInStock: variantsStock[0]?.totalStock > 0
      },
      { session }
    );
  }
}