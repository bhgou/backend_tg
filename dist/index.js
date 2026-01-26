"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
// Импорт маршрутов
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const case_routes_1 = __importDefault(require("./routes/case.routes"));
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const market_routes_1 = __importDefault(require("./routes/market.routes"));
// Импорт базы данных
const database_1 = require("./db/database");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://tg-frontend-7ltg.vercel.app/', // Ваш фронтенд на Vercel
        'https://*.vercel.app'
    ],
    credentials: true
};
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('dev'));
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/user', user_routes_1.default);
app.use('/api/cases', case_routes_1.default);
app.use('/api/inventory', inventory_routes_1.default);
app.use('/api/market', market_routes_1.default);
// Инициализация БД (для админов)
app.get('/api/init-db', async (req, res) => {
    try {
        await (0, database_1.initDatabase)();
        res.json({ success: true, message: 'База данных инициализирована' });
    }
    catch (error) {
        res.status(500).json({ error: 'Ошибка инициализации БД' });
    }
});
// Заполнение тестовыми данными
app.get('/api/seed-db', async (req, res) => {
    try {
        await (0, database_1.seedDatabase)();
        res.json({ success: true, message: 'Тестовые данные добавлены' });
    }
    catch (error) {
        res.status(500).json({ error: 'Ошибка заполнения БД' });
    }
});
// Проверка подключения к БД
app.get('/api/db-check', async (req, res) => {
    try {
        await database_1.pool.query('SELECT 1');
        res.json({
            success: true,
            status: 'connected',
            database: 'PostgreSQL',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            status: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Информация о API
app.get('/api', (req, res) => {
    res.json({
        success: true,
        name: 'CS:GO Skin Factory API',
        version: '1.0.0',
        endpoints: {
            auth: {
                login: 'POST /api/auth/login',
                verify: 'POST /api/auth/verify'
            },
            user: {
                profile: 'GET /api/user/profile',
                stats: 'GET /api/user/stats',
                daily: 'POST /api/user/daily',
                referrals: 'GET /api/user/referrals'
            },
            cases: {
                list: 'GET /api/cases',
                open: 'POST /api/cases/open',
                history: 'GET /api/cases/history'
            },
            inventory: {
                list: 'GET /api/inventory',
                combine: 'POST /api/inventory/combine',
                sell: 'POST /api/inventory/sell'
            },
            market: {
                listings: 'GET /api/market',
                buy: 'POST /api/market/buy',
                history: 'GET /api/market/history'
            }
        }
    });
});
// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl
    });
});
// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Closing database connection...');
    await database_1.pool.end();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT received. Closing database connection...');
    await database_1.pool.end();
    process.exit(0);
});
// Start server
const startServer = async () => {
    try {
        // Проверяем подключение к БД
        const isConnected = await (0, database_1.testConnection)();
        if (!isConnected) {
            console.log('⚠️  Предупреждение: Нет подключения к базе данных');
            console.log('   Проверьте настройки PostgreSQL в .env файле');
        }
        else {
            console.log('✅ Подключение к PostgreSQL установлено');
        }
        app.listen(PORT, () => {
            console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
            console.log(`📊 API доступен на http://localhost:${PORT}/api`);
            console.log(`❤️  Health check: http://localhost:${PORT}/health`);
            console.log(`🔌 Проверка БД: http://localhost:${PORT}/api/db-check`);
            console.log(`📁 Для инициализации БД: http://localhost:${PORT}/api/init-db`);
            console.log(`🌱 Для заполнения данными: http://localhost:${PORT}/api/seed-db`);
        });
    }
    catch (error) {
        console.error('❌ Ошибка запуска сервера:', error);
        process.exit(1);
    }
};
startServer();
