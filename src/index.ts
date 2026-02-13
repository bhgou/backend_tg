import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config, validateConfig } from './config/config';
import telegramService from './config/telegram';
import { pool, testConnection, initDatabase, seedDatabase } from './db/database';

// Импорт маршрутов
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import caseRoutes from './routes/case.routes';
import inventoryRoutes from './routes/inventory.routes';
import marketRoutes from './routes/market.routes';
import channelRoutes from './routes/channels.routes';
import realSkinRoutes from './routes/realSkins.routes';
import adminRoutes from './routes/admin.routes';
import paymentRoutes from './routes/payment.routes';
import minigameRoutes from './routes/minigame.routes';
import webhookRoutes from './bot/webhook';

const app = express();

// Валидация конфигурации
try {
  validateConfig();
} catch (error: any) {
  console.error('❌ Ошибка конфигурации:', error.message);
  process.exit(1);
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: config.frontend.allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(config.server.nodeEnv === 'development' ? 'dev' : 'combined'));

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/games', minigameRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/real-skins', realSkinRoutes);

// Webhook для Telegram
app.use('/api/bot', webhookRoutes);

// Статические файлы
app.use('/uploads', express.static(config.cdn.uploadPath));

// Инициализация базы данных (только для разработки)
if (config.server.nodeEnv === 'development') {
  app.get('/api/dev/init-db', async (req, res) => {
    try {
      await initDatabase();
      res.json({ success: true, message: 'База данных инициализирована' });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        error: 'Ошибка инициализации БД',
        details: error.message 
      });
    }
  });

  app.get('/api/dev/seed-db', async (req, res) => {
    try {
      await seedDatabase();
      res.json({ success: true, message: 'Тестовые данные добавлены' });
    } catch (error: any) {
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
    const isConnected = await testConnection();
    res.json({ 
      success: isConnected,
      status: isConnected ? 'connected' : 'disconnected',
      database: 'PostgreSQL',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      status: 'error',
      error: error.message
    });
  }
});

// Health check для Render (root route)
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    status: 'ok',
    app: config.app.name,
    version: config.app.version
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    app: config.app.name,
    version: config.app.version,
    status: 'ok',
    environment: config.server.nodeEnv,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Информация о API
app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: config.app.name,
    version: config.app.version,
    description: config.app.description,
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
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error',
    message: config.server.nodeEnv === 'development' ? err.message : undefined
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Запуск сервера...');
    
    // Проверяем подключение к БД
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Не удалось подключиться к базе данных');
      if (config.server.nodeEnv === 'development') {
        console.log('🔄 Попытка инициализации БД...');
        try {
          await initDatabase();
          await seedDatabase();
          console.log('✅ База данных создана и заполнена');
        } catch (error) {
          console.error('❌ Ошибка инициализации БД:', error);
        }
      }
    } else {
      console.log('✅ Подключение к БД успешно');
    }

    // Запускаем Telegram бота
    await telegramService.launchBot();

    app.listen(config.server.port, () => {
      console.log('='.repeat(50));
      console.log(`✅ Сервер запущен на порту ${config.server.port}`);
      console.log(`📊 Режим: ${config.server.nodeEnv}`);
      console.log(`🌐 API: http://localhost:${config.server.port}/api`);
      console.log(`❤️  Health: http://localhost:${config.server.port}/api/health`);
      console.log(`🗄️  Проверка БД: http://localhost:${config.server.port}/api/health/db`);
      console.log('='.repeat(50));
      
      if (config.server.nodeEnv === 'development') {
        console.log('🛠️  Инструменты разработчика:');
        console.log(`   📁 Инициализация БД: http://localhost:${config.server.port}/api/dev/init-db`);
        console.log(`   🌱 Заполнение данными: http://localhost:${config.server.port}/api/dev/seed-db`);
      }
    });
  } catch (error: any) {
    console.error('❌ Ошибка запуска сервера:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await telegramService.stopBot();
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await telegramService.stopBot();
  await pool.end();
  process.exit(0);
});

startServer();