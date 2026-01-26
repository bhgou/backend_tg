"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../db/database");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Все роуты требуют аутентификации
router.use(auth_1.authenticate);
// Получение профиля
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user.id;
        const userResult = await database_1.pool.query(`SELECT 
        id, telegram_id, username, first_name, last_name, avatar_url,
        balance, total_earned, daily_streak, last_daily_at, referral_code,
        created_at, updated_at
       FROM users 
       WHERE id = $1`, [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        const user = userResult.rows[0];
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
                lastDailyAt: user.last_daily_at,
                referralCode: user.referral_code,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            }
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Ошибка получения профиля' });
    }
});
// Обновление профиля
router.put('/profile', async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, firstName, lastName } = req.body;
        const result = await database_1.pool.query(`UPDATE users 
       SET username = $1, first_name = $2, last_name = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 
       RETURNING id, telegram_id, username, first_name, last_name, avatar_url, balance`, [username, firstName, lastName, userId]);
        const user = result.rows[0];
        res.json({
            success: true,
            user: {
                id: user.id,
                telegramId: user.telegram_id,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                avatarUrl: user.avatar_url,
                balance: user.balance
            }
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Ошибка обновления профиля' });
    }
});
// Получение статистики
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.id;
        // Основная статистика
        const [userStats, casesStats, skinsStats, referralsStats] = await Promise.all([
            database_1.pool.query('SELECT total_earned, daily_streak, created_at FROM users WHERE id = $1', [userId]),
            database_1.pool.query('SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND type = $2', [userId, 'case_open']),
            database_1.pool.query('SELECT COUNT(*) FROM inventory_items WHERE user_id = $1 AND is_fragment = false', [userId]),
            database_1.pool.query('SELECT COUNT(*) FROM users WHERE referred_by = $1', [userId])
        ]);
        // Расчет точности трейдов
        const marketResult = await database_1.pool.query(`SELECT 
        COUNT(*) as total_trades,
        SUM(CASE WHEN amount > 0 THEN 1 ELSE 0 END) as profitable_trades
       FROM transactions 
       WHERE user_id = $1 AND type LIKE 'market_%'`, [userId]);
        const totalTrades = parseInt(marketResult.rows[0]?.total_trades || '0');
        const profitableTrades = parseInt(marketResult.rows[0]?.profitable_trades || '0');
        const tradeAccuracy = totalTrades > 0 ? Math.round((profitableTrades / totalTrades) * 100) : 0;
        res.json({
            success: true,
            stats: {
                totalCasesOpened: parseInt(casesStats.rows[0]?.count || '0'),
                totalSkinsCollected: parseInt(skinsStats.rows[0]?.count || '0'),
                totalReferrals: parseInt(referralsStats.rows[0]?.count || '0'),
                totalEarned: userStats.rows[0]?.total_earned || 0,
                tradeAccuracy,
                dailyStreak: userStats.rows[0]?.daily_streak || 0,
                joinDate: userStats.rows[0]?.created_at
            }
        });
    }
    catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Ошибка получения статистики' });
    }
});
// Получение истории транзакций
router.get('/transactions', async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = '1', limit = '20' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const [transactions, total] = await Promise.all([
            database_1.pool.query(`SELECT * FROM transactions 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`, [userId, limit, offset]),
            database_1.pool.query('SELECT COUNT(*) FROM transactions WHERE user_id = $1', [userId])
        ]);
        res.json({
            success: true,
            transactions: transactions.rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: parseInt(total.rows[0]?.count || '0'),
                pages: Math.ceil(parseInt(total.rows[0]?.count || '0') / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Ошибка получения истории' });
    }
});
// Ежедневная награда
router.post('/daily', async (req, res) => {
    try {
        const userId = req.user.id;
        // Получаем данные пользователя
        const userResult = await database_1.pool.query('SELECT balance, daily_streak, last_daily_at FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        const user = userResult.rows[0];
        const now = new Date();
        const lastDaily = user.last_daily_at;
        // Проверяем, получал ли награду сегодня
        if (lastDaily) {
            const lastDailyDate = new Date(lastDaily);
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const lastDailyDay = new Date(lastDailyDate.getFullYear(), lastDailyDate.getMonth(), lastDailyDate.getDate());
            if (lastDailyDay.getTime() === today.getTime()) {
                return res.status(400).json({
                    error: 'Ежедневная награда уже получена сегодня',
                    nextAvailable: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                });
            }
        }
        // Рассчитываем стрик
        let newStreak = 1;
        if (lastDaily) {
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            const lastDailyDate = new Date(lastDaily.getFullYear(), lastDaily.getMonth(), lastDaily.getDate());
            if (lastDailyDate.getTime() === yesterdayDate.getTime()) {
                newStreak = user.daily_streak + 1;
            }
        }
        // Рассчитываем награду
        const baseReward = 100;
        const streakBonus = Math.min(newStreak * 20, 500); // Максимум +500
        const totalReward = baseReward + streakBonus;
        // Обновляем пользователя
        const updatedUser = await database_1.pool.query(`UPDATE users 
       SET balance = balance + $1, 
           total_earned = total_earned + $1,
           daily_streak = $2,
           last_daily_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING balance, daily_streak`, [totalReward, newStreak, userId]);
        // Записываем транзакцию
        await database_1.pool.query(`INSERT INTO transactions (user_id, type, amount, metadata) 
       VALUES ($1, 'daily_reward', $2, $3)`, [userId, totalReward, JSON.stringify({ streak: newStreak, baseReward, streakBonus })]);
        res.json({
            success: true,
            reward: totalReward,
            newBalance: updatedUser.rows[0].balance,
            streak: updatedUser.rows[0].daily_streak,
            nextAvailable: new Date(now.getTime() + 24 * 60 * 60 * 1000)
        });
    }
    catch (error) {
        console.error('Claim daily error:', error);
        res.status(500).json({ error: 'Ошибка получения награды' });
    }
});
// Реферальная информация
router.get('/referrals', async (req, res) => {
    try {
        const userId = req.user.id;
        // Получаем реферальный код пользователя
        const userResult = await database_1.pool.query('SELECT referral_code FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        const referralCode = userResult.rows[0].referral_code;
        // Получаем рефералов
        const referralsResult = await database_1.pool.query(`SELECT 
        id, telegram_id, username, first_name, last_name, 
        balance, total_earned, created_at
       FROM users 
       WHERE referred_by = $1 
       ORDER BY created_at DESC`, [userId]);
        // Статистика по рефералам
        const statsResult = await database_1.pool.query(`SELECT 
        COUNT(*) as total_referrals,
        SUM(amount) as total_earned
       FROM transactions 
       WHERE user_id = $1 AND type = 'referral'`, [userId]);
        res.json({
            success: true,
            referralCode,
            referralLink: `https://t.me/YOUR_BOT_USERNAME?start=${referralCode}`,
            stats: {
                totalReferrals: parseInt(statsResult.rows[0]?.total_referrals || '0'),
                totalEarned: parseInt(statsResult.rows[0]?.total_earned || '0'),
                perReferral: 200,
                maxDaily: 1000
            },
            referrals: referralsResult.rows
        });
    }
    catch (error) {
        console.error('Get referrals error:', error);
        res.status(500).json({ error: 'Ошибка получения реферальной информации' });
    }
});
exports.default = router;
