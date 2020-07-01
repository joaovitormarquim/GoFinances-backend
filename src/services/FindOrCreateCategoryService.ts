// import AppError from '../errors/AppError';
import { getRepository } from 'typeorm';
import Category from '../models/Category';

interface Request {
  title: string;
}

class FindOrCreateCategoryService {
  public async execute({ title }: Request): Promise<Category> {
    const categoryRepository = getRepository(Category);

    const existentCategory = await categoryRepository.findOne({
      where: {
        title,
      },
    });

    if (!existentCategory) {
      const category = await categoryRepository.create({
        title,
      });

      await categoryRepository.save(category);

      return category;
    }

    return existentCategory;
  }
}

export default FindOrCreateCategoryService;
