import { CategoryService } from '@/category/category.service';
import { Category } from '@/category/schemas/category.schema';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import { Product } from '../schemas/product.schema';
import { Review } from '../schemas/review.schema';
import { Variant } from '../schemas/variant.schema';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,

    @InjectModel(Variant.name) private variantModel: Model<Variant>,
    private readonly categoryService: CategoryService
  ) { }

  /**
    * Tạo sản phẩm mới
    * @param createProductDto Dữ liệu tạo sản phẩm
    * @param user Người dùng tạo sản phẩm
    * @returns Sản phẩm đã tạo
    */
  async create(createProductDto: CreateProductDto, user: any): Promise<any> {
    const session = await this.productModel.startSession();
    session.startTransaction();

    try {
      // Validate category
      const category: any = await this.categoryService.findLevelById(createProductDto.category);
      if (!category) {
        throw new NotFoundException(`Không tìm thấy danh mục với ID ${createProductDto.category}`);
      }
      if (category.level !== 3) {
        throw new BadRequestException('Sản phẩm chỉ được thêm vào danh mục cấp 3');
      }

      // Tạo slug từ tên sản phẩm
      const slug = this.generateSlug(createProductDto.name);

      // Kiểm tra slug đã tồn tại chưa
      const existingProduct = await this.productModel.findOne({ slug });
      if (existingProduct) {
        throw new BadRequestException('Sản phẩm với slug này đã tồn tại');
      }

      // Tạo mã sản phẩm duy nhất
      const code = `PROD-${uuidv4().split('-')[0].toUpperCase()}`;

      // Tạo sản phẩm mới
      const newProduct = new this.productModel({
        ...createProductDto,
        slug,
        code,
        // createdBy: user?._id,
        variants: [], // Khởi tạo mảng variants rỗng
      });

      // Lưu sản phẩm
      const product = await newProduct.save({ session });

      // Commit transaction
      await session.commitTransaction();

      // Trả về sản phẩm đã tạo với thông tin đầy đủ
      return await this.productModel
        .findById(product._id)
        .populate('category')
        .populate('createdBy', 'email firstName lastName')
        .exec();

    } catch (error) {
      // Rollback transaction
      await session.abortTransaction();

      this.logger.error(`Lỗi tạo sản phẩm: ${error.message}`, error.stack);

      // Xử lý các loại lỗi cụ thể
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      // Lỗi trùng key
      if (error.code === 11000) {
        throw new BadRequestException('Sản phẩm hoặc mã sản phẩm đã tồn tại');
      }

      throw new BadRequestException('Không thể tạo sản phẩm');
    } finally {
      // Kết thúc session
      session.endSession();
    }
  }

  /**
   * Cập nhật sản phẩm
   * @param id ID sản phẩm
   * @param updateProductDto Dữ liệu cập nhật
   * @param user Người dùng cập nhật
   * @returns Sản phẩm đã cập nhật
   */
  async update(id: string, updateProductDto: UpdateProductDto, user: any): Promise<Product> {
    const session = await this.productModel.startSession();
    session.startTransaction();

    try {
      // Validate ID
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID sản phẩm không hợp lệ');
      }

      // Tìm sản phẩm hiện tại
      const existingProduct = await this.productModel.findById(id);
      if (!existingProduct) {
        throw new NotFoundException('Không tìm thấy sản phẩm');
      }

      // Tạo slug mới nếu tên thay đổi
      let slug = existingProduct.slug;
      if (updateProductDto.name) {
        slug = this.generateSlug(updateProductDto.name);

        // Kiểm tra slug trùng
        const duplicateSlug = await this.productModel.findOne({
          slug,
          _id: { $ne: id }
        });
        if (duplicateSlug) {
          throw new BadRequestException('Sản phẩm với slug này đã tồn tại');
        }
      }

      // Chuẩn bị dữ liệu cập nhật
      const updateData = {
        ...updateProductDto,
        slug,
        createdBy: user?._id
      };

      // Cập nhật sản phẩm
      const updatedProduct: any = await this.productModel
        .findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true
        })
        .populate('category')
        .populate('variants')
        .populate('createdBy', 'email firstName lastName')
        .session(session);

      // Commit transaction
      await session.commitTransaction();

      return updatedProduct;

    } catch (error) {
      // Rollback transaction
      await session.abortTransaction();

      this.logger.error(`Lỗi cập nhật sản phẩm: ${error.message}`, error.stack);

      // Xử lý các loại lỗi cụ thể
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Không thể cập nhật sản phẩm');
    } finally {
      // Kết thúc session
      session.endSession();
    }
  }

  /**
   * Xóa sản phẩm và các biến thể liên quan
   * @param id ID sản phẩm
   * @returns Thông báo xóa
   */
  async remove(id: string): Promise<{ message: string }> {
    const session = await this.productModel.startSession();
    session.startTransaction();

    try {
      // Validate ID
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID sản phẩm không hợp lệ');
      }

      // Tìm sản phẩm
      const product = await this.productModel.findById(id);
      if (!product) {
        throw new NotFoundException('Không tìm thấy sản phẩm');
      }

      // Xóa các biến thể liên quan
      await this.variantModel.deleteMany({ product: id });

      // Xóa sản phẩm
      await this.productModel.findByIdAndDelete(id).session(session);

      // Commit transaction
      await session.commitTransaction();

      return { message: 'Xóa sản phẩm thành công' };

    } catch (error) {
      // Rollback transaction
      await session.abortTransaction();

      this.logger.error(`Lỗi xóa sản phẩm: ${error.message}`, error.stack);

      // Xử lý các loại lỗi cụ thể
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Không thể xóa sản phẩm');
    } finally {
      // Kết thúc session
      session.endSession();
    }
  }

  /**
   * Tạo slug từ tên sản phẩm
   * @param name Tên sản phẩm
   * @returns Slug được tạo
   */
  private generateSlug(name: string): string {
    return slugify(name, {
      lower: true,
      strict: true,
      trim: true
    });
  }

  async findAll(query: any = {}): Promise<Product[]> {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      category,
      gender,
      productType,
      minPrice,
      maxPrice,
      isFeatured,
      isNew,
      isBestseller,
      search,
    } = query;

    // Xây dựng điều kiện lọc
    const filter: any = { isActive: true };

    if (category) filter.category = category;
    if (gender) filter.gender = gender;
    if (productType) filter.productType = productType;
    if (isFeatured) filter.isFeatured = true;
    if (isNew) filter.isNew = true;
    if (isBestseller) filter.isBestseller = true;

    // Lọc theo khoảng giá
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = minPrice;
      if (maxPrice) filter.price.$lte = maxPrice;
    }

    // Tìm kiếm toàn văn
    if (search) {
      filter.$text = { $search: search };
    }

    return await this.productModel
      .find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name')
      .populate('variants')
      .exec();
  }

  async findOne(id: string): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }

    const product = await this.productModel
      .findById(id)
      .populate('category')
      .populate('variants')
      .populate('reviews')
      .populate('createdBy', 'email firstName lastName')
      .exec();

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productModel
      .findOne({ slug })
      .populate('category')
      .populate('variants')
      .populate('reviews')
      .populate('createdBy', 'email firstName lastName')
      .exec();

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    return product;
  }


  async getChildCategories(categoryId: string): Promise<string[]> {
    const categories = await this.categoryModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(categoryId) }
      },
      {
        $graphLookup: {
          from: "categories",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parentCategory",
          as: "subcategories",
        },
      },
      {
        $project: {
          _id: 1,
          level: 1,
          subcategories: {
            _id: 1,
            level: 1
          }
        }
      }
    ]);

    if (!categories.length) return [];

    const mainCategory = categories[0];

    // Danh sách chỉ chứa các danh mục **cấp 3**
    const filteredSubcategories = mainCategory.subcategories
      .filter(cat => cat.level === 3)
      .map(cat => cat._id.toString());

    // Nếu danh mục gốc là cấp 3, thì giữ lại, ngược lại bỏ đi
    return mainCategory.level === 3
      ? [categoryId, ...filteredSubcategories]
      : filteredSubcategories;
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const categoryIds = await this.getChildCategories(categoryId);
    return this.productModel.find({ category: { $in: categoryIds } }).populate("variants").exec();
  }
}