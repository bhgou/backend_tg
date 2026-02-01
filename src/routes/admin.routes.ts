import express, { Request, Response } from 'express';
import { pool } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Все роуты требуют аутентификации
router.use(authenticate);

// Проверка админ прав
const checkAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    const userId = req.user!.id;
    
    const userResult = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
      return res.status(403).json({ error: 'Требуются права администратора' });
    }

    next();
  } catch (error: unknown) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Ошибка проверки прав' });
  }
};

router.use(checkAdmin);

// Статистика платформы
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const statsResult = await pool.query(`
      SELECT 
        -- Пользователи
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '1 day') as new_users_today,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
        
        -- Финансы
        (SELECT COALESCE(SUM(total_spent_rub), 0) FROM users) as total_revenue,
        (SELECT COALESCE(SUM(amount_rub), 0) FROM premium_payments WHERE status = 'completed') as total_payments,
        (SELECT COALESCE(SUM(balance), 0) FROM users) as total_balance,
        (SELECT COALESCE(SUM(premium_balance), 0) FROM users) as total_premium_balance,
        
        -- Активность
        (SELECT COUNT(*) FROM transactions WHERE created_at >= NOW() - INTERVAL '1 day') as transactions_today,
        (SELECT COUNT(*) FROM case_drops) as total_case_opens,
        (SELECT COUNT(*) FROM game_sessions WHERE created_at >= NOW() - INTERVAL '1 day') as games_today,
        
        -- Выводы
        (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending') as pending_withdrawals,
        (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'completed') as completed_withdrawals,
        (SELECT COUNT(*) FROM withdrawal_requests WHERE created_at >= NOW() - INTERVAL '1 day') as withdrawals_today
    `);

    // График доходов по дням (последние 7 дней)
    const revenueChart = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as payments_count,
        COALESCE(SUM(amount_rub), 0) as revenue
      FROM premium_payments 
      WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Топ пользователей по тратам
    const topSpenders = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.telegram_id,
        u.total_spent_rub,
        u.balance,
        u.premium_balance,
        COUNT(DISTINCT p.id) as payments_count
      FROM users u
      LEFT JOIN premium_payments p ON u.id = p.user_id AND p.status = 'completed'
      WHERE u.total_spent_rub > 0
      GROUP BY u.id
      ORDER BY u.total_spent_rub DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      stats: statsResult.rows[0],
      revenueChart: revenueChart.rows,
      topSpenders: topSpenders.rows
    });

  } catch (error: unknown) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// Управление пользователями
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        u.id, u.telegram_id, u.username, u.first_name, u.last_name,
        u.balance, u.premium_balance, u.total_earned, u.total_spent_rub,
        u.daily_streak, u.is_admin, u.created_at,
        COUNT(DISTINCT p.id) as payments_count,
        COUNT(DISTINCT wr.id) as withdrawal_requests
      FROM users u
      LEFT JOIN premium_payments p ON u.id = p.user_id AND p.status = 'completed'
      LEFT JOIN withdrawal_requests wr ON u.id = wr.user_id
    `;

    const params: any[] = [];

    if (search) {
      query += ` WHERE u.username ILIKE $1 OR u.telegram_id ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const usersResult = await pool.query(query, params);
    const totalResult = await pool.query(
      'SELECT COUNT(*) FROM users' + (search ? ' WHERE username ILIKE $1 OR telegram_id ILIKE $1' : ''),
      search ? [`%${search}%`] : []
    );

    res.json({
      success: true,
      users: usersResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(totalResult.rows[0]?.count || '0'),
        pages: Math.ceil(parseInt(totalResult.rows[0]?.count || '0') / Number(limit))
      }
    });

  } catch (error: unknown) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
});

