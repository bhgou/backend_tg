import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';

// Импорт маршрутов
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import caseRoutes from './routes/case.routes';
import inventoryRoutes from './routes/inventory.routes';
import marketRoutes from './routes/market.routes';
import channelRoutes from './routes/channels.routes';
import realSkinRoutes from './routes/realSkins.routes';
import { startBot } from './bot/bot';

// Импорт базы данных
import { pool, testConnection, initDatabase, seedDatabase } from './db/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://*.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/real-skins', realSkinRoutes);

// Статические файлы для изображений скинов
app.use('/uploads', express.static('uploads'));

// Инициализация БД
app.get('/api/init-db', async (req, res) => {
  try {
    await initDatabase();
    res.json({ success: true, message: 'База данных инициализирована' });
  } catch (error: any) {
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
    await seedDatabase();
    res.json({ success: true, message: 'Тестовые данные добавлены' });
  } catch (error: any) {
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
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
    startBot();
    
    // Проверяем подключение к БД
    setTimeout(async () => {
      try {
        const isConnected = await testConnection();
        if (isConnected) {
          console.log('✅ Подключение к БД успешно');
        } else {
          console.log('⚠️  Проблемы с подключением к БД');
        }
      } catch (error) {
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
  } catch (error: any) {
    console.error('❌ Ошибка запуска сервера:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing database connection...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing database connection...');
  await pool.end();
  process.exit(0);
});

startServer();