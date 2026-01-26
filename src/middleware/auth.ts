import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db/database';
import { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Расширяем тип Request для добавления пользователя
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        telegramId: string;
        username: string | null;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    const token = authHeader.split(' ')[1];
    
    // Проверяем JWT токен
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Проверяем, существует ли пользователь
    const userResult = await pool.query(
      'SELECT id, telegram_id, username FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    // Добавляем пользователя в запрос
    req.user = {
      id: userResult.rows[0].id,
      telegramId: userResult.rows[0].telegram_id,
      username: userResult.rows[0].username
    };

    next();
  } catch (error: unknown) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Неверный токен' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Ошибка аутентификации' });
  }
};