import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import slugify from 'slugify';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Category } from './schemas/category.schema';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) { }

  // Tạo danh mục mới
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      // Tạo slug từ tên danh mục
      const slug = this.generateSlug(createCategoryDto.name);

      // Kiểm tra slug đã tồn tại chưa
      const existingCategory = await this.categoryModel.findOne({ slug }).exec();
      if (existingCategory) {
        throw new BadRequestException(`Danh mục với slug "${slug}" đã tồn tại`);
      }

      // Xác định cấp độ của danh mục
      let level = 1;
      if (createCategoryDto.parentCategory) {
        const parentCategory = await this.categoryModel.findById(createCategoryDto.parentCategory).exec();
        if (!parentCategory) {
          throw new NotFoundException(`Không tìm thấy danh mục cha với ID ${createCategoryDto.parentCategory}`);
        }
        level = parentCategory.level + 1;
      }

      // Tạo danh mục mới
      const newCategory = new this.categoryModel({
        ...createCategoryDto,
        slug,
        level,
      });

      return await newCategory.save();
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Không thể tạo danh mục: ${error.message}`);
    }
  }

  // Lấy tất cả danh mục
  async findAll(query: any = {}): Promise<Category[]> {
    try {
      return await this.categoryModel.find(query)
        .sort({ order: 1 })
        .populate('parentCategory')
        .exec();
    } catch (error) {
      throw new BadRequestException(`Không thể lấy danh sách danh mục: ${error.message}`);
    }
  }

  // Lấy danh mục theo ID
  async findById(id: string): Promise<Category> {
    try {
      const category = await this.categoryModel.findById(id)
        .populate('parentCategory')
        .exec();

      if (!category) {
        throw new NotFoundException(`Không tìm thấy danh mục với ID ${id}`);
      }

      return category;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Không thể lấy danh mục: ${error.message}`);
    }
  }

  // Lấy danh mục theo slug
  async findBySlug(slug: string): Promise<Category> {
    try {
      const category = await this.categoryModel.findOne({ slug })
        .populate('parentCategory')
        .exec();

      if (!category) {
        throw new NotFoundException(`Không tìm thấy danh mục với slug ${slug}`);
      }

      return category;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Không thể lấy danh mục: ${error.message}`);
    }
  }

  // Cập nhật danh mục
  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<any> {
    try {
      const category = await this.categoryModel.findById(id).exec();

      if (!category) {
        throw new NotFoundException(`Không tìm thấy danh mục với ID ${id}`);
      }

      // Xử lý cập nhật slug nếu tên thay đổi
      if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
        const newSlug = this.generateSlug(updateCategoryDto.name);
        const existingCategory = await this.categoryModel.findOne({
          slug: newSlug,
          _id: { $ne: id }
        }).exec();

        if (existingCategory) {
          throw new BadRequestException(`Danh mục với slug "${newSlug}" đã tồn tại`);
        }

        updateCategoryDto.slug = newSlug;
      }

      // Xử lý cập nhật level nếu parentCategory thay đổi
      if (updateCategoryDto.parentCategory &&
        (!category.parentCategory ||
          updateCategoryDto.parentCategory.toString() !== category.parentCategory.toString())) {
        const parentCategory = await this.categoryModel.findById(updateCategoryDto.parentCategory).exec();

        if (!parentCategory) {
          throw new NotFoundException(`Không tìm thấy danh mục cha với ID ${updateCategoryDto.parentCategory}`);
        }

        updateCategoryDto.level = parentCategory.level + 1;

        // Cập nhật level cho tất cả danh mục con
        await this.updateChildLevels(id, updateCategoryDto.level);
      }

      // Cập nhật danh mục
      const updatedCategory = await this.categoryModel
        .findByIdAndUpdate(id, updateCategoryDto, { new: true })
        .populate('parentCategory')
        .exec();

      return updatedCategory;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Không thể cập nhật danh mục: ${error.message}`);
    }
  }

  // Xóa danh mục
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const category = await this.categoryModel.findById(id).exec();

      if (!category) {
        throw new NotFoundException(`Không tìm thấy danh mục với ID ${id}`);
      }

      // Kiểm tra xem có danh mục con không
      const childCategories = await this.categoryModel.find({ parentCategory: id }).exec();

      if (childCategories.length > 0) {
        throw new BadRequestException('Không thể xóa danh mục có chứa danh mục con. Vui lòng xóa các danh mục con trước.');
      }

      // Xóa danh mục
      await this.categoryModel.findByIdAndDelete(id).exec();

      return { success: true, message: 'Xóa danh mục thành công' };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Không thể xóa danh mục: ${error.message}`);
    }
  }

  // Lấy cây danh mục
  async getCategoryTree() {
    try {
      // Lấy tất cả danh mục từ database
      const allCategories : Category[] = await this.categoryModel.find({ isActive: true })
        .sort({ order: 1 })
        .lean()
        .exec();

      // Tạo một Map để truy cập nhanh theo ID
      const categoriesMap = new Map();
      allCategories.forEach((category: any) => {
        // Thêm thuộc tính children để lưu danh mục con
        category.children = [];
        categoriesMap.set(category._id.toString(), category);
      });

      // Danh sách chứa chỉ các danh mục gốc (cấp cao nhất)
      const rootCategories: Category[] = [];

      // Phân loại danh mục vào cây
      allCategories.forEach((category: Category) => {
        if (category.parentCategory) {
          // Nếu có danh mục cha, thêm vào mảng children của cha
          const parentId = category.parentCategory.toString();
          if (categoriesMap.has(parentId)) {
            categoriesMap.get(parentId).children.push(category);
          }
        } else {
          // Nếu không có cha, là danh mục gốc
          rootCategories.push(category);
        }
      });

      return rootCategories;
    } catch (error) {
      throw new BadRequestException(`Không thể lấy cây danh mục: ${error.message}`);
    }
  }

  // Lấy đường dẫn breadcrumb
  async getBreadcrumb(id: string): Promise<Category[]> {
    try {
      const category : Category = await this.findById(id);
      const breadcrumb = [category];

      let currentCategory :any = category;

      while (currentCategory.parentCategory) {
        currentCategory = await this.findById(currentCategory.parentCategory);
        breadcrumb.unshift(currentCategory);
      }

      return breadcrumb;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Không thể lấy breadcrumb: ${error.message}`);
    }
  }

  // Lấy danh mục hiển thị trong menu
  async getMenuCategories(): Promise<Category[]> {
    try {
      return await this.categoryModel.find({
        isActive: true,
        showInMenu: true
      })
        .sort({ order: 1 })
        .lean()
        .exec();
    } catch (error) {
      throw new BadRequestException(`Không thể lấy danh mục menu: ${error.message}`);
    }
  }

  // Lấy danh mục hiển thị trên trang chủ
  async getHomeCategories(): Promise<Category[]> {
    try {
      return await this.categoryModel.find({
        isActive: true,
        showInHome: true
      })
        .sort({ order: 1 })
        .lean()
        .exec();
    } catch (error) {
      throw new BadRequestException(`Không thể lấy danh mục trang chủ: ${error.message}`);
    }
  }

  // Lấy danh mục con trực tiếp của một danh mục
  async getChildCategories(parentId?: string): Promise<Category[]> {
    try {
      const filter = parentId
        ? { parentCategory: parentId, isActive: true }
        : { parentCategory: null, isActive: true };

      return await this.categoryModel.find(filter)
        .sort({ order: 1 })
        .lean()
        .exec();
    } catch (error) {
      throw new BadRequestException(`Không thể lấy danh mục con: ${error.message}`);
    }
  }

  // Các method hỗ trợ
  private generateSlug(name: string): string {
    return slugify(name, {
      lower: true,      // Chuyển thành chữ thường
      strict: true,     // Loại bỏ các ký tự đặc biệt
      locale: 'vi',     // Hỗ trợ tiếng Việt
    });
  }

  private async updateChildLevels(parentId: string, parentLevel: number): Promise<void> {
    const childCategories: any = await this.categoryModel.find({ parentCategory: parentId }).exec();

    for (const child of childCategories) {
      const newLevel = parentLevel + 1;
      await this.categoryModel.findByIdAndUpdate(child._id, { level: newLevel }).exec();
      await this.updateChildLevels(child._id, newLevel);
    }
  }
  
  //
  // Lấy danh mục theo ID
  async findLevelById(id: string): Promise<Category> {
    try {
      const category = await this.categoryModel.findById(id).select('level slug').exec();
      if (!category) {
        throw new NotFoundException(`Không tìm thấy danh mục với ID ${id}`);
      }
      return category;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Không thể lấy danh mục: ${error.message}`);
    }
  }
}