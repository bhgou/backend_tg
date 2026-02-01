import express, { Request, Response } from 'express';
import { pool } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Получение доступных мини-игр
router.get('/games', authenticate, async (req: Request, res: Response) => {
  try {
    const gamesResult = await pool.query(
      `SELECT * FROM minigames 
       WHERE is_active = true 
       ORDER BY id ASC`
    );

    // Добавляем статистику для каждой игры
    const games = await Promise.all(
      gamesResult.rows.map(async (game) => {
        const statsResult = await pool.query(
          `SELECT 
            COUNT(*) as total_plays,
            SUM(bet) as total_bet,
            SUM(win_amount) as total_won,
            AVG(win_amount) as avg_win
           FROM game_sessions 
           WHERE minigame_id = $1 AND created_at >= NOW() - INTERVAL '1 day'`,
          [game.id]
        );

        return {
          ...game,
          stats: statsResult.rows[0] || {
            total_plays: 0,
            total_bet: 0,
            total_won: 0,
            avg_win: 0
          }
        };
      })
    );

    res.json({
      success: true,
      games
    });

  } catch (error: unknown) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Ошибка получения игр' });
  }
});

// Игра в кости
router.post('/dice/play', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { bet, target_number, prediction } = req.body;

    if (!bet || bet < 10 || bet > 1000) {
      return res.status(400).json({ 
        error: 'Ставка должна быть от 10 до 1000 GC' 
      });
    }

    if (target_number < 1 || target_number > 6) {
      return res.status(400).json({ 
        error: 'Целевое число должно быть от 1 до 6' 
      });
    }

    if (!['higher', 'lower', 'exact'].includes(prediction)) {
      return res.status(400).json({ 
        error: 'Неверный тип предсказания' 
      });
    }

    // Проверяем баланс
    const userResult = await pool.query(
      'SELECT premium_balance FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const userBalance = userResult.rows[0].premium_balance;

    if (userBalance < bet) {
      return res.status(400).json({
        error: 'Недостаточно премиум валюты',
        required: bet,
        current: userBalance
      });
    }

    await pool.query('BEGIN');

    try {
      // Списываем ставку
      await pool.query(
        'UPDATE users SET premium_balance = premium_balance - $1 WHERE id = $2',
        [bet, userId]
      );

      // Бросаем кости
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const total = dice1 + dice2;

      // Определяем результат
      let win = false;
      let multiplier = 0;
      let winAmount = 0;

      switch (prediction) {
        case 'higher':
          win = total > target_number;
          multiplier = 2.0;
          break;
        case 'lower':
          win = total < target_number;
          multiplier = 2.0;
          break;
        case 'exact':
          win = total === target_number;
          multiplier = 6.0;
          break;
      }

      if (win) {
        winAmount = Math.floor(bet * multiplier);
        
        // Зачисляем выигрыш
        await pool.query(
          'UPDATE users SET premium_balance = premium_balance + $1 WHERE id = $2',
          [winAmount, userId]
        );
      }

      // Сохраняем сессию игры
      const gameResult = await pool.query(
        `INSERT INTO game_sessions 
         (user_id, minigame_id, bet, win_amount, result) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          userId,
          1, // ID игры в кости
          bet,
          winAmount,
          JSON.stringify({
            dice1,
            dice2,
            total,
            target_number,
            prediction,
            win,
            multiplier
          })
        ]
      );

      // Получаем обновленный баланс
      const updatedUser = await pool.query(
        'SELECT premium_balance FROM users WHERE id = $1',
        [userId]
      );

      await pool.query('COMMIT');

      res.json({
        success: true,
        game: gameResult.rows[0],
        newBalance: updatedUser.rows[0].premium_balance,
        dice: { dice1, dice2, total },
        win,
        winAmount,
        message: win ? `🎉 Вы выиграли ${winAmount} GC!` : '😔 Вы проиграли'
      });

    } catch (error: unknown) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error: unknown) {
    console.error('Dice play error:', error);
    res.status(500).json({ error: 'Ошибка игры в кости' });
  }
});

// Игра в рулетку
router.post('/roulette/play', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { bet, bet_type, bet_value } = req.body;

    if (!bet || bet < 50 || bet > 5000) {
      return res.status(400).json({ 
        error: 'Ставка должна быть от 50 до 5000 GC' 
      });
    }

    const validBetTypes = ['red', 'black', 'green', 'number', 'even', 'odd', 'dozen', 'column'];
    if (!validBetTypes.includes(bet_type)) {
      return res.status(400).json({ error: 'Неверный тип ставки' });
    }

    if (bet_type === 'number' && (bet_value < 0 || bet_value > 36)) {
      return res.status(400).json({ error: 'Неверный номер' });
    }

    // Проверяем баланс
    const userResult = await pool.query(
      'SELECT premium_balance FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const userBalance = userResult.rows[0].premium_balance;

    if (userBalance < bet) {
      return res.status(400).json({
        error: 'Недостаточно премиум валюты',
        required: bet,
        current: userBalance
      });
    }

    await pool.query('BEGIN');

    try {
      // Списываем ставку
      await pool.query(
        'UPDATE users SET premium_balance = premium_balance - $1 WHERE id = $2',
        [bet, userId]
      );

      // Крутим рулетку
      const winningNumber = Math.floor(Math.random() * 37); // 0-36
      const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(winningNumber);
      const isBlack = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35].includes(winningNumber);
      const isGreen = winningNumber === 0;
      const isEven = winningNumber > 0 && winningNumber % 2 === 0;
      const isOdd = winningNumber > 0 && winningNumber % 2 === 1;

      // Определяем результат
      let win = false;
      let multiplier = 0;

      switch (bet_type) {
        case 'red':
          win = isRed;
          multiplier = 2.0;
          break;
        case 'black':
          win = isBlack;
          multiplier = 2.0;
          break;
        case 'green':
          win = isGreen;
          multiplier = 36.0;
          break;
        case 'number':
          win = winningNumber === bet_value;
          multiplier = 36.0;
          break;
        case 'even':
          win = isEven;
          multiplier = 2.0;
          break;
        case 'odd':
          win = isOdd;
          multiplier = 2.0;
          break;
        case 'dozen':
          const dozenWin = bet_value >= 1 && bet_value <= 3 && 
                         winningNumber >= (bet_value - 1) * 12 + 1 && 
                         winningNumber <= bet_value * 12;
          win = dozenWin;
          multiplier = 3.0;
          break;
        case 'column':
          const columnNumbers = [];
          for (let i = bet_value; i <= 36; i += 3) {
            columnNumbers.push(i);
          }
          win = columnNumbers.includes(winningNumber);
          multiplier = 3.0;
          break;
      }

      let winAmount = 0;
      if (win) {
        winAmount = Math.floor(bet * multiplier);
        
        // Зачисляем выигрыш
        await pool.query(
          'UPDATE users SET premium_balance = premium_balance + $1 WHERE id = $2',
          [winAmount, userId]
        );
      }

      // Сохраняем сессию игры
      const gameResult = await pool.query(
        `INSERT INTO game_sessions 
         (user_id, minigame_id, bet, win_amount, result) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          userId,
          2, // ID игры в рулетку
          bet,
          winAmount,
          JSON.stringify({
            winningNumber,
            bet_type,
            bet_value,
            win,
            multiplier,
            color: isGreen ? 'green' : isRed ? 'red' : 'black',
            isEven,
            isOdd
          })
        ]
      );

      // Получаем обновленный баланс
      const updatedUser = await pool.query(
        'SELECT premium_balance FROM users WHERE id = $1',
        [userId]
      );

      await pool.query('COMMIT');

      res.json({
        success: true,
        game: gameResult.rows[0],
        newBalance: updatedUser.rows[0].premium_balance,
        result: {
          number: winningNumber,
          color: isGreen ? 'green' : isRed ? 'red' : 'black',
          isEven,
          isOdd
        },
        win,
        winAmount,
        message: win ? `🎉 Вы выиграли ${winAmount} GC!` : '😔 Вы проиграли'
      });

    } catch (error: unknown) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error: unknown) {
    console.error('Roulette play error:', error);
    res.status(500).json({ error: 'Ошибка игры в рулетку' });
  }
});

