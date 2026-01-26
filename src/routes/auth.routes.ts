import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db/database';
import { AuthRequest, User } from '../types';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Регистрация/логин через Telegram
router.post('/login', async (req: Request<{}, {}, AuthRequest>, res: Response) => {
  try {
    const { telegramId, username, firstName, lastName, photoUrl, referralCode } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID обязателен' });
    }

    // Проверяем, есть ли пользователь
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    let user: User;
    
    if (existingUser.rows.length > 0) {
      // Обновляем существующего пользователя
      user = existingUser.rows[0];
      await pool.query(
        `UPDATE users 
         SET username = $1, first_name = $2, last_name = $3, avatar_url = $4, updated_at = CURRENT_TIMESTAMP
         WHERE telegram_id = $5`,
        [username, firstName, lastName, photoUrl, telegramId]
      );
    } else {
      // Создаем нового пользователя
      let referredBy: number | null = null;
      
      // Проверяем реферальный код
      if (referralCode) {
        const referrer = await pool.query(
          'SELECT id FROM users WHERE referral_code = $1',
          [referralCode]
        );
        
        if (referrer.rows.length > 0) {
          referredBy = referrer.rows[0].id;
          
          // Начисляем бонус рефереру
          await pool.query(
            `UPDATE users SET balance = balance + 200 WHERE id = $1`,
            [referredBy]
          );
          
          await pool.query(
            `INSERT INTO transactions (user_id, type, amount, metadata) 
             VALUES ($1, 'referral', 200, $2)`,
            [referredBy, JSON.stringify({ newUserId: telegramId, referralCode })]
          );
        }
      }

      // Создаем пользователя
      const result = await pool.query(
        `INSERT INTO users 
         (telegram_id, username, first_name, last_name, avatar_url, referred_by) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [telegramId, username, firstName, lastName, photoUrl, referredBy]
      );
      
      user = result.rows[0];
      
      // Начисляем приветственный бонус
      await pool.query(
        `UPDATE users SET balance = balance + 500 WHERE id = $1`,
        [user.id]
      );
      
      await pool.query(
        `INSERT INTO transactions (user_id, type, amount, metadata) 
         VALUES ($1, 'welcome_bonus', 500, $2)`,
        [user.id, JSON.stringify({ source: 'registration' })]
      );
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { 
        userId: user.id,
        telegramId: user.telegram_id
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        telegramId: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url,
        balance: user.balance,
        totalEarned: user.total_earned,
        dailyStreak: user.daily_streak,
        referralCode: user.referral_code,
        createdAt: user.created_at
      }
    });

  } catch (error: unknown) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Ошибка аутентификации' });
  }
});

// Проверка токена
router.post('/verify', async (req: Request<{}, {}, { token: string }>, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Токен обязателен' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; telegramId: string };
    
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    const user: User = userResult.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url,
        balance: user.balance,
        totalEarned: user.total_earned,
        dailyStreak: user.daily_streak,
        referralCode: user.referral_code,
        createdAt: user.created_at
      }
    });

  } catch (error: unknown) {
    console.error('Verify error:', error);
    res.status(401).json({ error: 'Неверный токен' });
  }
});

export default router;