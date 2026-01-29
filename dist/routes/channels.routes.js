"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../db/database");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Получение всех каналов
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const channelsResult = await database_1.pool.query(`SELECT c.*, 
        us.verified as is_subscribed,
        us.reward_claimed as reward_claimed
       FROM channels c
       LEFT JOIN user_subscriptions us ON c.id = us.channel_id AND us.user_id = $1
       WHERE c.is_active = true
       ORDER BY c.required DESC, c.id ASC`, [userId]);
        const userResult = await database_1.pool.query('SELECT telegram_id, username FROM users WHERE id = $1', [userId]);
        res.json({
            success: true,
            channels: channelsResult.rows,
            user: {
                telegramId: userResult.rows[0]?.telegram_id,
                username: userResult.rows[0]?.username
            }
        });
    }
    catch (error) {
        console.error('Get channels error:', error);
        res.status(500).json({ error: 'Ошибка получения каналов' });
    }
});
// Проверка подписок
router.post('/check-subscriptions', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelIds } = req.body;
        if (!channelIds || !Array.isArray(channelIds)) {
            return res.status(400).json({ error: 'Неверный формат данных' });
        }
        // В реальном приложении здесь должна быть проверка через Telegram API
        // Для демо возвращаем случайные результаты
        const results = [];
        let totalReward = 0;
        for (const channelId of channelIds) {
            const channelResult = await database_1.pool.query('SELECT * FROM channels WHERE id = $1', [channelId]);
            if (channelResult.rows.length === 0)
                continue;
            const channel = channelResult.rows[0];
            // Проверяем существующую подписку
            const existingSub = await database_1.pool.query('SELECT * FROM user_subscriptions WHERE user_id = $1 AND channel_id = $2', [userId, channelId]);
            if (existingSub.rows.length > 0 && existingSub.rows[0].reward_claimed) {
                results.push({
                    channelId,
                    name: channel.name,
                    subscribed: true,
                    rewardClaimed: true,
                    reward: 0
                });
                continue;
            }
            // Для демо - случайная подписка
            const isSubscribed = Math.random() > 0.3;
            if (isSubscribed) {
                if (existingSub.rows.length > 0) {
                    await database_1.pool.query('UPDATE user_subscriptions SET verified = true WHERE id = $1', [existingSub.rows[0].id]);
                }
                else {
                    await database_1.pool.query(`INSERT INTO user_subscriptions (user_id, channel_id, verified)
             VALUES ($1, $2, true)`, [userId, channelId]);
                }
                totalReward += channel.reward_value;
                results.push({
                    channelId,
                    name: channel.name,
                    subscribed: true,
                    reward: channel.reward_value,
                    rewardClaimed: false
                });
            }
            else {
                results.push({
                    channelId,
                    name: channel.name,
                    subscribed: false,
                    reward: 0
                });
            }
        }
        res.json({
            success: true,
            results,
            totalReward
        });
    }
    catch (error) {
        console.error('Check subscriptions error:', error);
        res.status(500).json({ error: 'Ошибка проверки подписок' });
    }
});
// Получение награды за подписку
router.post('/claim-reward', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.body;
        if (!channelId) {
            return res.status(400).json({ error: 'ID канала обязателен' });
        }
        await database_1.pool.query('BEGIN');
        try {
            // Проверяем подписку
            const subscriptionResult = await database_1.pool.query(`SELECT us.*, c.reward_type, c.reward_value, c.name as channel_name
         FROM user_subscriptions us
         JOIN channels c ON us.channel_id = c.id
         WHERE us.user_id = $1 AND us.channel_id = $2 AND us.verified = true`, [userId, channelId]);
            if (subscriptionResult.rows.length === 0) {
                await database_1.pool.query('ROLLBACK');
                return res.status(400).json({ error: 'Подписка не подтверждена' });
            }
            const subscription = subscriptionResult.rows[0];
            if (subscription.reward_claimed) {
                await database_1.pool.query('ROLLBACK');
                return res.status(400).json({ error: 'Награда уже получена' });
            }
            // Отмечаем награду как полученную
            await database_1.pool.query('UPDATE user_subscriptions SET reward_claimed = true WHERE id = $1', [subscription.id]);
            const rewardData = {
                channelId,
                channelName: subscription.channel_name,
                rewardType: subscription.reward_type,
                rewardValue: subscription.reward_value
            };
            if (subscription.reward_type === 'case') {
                // Даем бесплатный кейс
                const caseResult = await database_1.pool.query('SELECT id FROM cases WHERE type = $1 LIMIT 1', ['ad']);
                if (caseResult.rows.length > 0) {
                    await database_1.pool.query(`INSERT INTO inventory_items 
             (user_id, name, rarity, is_fragment, fragments, price)
             VALUES ($1, $2, $3, $4, $5, $6)`, [
                        userId,
                        `Кейс за подписку на ${subscription.channel_name}`,
                        'common',
                        false,
                        1,
                        0
                    ]);
                }
            }
            else if (subscription.reward_type === 'balance') {
                // Даем баланс
                await database_1.pool.query('UPDATE users SET balance = balance + $1, total_earned = total_earned + $1 WHERE id = $2', [subscription.reward_value, userId]);
            }
            else if (subscription.reward_type === 'fragment') {
                // Даем фрагменты
                await database_1.pool.query(`INSERT INTO inventory_items 
           (user_id, name, rarity, is_fragment, fragments, price)
           VALUES ($1, $2, $3, $4, $5, $6)`, [
                    userId,
                    'Фрагменты за подписку',
                    'common',
                    true,
                    subscription.reward_value,
                    0
                ]);
            }
            // Записываем транзакцию
            await database_1.pool.query(`INSERT INTO transactions (user_id, type, amount, metadata) 
         VALUES ($1, 'subscription_reward', $2, $3)`, [
                userId,
                subscription.reward_value,
                JSON.stringify(rewardData)
            ]);
            await database_1.pool.query('COMMIT');
            res.json({
                success: true,
                reward: subscription.reward_value,
                rewardType: subscription.reward_type,
                message: `Награда за подписку получена!`
            });
        }
        catch (error) {
            await database_1.pool.query('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('Claim reward error:', error);
        res.status(500).json({ error: 'Ошибка получения награды' });
    }
});
// Получение статистики по подпискам
router.get('/stats', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const statsResult = await database_1.pool.query(`SELECT 
        COUNT(*) as total_channels,
        COUNT(CASE WHEN us.verified = true THEN 1 END) as subscribed,
        COUNT(CASE WHEN us.reward_claimed = true THEN 1 END) as claimed,
        SUM(CASE WHEN us.verified = true AND us.reward_claimed = false THEN c.reward_value ELSE 0 END) as pending_rewards
       FROM channels c
       LEFT JOIN user_subscriptions us ON c.id = us.channel_id AND us.user_id = $1
       WHERE c.is_active = true`, [userId]);
        const earnedResult = await database_1.pool.query(`SELECT COALESCE(SUM(amount), 0) as total_earned
       FROM transactions 
       WHERE user_id = $1 AND type = 'subscription_reward'`, [userId]);
        res.json({
            success: true,
            stats: {
                ...statsResult.rows[0],
                totalEarned: parseInt(earnedResult.rows[0]?.total_earned || '0')
            }
        });
    }
    catch (error) {
        console.error('Get channels stats error:', error);
        res.status(500).json({ error: 'Ошибка получения статистики' });
    }
});
exports.default = router;
