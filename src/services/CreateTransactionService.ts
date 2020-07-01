// import AppError from '../errors/AppError';

import { getCustomRepository } from 'typeorm';
import TransactionRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';

import FindOrCreateCategoryService from './FindOrCreateCategoryService';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const FindOrCreateCategory = new FindOrCreateCategoryService();

    const newCategory = await FindOrCreateCategory.execute({ title: category });

    const category_id = newCategory.id;

    const transactionRepository = getCustomRepository(TransactionRepository);

    const transaction = await transactionRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
