import express, { Request, Response } from 'express';
import { pool } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Получение реальных скинов
router.get('/', async (req: Request, res: Response) => {
  try {
    const { rarity, weapon, minPrice, maxPrice, sortBy = 'price_desc' } = req.query;

    let query = `
      SELECT * FROM real_skins 
      WHERE tradeable = true
    `;
    const params: any[] = [];

    if (rarity) {
      params.push(rarity);
      query += ` AND rarity = $${params.length}`;
    }

    if (weapon) {
      params.push(weapon);
      query += ` AND weapon = $${params.length}`;
    }

    if (minPrice) {
      params.push(minPrice);
      query += ` AND steam_price >= $${params.length}`;
    }

    if (maxPrice) {
      params.push(maxPrice);
      query += ` AND steam_price <= $${params.length}`;
    }

    // Сортировка
    switch (sortBy) {
      case 'price_asc':
        query += ' ORDER BY steam_price ASC';
        break;
      case 'rarity':
  query += ` ORDER BY 
    CASE 
      WHEN rarity = 'Contraband' THEN 1
      WHEN rarity = 'Covert' THEN 2
      WHEN rarity = 'Classified' THEN 3
      WHEN rarity = 'Restricted' THEN 4
      WHEN rarity = 'Mil-Spec' THEN 5
      WHEN rarity = 'Industrial Grade' THEN 6
      WHEN rarity = 'Consumer Grade' THEN 7
      ELSE 8
    END`;
  break;
      case 'price_desc':
      default:
        query += ' ORDER BY steam_price DESC';
        break;
    }

    query += ' LIMIT 50';

    const skinsResult = await pool.query(query, params);

    res.json({
      success: true,
      skins: skinsResult.rows
    });

  } catch (error: unknown) {
    console.error('Get real skins error:', error);
    res.status(500).json({ error: 'Ошибка получения скинов' });
  }
});

// Получение конкретного скина
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    const skinResult = await pool.query(
      'SELECT * FROM real_skins WHERE id = $1',
      [id]
    );

    if (skinResult.rows.length === 0) {
      return res.status(404).json({ error: 'Скин не найден' });
    }

    res.json({
      success: true,
      skin: skinResult.rows[0]
    });

  } catch (error: unknown) {
    console.error('Get real skin error:', error);
    res.status(500).json({ error: 'Ошибка получения скина' });
  }
});

