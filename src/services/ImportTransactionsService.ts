import csvParse from 'csv-parse';
import fs from 'fs';

import { getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import CategoriesRepository from '../repositories/CategoriesRepository';
import TransactionsRepository from '../repositories/TransactionsRepository';
// import AppError from '../errors/AppError';

interface Request {
  csvPath: string;
}

interface TransactionPayload {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ csvPath }: Request): Promise<Transaction[]> {
    const readCSVStream = fs.createReadStream(csvPath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactionPayloads: TransactionPayload[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, category] = line;
      transactionPayloads.push({
        title,
        type,
        value: Number(value),
        category,
      });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const uploadedCategoryTitles = transactionPayloads.map(
      transactionPayload => transactionPayload.category,
    );

    const categoriesRepository = getCustomRepository(CategoriesRepository);

    const existentCategories = await categoriesRepository.find();
    const existentCategoryTitles = existentCategories.map(category => {
      return category.title;
    });

    const newCategoryTitles = uploadedCategoryTitles.filter(
      title => !existentCategoryTitles.includes(title),
    );

    const newCategoryTitlesUnique = newCategoryTitles.filter(
      (value, index, self) => self.indexOf(value) === index,
    );

    const newCategories = await categoriesRepository.create(
      newCategoryTitlesUnique.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const allCategories = [...existentCategories, ...newCategories];

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactions = await transactionsRepository.create(
      transactionPayloads.map(payload => ({
        title: payload.title,
        value: payload.value,
        type: payload.type,
        category: allCategories.find(
          category => category.title === payload.category,
        ),
      })),
    );

    await transactionsRepository.save(transactions);

    await fs.promises.unlink(csvPath);

    return transactions;
  }
}

export default ImportTransactionsService;
