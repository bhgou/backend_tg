"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../db/database");
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Регистрация/логин через Telegram
router.post('/login', async (req, res) => {
    try {
        const { telegramId, username, firstName, lastName, photoUrl, referralCode, initData } = req.body;
        console.log('🔐 Login request received:', {
            telegramId,
            username,
            hasInitData: !!initData,
        });
        if (!telegramId) {
            console.error('❌ Login failed: telegramId is required');
            return res.status(400).json({ success: false, error: 'Telegram ID обязателен' });
        }
        // Проверяем, есть ли пользователь
        const existingUser = await database_1.pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
        let user;
        if (existingUser.rows.length > 0) {
            // Обновляем существующего пользователя
            user = existingUser.rows[0];
            await database_1.pool.query(`UPDATE users 
         SET username = $1, first_name = $2, last_name = $3, avatar_url = $4, updated_at = CURRENT_TIMESTAMP
         WHERE telegram_id = $5`, [username, firstName, lastName, photoUrl, telegramId]);
            console.log('✅ User updated:', { id: user.id, username });
        }
        else {
            // Создаем нового пользователя
            console.log('🆕 Creating new user:', { telegramId, username });
            let referredBy = null;
            // Проверяем реферальный код
            if (referralCode) {
                const referrer = await database_1.pool.query('SELECT id FROM users WHERE referral_code = $1', [referralCode]);
                if (referrer.rows.length > 0) {
                    referredBy = referrer.rows[0].id;
                    console.log('✅ Referral found:', { referrerId: referredBy });
                    // Начисляем бонус рефереру
                    await database_1.pool.query(`UPDATE users SET balance = balance + 200 WHERE id = $1`, [referredBy]);
                    await database_1.pool.query(`INSERT INTO transactions (user_id, type, amount, metadata) 
             VALUES ($1, 'referral', 200, $2)`, [referredBy, JSON.stringify({ newUserId: telegramId, referralCode })]);
                }
            }
            // Создаем пользователя
            const result = await database_1.pool.query(`INSERT INTO users 
         (telegram_id, username, first_name, last_name, avatar_url, referred_by) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`, [telegramId, username, firstName, lastName, photoUrl, referredBy]);
            user = result.rows[0];
            // Начисляем приветственный бонус
            await database_1.pool.query(`UPDATE users SET balance = balance + 500 WHERE id = $1`, [user.id]);
            await database_1.pool.query(`INSERT INTO transactions (user_id, type, amount, metadata) 
         VALUES ($1, 'welcome_bonus', 500, $2)`, [user.id, JSON.stringify({ source: 'registration' })]);
            console.log('✅ New user created:', { id: user.id, username, balance: user.balance });
        }
        // Создаем JWT токен
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            telegramId: user.telegram_id
        }, JWT_SECRET, { expiresIn: '30d' });
        const responseData = {
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
                premiumBalance: user.premium_balance || 0,
                totalEarned: user.total_earned,
                dailyStreak: user.daily_streak,
                referralCode: user.referral_code,
                isAdmin: user.is_admin || false,
                createdAt: user.created_at
            }
        };
        console.log('✅ Login successful:', { userId: user.id, username });
        res.json(responseData);
    }
    catch (error) {
        console.error('❌ Auth error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Ошибка аутентификации';
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});
// Проверка токена
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            console.error('❌ Verify failed: token is required');
            return res.status(400).json({ success: false, error: 'Токен обязателен' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const userResult = await database_1.pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
        if (userResult.rows.length === 0) {
            console.error('❌ Verify failed: user not found:', { userId: decoded.userId });
            return res.status(401).json({ success: false, error: 'Пользователь не найден' });
        }
        const user = userResult.rows[0];
        const responseData = {
            success: true,
            user: {
                id: user.id,
                telegramId: user.telegram_id,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                avatarUrl: user.avatar_url,
                balance: user.balance,
                premiumBalance: user.premium_balance || 0,
                totalEarned: user.total_earned,
                dailyStreak: user.daily_streak,
                referralCode: user.referral_code,
                isAdmin: user.is_admin || false,
                createdAt: user.created_at
            }
        };
        console.log('✅ Verify successful:', { userId: user.id, username: user.username });
        res.json(responseData);
    }
    catch (error) {
        console.error('❌ Verify error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Неверный токен';
        res.status(401).json({
            success: false,
            error: errorMessage
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map