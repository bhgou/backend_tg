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
const channels_routes_1 = __importDefault(require("./routes/channels.routes"));
const realSkins_routes_1 = __importDefault(require("./routes/realSkins.routes"));
const bot_1 = require("./bot/bot");
// Импорт базы данных
const database_1 = require("./db/database");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'https://*.vercel.app'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, morgan_1.default)('dev'));
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/user', user_routes_1.default);
app.use('/api/cases', case_routes_1.default);
app.use('/api/inventory', inventory_routes_1.default);
app.use('/api/market', market_routes_1.default);
app.use('/api/channels', channels_routes_1.default);
app.use('/api/real-skins', realSkins_routes_1.default);
// Статические файлы для изображений скинов
app.use('/uploads', express_1.default.static('uploads'));
// Инициализация БД
app.get('/api/init-db', async (req, res) => {
    try {
        await (0, database_1.initDatabase)();
        res.json({ success: true, message: 'База данных инициализирована' });
    }
    catch (error) {
        console.error('Init DB error:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка инициализации БД',
            details: error.message
        });
    }
});
// Заполнение тестовыми данными
app.get('/api/seed-db', async (req, res) => {
    try {
        await (0, database_1.seedDatabase)();
        res.json({ success: true, message: 'Тестовые данные добавлены' });
    }
    catch (error) {
        console.error('Seed DB error:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка заполнения БД',
            details: error.message
        });
    }
});
// Проверка подключения к БД
app.get('/api/db-check', async (req, res) => {
    try {
        const isConnected = await (0, database_1.testConnection)();
        res.json({
            success: isConnected,
            status: isConnected ? 'connected' : 'disconnected',
            database: 'PostgreSQL',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            status: 'error',
            error: error.message
        });
    }
});
// Информация о API
app.get('/api', (req, res) => {
    res.json({
        success: true,
        name: 'CS:GO Skin Factory API',
        version: '2.0.0',
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
            },
            channels: {
                list: 'GET /api/channels',
                check: 'POST /api/channels/check-subscriptions',
                claim: 'POST /api/channels/claim-reward'
            },
            realSkins: {
                list: 'GET /api/real-skins',
                withdraw: 'POST /api/real-skins/withdraw'
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
// Start server
const startServer = async () => {
    try {
        console.log('🚀 Запуск сервера...');
        // Запуск бота
        (0, bot_1.startBot)();
        // Проверяем подключение к БД
        setTimeout(async () => {
            try {
                const isConnected = await (0, database_1.testConnection)();
                if (isConnected) {
                    console.log('✅ Подключение к БД успешно');
                }
                else {
                    console.log('⚠️  Проблемы с подключением к БД');
                }
            }
            catch (error) {
                console.log('⚠️  Ошибка подключения к БД:', error);
            }
        }, 1000);
        app.listen(PORT, () => {
            console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
            console.log(`📊 API доступен на http://localhost:${PORT}/api`);
            console.log(`❤️  Health check: http://localhost:${PORT}/health`);
            console.log(`🔌 Проверка БД: http://localhost:${PORT}/api/db-check`);
            console.log(`📁 Для инициализации БД: http://localhost:${PORT}/api/init-db`);
            console.log(`🌱 Для заполнения данными: http://localhost:${PORT}/api/seed-db`);
        });
    }
    catch (error) {
        console.error('❌ Ошибка запуска сервера:', error.message);
        process.exit(1);
    }
};
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
startServer();