// Изменение баланса пользователя
router.post('/users/:id/balance', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const { balance, premium_balance, reason } = req.body;

    if (balance === undefined && premium_balance === undefined) {
      return res.status(400).json({ error: 'Укажите баланс для изменения' });
    }

    await pool.query('BEGIN');

    try {
      const userResult = await pool.query(
        'SELECT id, username FROM users WHERE id = $1',
        [id]
      );

      if (userResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      const user = userResult.rows[0];
      const updates = [];
      const params = [];

      if (balance !== undefined) {
        updates.push('balance = balance + $' + (params.length + 1));
        params.push(balance);
        
        await pool.query(
          `INSERT INTO transactions (user_id, type, amount, metadata) 
           VALUES ($1, 'admin_adjustment', $2, $3)`,
          [id, balance, JSON.stringify({ reason, adminId: req.user!.id, action: 'balance_adjustment' })]
        );
      }

      if (premium_balance !== undefined) {
        updates.push('premium_balance = premium_balance + $' + (params.length + 1));
        params.push(premium_balance);
        
        await pool.query(
          `INSERT INTO transactions (user_id, type, amount, metadata) 
           VALUES ($1, 'admin_adjustment', $2, $3)`,
          [id, premium_balance, JSON.stringify({ reason, adminId: req.user!.id, action: 'premium_adjustment' })]
        );
      }

      params.push(id);
      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${params.length}`,
        params
      );

      await pool.query('COMMIT');

      res.json({
        success: true,
        message: 'Баланс успешно обновлён'
      });

    } catch (error: unknown) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error: unknown) {
    console.error('Admin balance update error:', error);
    res.status(500).json({ error: 'Ошибка обновления баланса' });
  }
});

// Управление кейсами
router.get('/cases', async (req: Request, res: Response) => {
  try {
    const casesResult = await pool.query(`
      SELECT 
        c.*,
        COUNT(cd.id) as total_drops,
        COUNT(DISTINCT t.id) as times_opened
      FROM cases c
      LEFT JOIN case_drops cd ON c.id = cd.case_id
      LEFT JOIN transactions t ON t.metadata->>'caseId' = c.id::text AND t.type = 'case_open'
      GROUP BY c.id
      ORDER BY c.id ASC
    `);

    res.json({
      success: true,
      cases: casesResult.rows
    });

  } catch (error: unknown) {
    console.error('Admin cases error:', error);
    res.status(500).json({ error: 'Ошибка получения кейсов' });
  }
});

// Создание/редактирование кейса
router.post('/cases', async (req: Request, res: Response) => {
  try {
    const { 
      id, 
      name, 
      type, 
      price, 
      premium_price, 
      description, 
      min_reward, 
      max_reward, 
      is_active 
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Название и тип обязательны' });
    }

    if (id) {
      // Редактирование
      const result = await pool.query(
        `UPDATE cases 
         SET name = $1, type = $2, price = $3, premium_price = $4, 
             description = $5, min_reward = $6, max_reward = $7, is_active = $8
         WHERE id = $9 
         RETURNING *`,
        [name, type, price, premium_price, description, min_reward, max_reward, is_active, id]
      );

      res.json({
        success: true,
        case: result.rows[0],
        message: 'Кейс обновлён'
      });
    } else {
      // Создание
      const result = await pool.query(
        `INSERT INTO cases 
         (name, type, price, premium_price, description, min_reward, max_reward, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [name, type, price, premium_price, description, min_reward, max_reward, is_active]
      );

      res.json({
        success: true,
        case: result.rows[0],
        message: 'Кейс создан'
      });
    }

  } catch (error: unknown) {
    console.error('Admin case save error:', error);
    res.status(500).json({ error: 'Ошибка сохранения кейса' });
  }
});

// Управление скинами
router.get('/skins', async (req: Request, res: Response) => {
  try {
    const { type = 'all' } = req.query; // all, virtual, real

    let query = `
      SELECT 
        s.*,
        COUNT(cd.id) as in_cases,
        COUNT(ii.id) as in_inventory
      FROM skins s
      LEFT JOIN case_drops cd ON s.id = cd.skin_id
      LEFT JOIN inventory_items ii ON s.id = ii.skin_id AND ii.is_fragment = false
    `;

    if (type === 'virtual') {
      query += ' WHERE s.steam_price IS NULL';
    } else if (type === 'real') {
      query += ' WHERE s.steam_price IS NOT NULL';
    }

    query += ' GROUP BY s.id ORDER BY s.price DESC';

    const skinsResult = await pool.query(query);

    // Реальные скины
    const realSkinsResult = await pool.query(`
      SELECT 
        rs.*,
        COUNT(wr.id) as withdrawal_requests,
        COUNT(rsf.id) as fragments_collected
      FROM real_skins rs
      LEFT JOIN withdrawal_requests wr ON rs.id = wr.real_skin_id
      LEFT JOIN real_skin_fragments rsf ON rs.id = rsf.real_skin_id
      GROUP BY rs.id
      ORDER BY rs.steam_price DESC
    `);

    res.json({
      success: true,
      virtual_skins: skinsResult.rows,
      real_skins: realSkinsResult.rows
    });

  } catch (error: unknown) {
    console.error('Admin skins error:', error);
    res.status(500).json({ error: 'Ошибка получения скинов' });
  }
});

