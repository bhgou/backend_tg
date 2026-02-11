"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inputValidation = exports.bruteForceProtection = exports.csrfProtection = void 0;
const crypto_1 = __importDefault(require("crypto"));
// Защита от CSRF
const csrfProtection = (req, res, next) => {
    if (req.method === 'GET') {
        const csrfToken = crypto_1.default.randomBytes(32).toString('hex');
        res.locals.csrfToken = csrfToken;
        res.cookie('XSRF-TOKEN', csrfToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
    }
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
        const token = req.headers['x-csrf-token'] || req.body._csrf;
        const cookieToken = req.cookies['XSRF-TOKEN'];
        if (!token || token !== cookieToken) {
            return res.status(403).json({
                success: false,
                error: 'CSRF token validation failed'
            });
        }
    }
    next();
};
exports.csrfProtection = csrfProtection;
// Защита от brute force атак
const loginAttempts = new Map();
const bruteForceProtection = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || '';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 минут
    const maxAttempts = 5;
    const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
    // Сбрасываем счетчик если прошло больше окна
    if (now - attempts.lastAttempt > windowMs) {
        attempts.count = 0;
    }
    if (attempts.count >= maxAttempts) {
        const remainingTime = Math.ceil((attempts.lastAttempt + windowMs - now) / 1000 / 60);
        return res.status(429).json({
            success: false,
            error: `Слишком много попыток. Попробуйте через ${remainingTime} минут`
        });
    }
    if (req.path.includes('/auth/login')) {
        attempts.count++;
        attempts.lastAttempt = now;
        loginAttempts.set(ip, attempts);
    }
    next();
};
exports.bruteForceProtection = bruteForceProtection;
// Валидация входных данных
const inputValidation = (req, res, next) => {
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };
    const validatePhone = (phone) => {
        const re = /^\+?[1-9]\d{1,14}$/;
        return re.test(phone);
    };
    const validateNumber = (num) => {
        return !isNaN(parseFloat(num)) && isFinite(num);
    };
    // Валидация конкретных полей если они есть
    if (req.body.email && !validateEmail(req.body.email)) {
        return res.status(400).json({
            success: false,
            error: 'Неверный формат email'
        });
    }
    if (req.body.phone && !validatePhone(req.body.phone)) {
        return res.status(400).json({
            success: false,
            error: 'Неверный формат телефона'
        });
    }
    if (req.body.amount && !validateNumber(req.body.amount)) {
        return res.status(400).json({
            success: false,
            error: 'Неверный формат суммы'
        });
    }
    next();
};
exports.inputValidation = inputValidation;