// Заявка на вывод реального скина
router.post('/withdraw', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { skinId, steamTradeLink } = req.body;

    if (!skinId || !steamTradeLink) {
      return res.status(400).json({ 
        error: 'ID скина и Steam Trade Link обязательны' 
      });
    }

    // Валидация Steam Trade Link
    if (!steamTradeLink.includes('steamcommunity.com/tradeoffer/new/')) {
      return res.status(400).json({ 
        error: 'Неверный Steam Trade Link формат' 
      });
    }

    // Проверяем скин
    const skinResult = await pool.query(
      'SELECT * FROM real_skins WHERE id = $1 AND tradeable = true',
      [skinId]
    );

    if (skinResult.rows.length === 0) {
      return res.status(404).json({ error: 'Скин не найден' });
    }

    const skin = skinResult.rows[0];

    // Проверяем фрагменты пользователя
    const fragmentsResult = await pool.query(
      `SELECT COALESCE(SUM(fragments), 0) as total_fragments 
       FROM inventory_items 
       WHERE user_id = $1 AND is_fragment = true`,
      [userId]
    );

    const totalFragments = parseInt(fragmentsResult.rows[0]?.total_fragments || '0');

    if (totalFragments < skin.fragments_required) {
      return res.status(400).json({
        error: 'Недостаточно фрагментов',
        required: skin.fragments_required,
        current: totalFragments,
        needed: skin.fragments_required - totalFragments
      });
    }

    await pool.query('BEGIN');

    try {
      // Создаем заявку на вывод
      const withdrawalResult = await pool.query(
        `INSERT INTO withdrawal_requests 
         (user_id, real_skin_id, steam_trade_link, fragments_used, status) 
         VALUES ($1, $2, $3, $4, 'pending') 
         RETURNING *`,
        [userId, skinId, steamTradeLink, skin.fragments_required]
      );

      // Удаляем использованные фрагменты
      await pool.query(
        `DELETE FROM inventory_items 
         WHERE user_id = $1 AND is_fragment = true`,
        [userId]
      );

      // Добавляем запись в real_skin_fragments для истории
      await pool.query(
        `INSERT INTO real_skin_fragments 
         (user_id, real_skin_id, fragments) 
         VALUES ($1, $2, $3)`,
        [userId, skinId, skin.fragments_required]
      );

      // Записываем транзакцию
      await pool.query(
        `INSERT INTO transactions (user_id, type, amount, metadata) 
         VALUES ($1, 'real_skin_withdrawal', $2, $3)`,
        [
          userId,
          -skin.fragments_required,
          JSON.stringify({
            skinId: skin.id,
            skinName: skin.name,
            skinPrice: skin.steam_price,
            fragmentsUsed: skin.fragments_required,
            withdrawalId: withdrawalResult.rows[0].id,
            steamTradeLink: steamTradeLink
          })
        ]
      );

      await pool.query('COMMIT');

      // Получаем обновленное количество фрагментов
      const updatedFragments = await pool.query(
        `SELECT COALESCE(SUM(fragments), 0) as total_fragments 
         FROM inventory_items 
         WHERE user_id = $1 AND is_fragment = true`,
        [userId]
      );

      res.json({
        success: true,
        withdrawal: withdrawalResult.rows[0],
        remainingFragments: parseInt(updatedFragments.rows[0]?.total_fragments || '0'),
        message: '✅ Заявка на вывод создана успешно!\n\n' +
                'Администратор обработает её в течение 24 часов.\n' +
                'После одобрения скин будет отправлен на указанный Steam Trade Link.'
      });

    } catch (error: unknown) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error: unknown) {
    console.error('Withdraw skin error:', error);
    res.status(500).json({ error: 'Ошибка создания заявки' });
  }
});

// Получение истории выводов пользователя
router.get('/withdrawals/history', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const withdrawalsResult = await pool.query(
      `SELECT 
        wr.*,
        rs.name as skin_name,
        rs.image_url,
        rs.steam_price
       FROM withdrawal_requests wr
       JOIN real_skins rs ON wr.real_skin_id = rs.id
       WHERE wr.user_id = $1
       ORDER BY wr.created_at DESC
       LIMIT 20`,
      [userId]
    );

    res.json({
      success: true,
      withdrawals: withdrawalsResult.rows
    });

  } catch (error: unknown) {
    console.error('Get withdrawals history error:', error);
    res.status(500).json({ error: 'Ошибка получения истории выводов' });
  }
});

// Получение прогресса по фрагментам
router.get('/fragments/progress', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const fragmentsResult = await pool.query(
      `SELECT COALESCE(SUM(fragments), 0) as total_fragments 
       FROM inventory_items 
       WHERE user_id = $1 AND is_fragment = true`,
      [userId]
    );

    const totalFragments = parseInt(fragmentsResult.rows[0]?.total_fragments || '0');

    // Получаем скины, которые можно купить
    const affordableSkinsResult = await pool.query(
      `SELECT *, 
        ($1 >= fragments_required) as can_afford,
        (fragments_required - $1) as needed_fragments
       FROM real_skins 
       WHERE tradeable = true
       ORDER BY steam_price DESC`,
      [totalFragments]
    );

    res.json({
      success: true,
      totalFragments,
      affordableSkins: affordableSkinsResult.rows
    });

  } catch (error: unknown) {
    console.error('Get fragments progress error:', error);
    res.status(500).json({ error: 'Ошибка получения прогресса' });
  }
});

export default router;