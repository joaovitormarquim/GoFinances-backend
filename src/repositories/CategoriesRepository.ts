import { EntityRepository, Repository } from 'typeorm';

import Category from '../models/Category';

interface Request {
  title: string;
}

@EntityRepository(Category)
class CategoriesRepository extends Repository<Category> {
  public async findByTitleOrCreate({ title }: Request): Promise<Category> {
    const existentCategory = await this.findOne({
      where: {
        title,
      },
    });

    if (!existentCategory) {
      const category = await this.create({
        title,
      });

      await this.save(category);

      return category;
    }

    return existentCategory;
  }
}

export default CategoriesRepository;
