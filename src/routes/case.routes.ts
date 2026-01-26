import express, { Request, Response } from 'express';
import { pool } from '../db/database';
import { authenticate } from '../middleware/auth';
import { Case, CaseDrop, InventoryItem } from '../types';

const router = express.Router();

// Получение всех доступных кейсов
router.get('/', async (req: Request, res: Response) => {
  try {
    const casesResult = await pool.query<Case>(
      `SELECT 
        c.*,
        (SELECT COUNT(*) FROM case_drops WHERE case_id = c.id) as total_drops
       FROM cases c 
       WHERE c.is_active = true 
       ORDER BY 
         CASE c.type 
           WHEN 'ad' THEN 1
           WHEN 'standard' THEN 2
           WHEN 'premium' THEN 3
           ELSE 4
         END`
    );

    res.json({
      success: true,
      cases: casesResult.rows
    });

  } catch (error: unknown) {
    console.error('Get cases error:', error);
    res.status(500).json({ error: 'Ошибка получения кейсов' });
  }
});

// Получение дропов конкретного кейса
router.get('/:caseId/drops', async (req: Request<{ caseId: string }>, res: Response) => {
  try {
    const { caseId } = req.params;

    const dropsResult = await pool.query<CaseDrop>(
      `SELECT 
        cd.*,
        s.name as skin_name,
        s.rarity,
        s.weapon,
        s.price,
        s.image_url,
        s.fragments_required
       FROM case_drops cd
       JOIN skins s ON cd.skin_id = s.id
       WHERE cd.case_id = $1
       ORDER BY cd.probability DESC`,
      [caseId]
    );

    res.json({
      success: true,
      drops: dropsResult.rows
    });

  } catch (error: unknown) {
    console.error('Get case drops error:', error);
    res.status(500).json({ error: 'Ошибка получения дропов' });
  }
});

// Открытие кейса (требует аутентификации)
router.post('/open', authenticate, async (req: Request<{}, {}, { caseId: number }>, res: Response) => {
  try {
    const userId = req.user!.id;
    const { caseId } = req.body;

    if (!caseId) {
      return res.status(400).json({ error: 'ID кейса обязателен' });
    }

    // Получаем информацию о кейсе
    const caseResult = await pool.query<Case>(
      'SELECT * FROM cases WHERE id = $1 AND is_active = true',
      [caseId]
    );

    if (caseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Кейс не найден' });
    }

    const caseData = caseResult.rows[0];

    // Проверяем баланс для платных кейсов
    if (caseData.type !== 'ad') {
      const userResult = await pool.query(
        'SELECT balance FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      const userBalance = userResult.rows[0].balance;

      if (userBalance < caseData.price!) {
        return res.status(400).json({ 
          error: 'Недостаточно средств',
          required: caseData.price,
          current: userBalance
        });
      }

      // Списываем средства
      await pool.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [caseData.price, userId]
      );
    }

    // Получаем дропы кейса
    const dropsResult = await pool.query<CaseDrop>(
      `SELECT 
        cd.*,
        s.name as skin_name,
        s.rarity,
        s.weapon,
        s.price,
        s.image_url,
        s.fragments_required
       FROM case_drops cd
       JOIN skins s ON cd.skin_id = s.id
       WHERE cd.case_id = $1`,
      [caseId]
    );

    if (dropsResult.rows.length === 0) {
      return res.status(400).json({ error: 'Кейс не содержит дропов' });
    }

    // Выбираем случайный дроп на основе вероятностей
    const drops: CaseDrop[] = dropsResult.rows;
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedDrop: CaseDrop | null = null;

    for (const drop of drops) {
      cumulativeProbability += Number(drop.probability);
      if (random <= cumulativeProbability) {
        selectedDrop = drop;
        break;
      }
    }

    // Если не выбрали (из-за погрешности), берем первый
    if (!selectedDrop) {
      selectedDrop = drops[0];
    }

    // Добавляем предмет в инвентарь
    const inventoryResult = await pool.query<InventoryItem>(
      `INSERT INTO inventory_items 
       (user_id, skin_id, name, rarity, image_url, is_fragment, fragments, price) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        userId,
        selectedDrop.skin_id,
        selectedDrop.skin_name!,
        selectedDrop.rarity!,
        selectedDrop.image_url,
        selectedDrop.is_fragment,
        selectedDrop.fragments,
        selectedDrop.price
      ]
    );

    const inventoryItem = inventoryResult.rows[0];

    // Записываем транзакцию
    await pool.query(
      `INSERT INTO transactions (user_id, type, amount, metadata) 
       VALUES ($1, 'case_open', $2, $3)`,
      [
        userId,
        caseData.type === 'ad' ? 0 : -(caseData.price || 0),
        JSON.stringify({
          caseId,
          caseName: caseData.name,
          caseType: caseData.type,
          itemId: inventoryItem.id,
          itemName: selectedDrop.skin_name,
          rarity: selectedDrop.rarity,
          isFragment: selectedDrop.is_fragment,
          fragments: selectedDrop.fragments
        })
      ]
    );

    // Получаем обновленный баланс
    const updatedUser = await pool.query(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      item: inventoryItem,
      case: {
        id: caseData.id,
        name: caseData.name,
        type: caseData.type
      },
      newBalance: updatedUser.rows[0].balance,
      message: selectedDrop.is_fragment 
        ? `Вы получили ${selectedDrop.fragments} фрагментов ${selectedDrop.skin_name}!` 
        : `Поздравляем! Вы получили ${selectedDrop.skin_name}!`
    });

  } catch (error: unknown) {
    console.error('Open case error:', error);
    res.status(500).json({ error: 'Ошибка открытия кейса' });
  }
});

// Получение истории открытия кейсов
router.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = '10' } = req.query;

    const historyResult = await pool.query(
      `SELECT 
        t.metadata->>'itemName' as item_name,
        t.metadata->>'rarity' as rarity,
        t.metadata->>'isFragment' as is_fragment,
        t.metadata->>'fragments' as fragments,
        t.created_at
       FROM transactions t
       WHERE t.user_id = $1 AND t.type = 'case_open'
       ORDER BY t.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({
      success: true,
      history: historyResult.rows
    });

  } catch (error: unknown) {
    console.error('Get case history error:', error);
    res.status(500).json({ error: 'Ошибка получения истории' });
  }
});

export default router;