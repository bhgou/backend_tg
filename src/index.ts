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

// Импорт базы данных
import { pool, testConnection, initDatabase, seedDatabase } from './db/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/market', marketRoutes);

// Инициализация БД (для админов)
app.get('/api/init-db', async (req, res) => {
  try {
    await initDatabase();
    res.json({ success: true, message: 'База данных инициализирована' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка инициализации БД' });
  }
});

// Заполнение тестовыми данными
app.get('/api/seed-db', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Тестовые данные добавлены' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка заполнения БД' });
  }
});

// Проверка подключения к БД
app.get('/api/db-check', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      success: true, 
      status: 'connected',
      database: 'PostgreSQL',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
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
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing database connection...');
  await pool.end();
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Проверяем подключение к БД
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.log('⚠️  Предупреждение: Нет подключения к базе данных');
      console.log('   Проверьте настройки PostgreSQL в .env файле');
    } else {
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
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

startServer();