// Управление спонсорами
router.get('/sponsors', async (req: Request, res: Response) => {
  try {
    const sponsorsResult = await pool.query(`
      SELECT 
        s.*,
        COUNT(ss.id) as total_subscribers,
        COUNT(CASE WHEN ss.reward_claimed = true THEN 1 END) as rewards_claimed
      FROM sponsors s
      LEFT JOIN sponsor_subscriptions ss ON s.id = ss.sponsor_id
      GROUP BY s.id
      ORDER BY s.priority ASC
    `);

    res.json({
      success: true,
      sponsors: sponsorsResult.rows
    });

  } catch (error: unknown) {
    console.error('Admin sponsors error:', error);
    res.status(500).json({ error: 'Ошибка получения спонсоров' });
  }
});

// Создание/редактирование спонсора
router.post('/sponsors', async (req: Request, res: Response) => {
  try {
    const { 
      id, 
      name, 
      username, 
      invite_link, 
      reward_type, 
      reward_value, 
      premium_reward, 
      is_active, 
      priority 
    } = req.body;

    if (!name || !invite_link) {
      return res.status(400).json({ error: 'Название и ссылка обязательны' });
    }

    if (id) {
      // Редактирование
      const result = await pool.query(
        `UPDATE sponsors 
         SET name = $1, username = $2, invite_link = $3, reward_type = $4, 
             reward_value = $5, premium_reward = $6, is_active = $7, priority = $8
         WHERE id = $9 
         RETURNING *`,
        [name, username, invite_link, reward_type, reward_value, 
         premium_reward, is_active, priority, id]
      );

      res.json({
        success: true,
        sponsor: result.rows[0],
        message: 'Спонсор обновлён'
      });
    } else {
      // Создание
      const result = await pool.query(
        `INSERT INTO sponsors 
         (name, username, invite_link, reward_type, reward_value, premium_reward, is_active, priority) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [name, username, invite_link, reward_type, reward_value, 
         premium_reward, is_active, priority]
      );

      res.json({
        success: true,
        sponsor: result.rows[0],
        message: 'Спонсор создан'
      });
    }

  } catch (error: unknown) {
    console.error('Admin sponsor save error:', error);
    res.status(500).json({ error: 'Ошибка сохранения спонсора' });
  }
});

// Управление заявками на вывод
router.get('/withdrawals', async (req: Request, res: Response) => {
  try {
    const { status = 'all', page = '1', limit = '20' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        wr.*,
        rs.name as skin_name,
        rs.image_url,
        rs.steam_price,
        u.username,
        u.telegram_id,
        u.first_name,
        u.last_name
      FROM withdrawal_requests wr
      JOIN real_skins rs ON wr.real_skin_id = rs.id
      JOIN users u ON wr.user_id = u.id
    `;

    const params: any[] = [];

    if (status !== 'all') {
      query += ` WHERE wr.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY wr.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const withdrawalsResult = await pool.query(query, params);
    
    const totalQuery = status !== 'all' 
      ? 'SELECT COUNT(*) FROM withdrawal_requests WHERE status = $1'
      : 'SELECT COUNT(*) FROM withdrawal_requests';
    
    const totalParams = status !== 'all' ? [status] : [];
    const totalResult = await pool.query(totalQuery, totalParams);

    res.json({
      success: true,
      withdrawals: withdrawalsResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(totalResult.rows[0]?.count || '0'),
        pages: Math.ceil(parseInt(totalResult.rows[0]?.count || '0') / Number(limit))
      }
    });

  } catch (error: unknown) {
    console.error('Admin withdrawals error:', error);
    res.status(500).json({ error: 'Ошибка получения заявок на вывод' });
  }
});

// Изменение статуса заявки на вывод
router.post('/withdrawals/:id/status', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!['pending', 'processing', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    const result = await pool.query(
      `UPDATE withdrawal_requests 
       SET status = $1, admin_notes = $2, processed_at = CASE 
         WHEN $1 IN ('completed', 'rejected') THEN CURRENT_TIMESTAMP 
         ELSE processed_at 
       END
       WHERE id = $3 
       RETURNING *`,
      [status, admin_notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    res.json({
      success: true,
      withdrawal: result.rows[0],
      message: 'Статус заявки обновлён'
    });

  } catch (error: unknown) {
    console.error('Admin withdrawal status error:', error);
    res.status(500).json({ error: 'Ошибка обновления статуса' });
  }
});

// Управление настройками
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const settingsResult = await pool.query(
      'SELECT * FROM app_settings ORDER BY key ASC'
    );

    res.json({
      success: true,
      settings: settingsResult.rows
    });

  } catch (error: unknown) {
    console.error('Admin settings error:', error);
    res.status(500).json({ error: 'Ошибка получения настроек' });
  }
});

// Сохранение настроек
router.post('/settings', async (req: Request, res: Response) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: 'Неверный формат настроек' });
    }

    await pool.query('BEGIN');

    try {
      for (const setting of settings) {
        await pool.query(
          `UPDATE app_settings 
           SET value = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE key = $2`,
          [setting.value.toString(), setting.key]
        );
      }

      await pool.query('COMMIT');

      res.json({
        success: true,
        message: 'Настройки сохранены'
      });

    } catch (error: unknown) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error: unknown) {
    console.error('Admin settings save error:', error);
    res.status(500).json({ error: 'Ошибка сохранения настроек' });
  }
});

// Получение платежей
router.get('/payments', async (req: Request, res: Response) => {
  try {
    const { status = 'all', page = '1', limit = '20' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        pp.*,
        u.username,
        u.telegram_id,
        u.first_name,
        u.last_name
      FROM premium_payments pp
      JOIN users u ON pp.user_id = u.id
    `;

    const params: any[] = [];

    if (status !== 'all') {
      query += ` WHERE pp.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY pp.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const paymentsResult = await pool.query(query, params);
    
    const totalQuery = status !== 'all' 
      ? 'SELECT COUNT(*) FROM premium_payments WHERE status = $1'
      : 'SELECT COUNT(*) FROM premium_payments';
    
    const totalParams = status !== 'all' ? [status] : [];
    const totalResult = await pool.query(totalQuery, totalParams);

    res.json({
      success: true,
      payments: paymentsResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(totalResult.rows[0]?.count || '0'),
        pages: Math.ceil(parseInt(totalResult.rows[0]?.count || '0') / Number(limit))
      }
    });

  } catch (error: unknown) {
    console.error('Admin payments error:', error);
    res.status(500).json({ error: 'Ошибка получения платежей' });
  }
});

// Экспорт данных
router.get('/export/:type', async (req: Request<{ type: string }>, res: Response) => {
  try {
    const { type } = req.params;
    const { start_date, end_date } = req.query;

    let query = '';
    let filename = '';

    switch (type) {
      case 'payments':
        query = `
          SELECT 
            pp.id,
            u.telegram_id,
            u.username,
            pp.amount_rub,
            pp.amount_premium,
            pp.payment_method,
            pp.status,
            pp.created_at,
            pp.completed_at
          FROM premium_payments pp
          JOIN users u ON pp.user_id = u.id
          WHERE pp.created_at BETWEEN $1 AND $2
          ORDER BY pp.created_at DESC
        `;
        filename = 'payments.csv';
        break;

      case 'withdrawals':
        query = `
          SELECT 
            wr.id,
            u.telegram_id,
            u.username,
            rs.name as skin_name,
            rs.steam_price,
            wr.status,
            wr.fragments_used,
            wr.premium_paid,
            wr.created_at,
            wr.processed_at
          FROM withdrawal_requests wr
          JOIN users u ON wr.user_id = u.id
          JOIN real_skins rs ON wr.real_skin_id = rs.id
          WHERE wr.created_at BETWEEN $1 AND $2
          ORDER BY wr.created_at DESC
        `;
        filename = 'withdrawals.csv';
        break;

      case 'users':
        query = `
          SELECT 
            id,
            telegram_id,
            username,
            first_name,
            last_name,
            balance,
            premium_balance,
            total_earned,
            total_spent_rub,
            is_admin,
            created_at
          FROM users
          WHERE created_at BETWEEN $1 AND $2
          ORDER BY created_at DESC
        `;
        filename = 'users.csv';
        break;

      default:
        return res.status(400).json({ error: 'Неверный тип экспорта' });
    }

    const start = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = end_date || new Date().toISOString();

    const result = await pool.query(query, [start, end]);

    // Преобразуем в CSV
    let csv = '';
    
    if (result.rows.length > 0) {
      // Заголовки
      const headers = Object.keys(result.rows[0]);
      csv += headers.join(',') + '\n';
      
      // Данные
      for (const row of result.rows) {
        const values = headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csv += values.join(',') + '\n';
      }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);

  } catch (error: unknown) {
    console.error('Admin export error:', error);
    res.status(500).json({ error: 'Ошибка экспорта данных' });
  }
});

export default router;