// Слоты
router.post('/slots/play', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { bet } = req.body;

    if (!bet || bet < 20 || bet > 2000) {
      return res.status(400).json({ 
        error: 'Ставка должна быть от 20 до 2000 GC' 
      });
    }

    // Проверяем баланс
    const userResult = await pool.query(
      'SELECT premium_balance FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const userBalance = userResult.rows[0].premium_balance;

    if (userBalance < bet) {
      return res.status(400).json({
        error: 'Недостаточно премиум валюты',
        required: bet,
        current: userBalance
      });
    }

    await pool.query('BEGIN');

    try {
      // Списываем ставку
      await pool.query(
        'UPDATE users SET premium_balance = premium_balance - $1 WHERE id = $2',
        [bet, userId]
      );

      // Генерируем слоты
      const symbols = ['🍒', '🍋', '🍊', '🍉', '⭐', '7️⃣', '🔔', '💎'];
      const reels = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ];

      // Определяем выигрыш
      let win = false;
      let multiplier = 0;
      let winAmount = 0;

      if (reels[0] === reels[1] && reels[1] === reels[2]) {
        // Три одинаковых символа
        win = true;
        switch (reels[0]) {
          case '7️⃣': multiplier = 10.0; break;
          case '💎': multiplier = 8.0; break;
          case '⭐': multiplier = 6.0; break;
          case '🔔': multiplier = 5.0; break;
          default: multiplier = 4.0; break;
        }
      } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
        // Два одинаковых символа
        win = true;
        multiplier = 2.0;
      }

      if (win) {
        winAmount = Math.floor(bet * multiplier);
        
        // Зачисляем выигрыш
        await pool.query(
          'UPDATE users SET premium_balance = premium_balance + $1 WHERE id = $2',
          [winAmount, userId]
        );
      }

      // Сохраняем сессию игры
      const gameResult = await pool.query(
        `INSERT INTO game_sessions 
         (user_id, minigame_id, bet, win_amount, result) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          userId,
          3, // ID игры в слоты
          bet,
          winAmount,
          JSON.stringify({
            reels,
            win,
            multiplier
          })
        ]
      );

      // Получаем обновленный баланс
      const updatedUser = await pool.query(
        'SELECT premium_balance FROM users WHERE id = $1',
        [userId]
      );

      await pool.query('COMMIT');

      res.json({
        success: true,
        game: gameResult.rows[0],
        newBalance: updatedUser.rows[0].premium_balance,
        reels,
        win,
        winAmount,
        message: win ? `🎰 ${reels.join(' ')} - Вы выиграли ${winAmount} GC!` : '😔 Попробуйте ещё раз!'
      });

    } catch (error: unknown) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error: unknown) {
    console.error('Slots play error:', error);
    res.status(500).json({ error: 'Ошибка игры в слоты' });
  }
});

// Орёл и решка
router.post('/coinflip/play', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { bet, prediction } = req.body;

    if (!bet || bet < 10 || bet > 1000) {
      return res.status(400).json({ 
        error: 'Ставка должна быть от 10 до 1000 GC' 
      });
    }

    if (!['heads', 'tails'].includes(prediction)) {
      return res.status(400).json({ error: 'Выберите орла или решку' });
    }

    // Проверяем баланс
    const userResult = await pool.query(
      'SELECT premium_balance FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const userBalance = userResult.rows[0].premium_balance;

    if (userBalance < bet) {
      return res.status(400).json({
        error: 'Недостаточно премиум валюты',
        required: bet,
        current: userBalance
      });
    }

    await pool.query('BEGIN');

    try {
      // Списываем ставку
      await pool.query(
        'UPDATE users SET premium_balance = premium_balance - $1 WHERE id = $2',
        [bet, userId]
      );

      // Подбрасываем монетку
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      const win = result === prediction;
      const multiplier = 1.95; // Комиссия казино 2.5%
      
      let winAmount = 0;
      if (win) {
        winAmount = Math.floor(bet * multiplier);
        
        // Зачисляем выигрыш
        await pool.query(
          'UPDATE users SET premium_balance = premium_balance + $1 WHERE id = $2',
          [winAmount, userId]
        );
      }

      // Сохраняем сессию игры
      const gameResult = await pool.query(
        `INSERT INTO game_sessions 
         (user_id, minigame_id, bet, win_amount, result) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          userId,
          4, // ID игры орёл-решка
          bet,
          winAmount,
          JSON.stringify({
            result,
            prediction,
            win,
            multiplier
          })
        ]
      );

      // Получаем обновленный баланс
      const updatedUser = await pool.query(
        'SELECT premium_balance FROM users WHERE id = $1',
        [userId]
      );

      await pool.query('COMMIT');

      res.json({
        success: true,
        game: gameResult.rows[0],
        newBalance: updatedUser.rows[0].premium_balance,
        result: result === 'heads' ? '🦅 Орёл' : '🪙 Решка',
        win,
        winAmount,
        message: win ? `🎉 Вы угадали! Выигрыш: ${winAmount} GC` : '😔 Не угадали'
      });

    } catch (error: unknown) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error: unknown) {
    console.error('Coinflip play error:', error);
    res.status(500).json({ error: 'Ошибка игры' });
  }
});

// История игр пользователя
router.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = '20', game_type } = req.query;

    let query = `
      SELECT 
        gs.*,
        mg.name as game_name,
        mg.type as game_type
      FROM game_sessions gs
      JOIN minigames mg ON gs.minigame_id = mg.id
      WHERE gs.user_id = $1
    `;

    const params: any[] = [userId];

    if (game_type) {
      query += ' AND mg.type = $2';
      params.push(game_type);
    }

    query += ' ORDER BY gs.created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const historyResult = await pool.query(query, params);

    // Статистика
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_games,
        SUM(bet) as total_bet,
        SUM(win_amount) as total_won,
        AVG(win_amount) as avg_win,
        SUM(CASE WHEN win_amount > 0 THEN 1 ELSE 0 END) as wins_count
       FROM game_sessions 
       WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      history: historyResult.rows,
      stats: statsResult.rows[0] || {
        total_games: 0,
        total_bet: 0,
        total_won: 0,
        avg_win: 0,
        wins_count: 0
      }
    });

  } catch (error: unknown) {
    console.error('Game history error:', error);
    res.status(500).json({ error: 'Ошибка получения истории игр' });
  }
});

export default router;