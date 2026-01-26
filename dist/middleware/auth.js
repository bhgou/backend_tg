"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../db/database");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Требуется аутентификация' });
        }
        const token = authHeader.split(' ')[1];
        // Проверяем JWT токен
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Проверяем, существует ли пользователь
        const userResult = await database_1.pool.query('SELECT id, telegram_id, username FROM users WHERE id = $1', [decoded.userId]);
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
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({ error: 'Неверный токен' });
        }
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Ошибка аутентификации' });
    }
};
exports.authenticate = authenticate;
