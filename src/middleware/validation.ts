import { Request, Response, NextFunction } from 'express';

export const validateMarketListing = (req: Request, res: Response, next: NextFunction) => {
  const { itemId, price, duration } = req.body;

  if (!itemId || typeof itemId !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'Неверный ID предмета'
    });
  }

  if (!price || typeof price !== 'number' || price < 10 || price > 1000000) {
    return res.status(400).json({
      success: false,
      error: 'Цена должна быть от 10 до 1,000,000 CR'
    });
  }

  if (!duration || typeof duration !== 'number' || duration < 1 || duration > 30) {
    return res.status(400).json({
      success: false,
      error: 'Длительность должна быть от 1 до 30 дней'
    });
  }

  next();
};