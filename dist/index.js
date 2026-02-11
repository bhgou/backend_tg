"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = require("./config/config");
const telegram_1 = __importDefault(require("./config/telegram"));
const database_1 = require("./db/database");
// Импорт маршрутов
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const case_routes_1 = __importDefault(require("./routes/case.routes"));
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const market_routes_1 = __importDefault(require("./routes/market.routes"));
const channels_routes_1 = __importDefault(require("./routes/channels.routes"));
const realSkins_routes_1 = __importDefault(require("./routes/realSkins.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const minigame_routes_1 = __importDefault(require("./routes/minigame.routes"));
const webhook_1 = __importDefault(require("./bot/webhook"));
const app = (0, express_1.default)();
// Валидация конфигурации
try {
    (0, config_1.validateConfig)();
}
catch (error) {
    console.error('❌ Ошибка конфигурации:', error.message);
    process.exit(1);
}
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: config_1.config.frontend.allowedOrigins,
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, morgan_1.default)(config_1.config.server.nodeEnv === 'development' ? 'dev' : 'combined'));
// API Routes
app.use('/api/admin', admin_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/games', minigame_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/user', user_routes_1.default);
app.use('/api/cases', case_routes_1.default);
app.use('/api/inventory', inventory_routes_1.default);
app.use('/api/market', market_routes_1.default);
app.use('/api/channels', channels_routes_1.default);
app.use('/api/real-skins', realSkins_routes_1.default);
// Webhook для Telegram
app.use('/api/bot', webhook_1.default);
// Статические файлы
app.use('/uploads', express_1.default.static(config_1.config.cdn.uploadPath));
// Инициализация базы данных (только для разработки)
if (config_1.config.server.nodeEnv === 'development') {
    app.get('/api/dev/init-db', async (req, res) => {
        try {
            await (0, database_1.initDatabase)();
            res.json({ success: true, message: 'База данных инициализирована' });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Ошибка инициализации БД',
                details: error.message
            });
        }
    });
    app.get('/api/dev/seed-db', async (req, res) => {
        try {
            await (0, database_1.seedDatabase)();
            res.json({ success: true, message: 'Тестовые данные добавлены' });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Ошибка заполнения БД',
                details: error.message
            });
        }
    });
}
// Проверка подключения к БД
app.get('/api/health/db', async (req, res) => {
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
// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        app: config_1.config.app.name,
        version: config_1.config.app.version,
        status: 'ok',
        environment: config_1.config.server.nodeEnv,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Информация о API
app.get('/api', (req, res) => {
    res.json({
        success: true,
        name: config_1.config.app.name,
        version: config_1.config.app.version,
        description: config_1.config.app.description,
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
        message: config_1.config.server.nodeEnv === 'development' ? err.message : undefined
    });
});
// Start server
const startServer = async () => {
    try {
        console.log('🚀 Запуск сервера...');
        // Проверяем подключение к БД
        const isConnected = await (0, database_1.testConnection)();
        if (!isConnected) {
            console.error('❌ Не удалось подключиться к базе данных');
            if (config_1.config.server.nodeEnv === 'development') {
                console.log('🔄 Попытка инициализации БД...');
                try {
                    await (0, database_1.initDatabase)();
                    await (0, database_1.seedDatabase)();
                    console.log('✅ База данных создана и заполнена');
                }
                catch (error) {
                    console.error('❌ Ошибка инициализации БД:', error);
                }
            }
        }
        else {
            console.log('✅ Подключение к БД успешно');
        }
        // Запускаем Telegram бота
        await telegram_1.default.launchBot();
        app.listen(config_1.config.server.port, () => {
            console.log('='.repeat(50));
            console.log(`✅ Сервер запущен на порту ${config_1.config.server.port}`);
            console.log(`📊 Режим: ${config_1.config.server.nodeEnv}`);
            console.log(`🌐 API: http://localhost:${config_1.config.server.port}/api`);
            console.log(`❤️  Health: http://localhost:${config_1.config.server.port}/api/health`);
            console.log(`🗄️  Проверка БД: http://localhost:${config_1.config.server.port}/api/health/db`);
            console.log('='.repeat(50));
            if (config_1.config.server.nodeEnv === 'development') {
                console.log('🛠️  Инструменты разработчика:');
                console.log(`   📁 Инициализация БД: http://localhost:${config_1.config.server.port}/api/dev/init-db`);
                console.log(`   🌱 Заполнение данными: http://localhost:${config_1.config.server.port}/api/dev/seed-db`);
            }
        });
    }
    catch (error) {
        console.error('❌ Ошибка запуска сервера:', error.message);
        process.exit(1);
    }
};
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    await telegram_1.default.stopBot();
    await database_1.pool.end();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT received. Shutting down gracefully...');
    await telegram_1.default.stopBot();
    await database_1.pool.end();
    process.exit(0);
});
startServer();
