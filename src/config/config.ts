import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  // База данных
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production',
  },

  // Сервер
  server: {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV ,
    apiVersion: process.env.API_VERSION || 'v1',
    url: process.env.BACKEND_URL || process.env.APP_URL || 'http://localhost:3001',
  },

  // JWT токен
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ,
  },

  // Telegram Bot
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    botUsername: process.env.TELEGRAM_BOT_USERNAME,
    webAppUrl: process.env.TELEGRAM_WEB_APP_URL,
    loginWidget: process.env.TELEGRAM_LOGIN_WIDGET,
  },

  // Администраторы
  admin: {
    ids: process.env.ADMIN_IDS?.split(',').map(id => id.trim()) || ['777777777', '123456789'],
    whitelist: process.env.ADMIN_WHITELIST?.split(',').map(id => id.trim()) || [],
    email: process.env.ADMIN_EMAIL || 'admin@skinfactory.com',
  },

  // Платежи
  payments: {
    yookassa: {
      shopId: process.env.YOOKASSA_SHOP_ID || '',
      secretKey: process.env.YOOKASSA_SECRET_KEY || '',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    qiwi: {
      token: process.env.QIWI_TOKEN || '',
      phone: process.env.QIWI_PHONE || '',
    },
  },

  // Steam API
  steam: {
    apiKey: process.env.STEAM_API_KEY || '',
    webApiKey: process.env.STEAM_WEB_API_KEY || '',
  },

  // Фронтенд
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://backend-tg-4k2p.vercel.app/',
      'https://*.vercel.app',
      'https://skinfactory.com',
    ],
  },

  // Redis (кеширование)
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || '',
  },

  // Логирование
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    path: process.env.LOG_PATH || './logs',
  },

  // Безопасность
  security: {
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 минут
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  // Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@skinfactory.com',
  },

  // CDN для изображений
  cdn: {
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  },

  // Настройки приложения
  app: {
    name: process.env.APP_NAME || 'Skin Factory',
    version: process.env.APP_VERSION || '2.0.0',
    description: process.env.APP_DESCRIPTION || 'CS:GO Skin Opening Platform',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@skinfactory.com',
    maintenance: process.env.MAINTENANCE_MODE === 'true',
  },
};

// Валидация обязательных переменных
export const validateConfig = () => {
  const required = [
    'DATABASE_URL',
    'TELEGRAM_BOT_TOKEN',
    'JWT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Отсутствуют обязательные переменные окружения: ${missing.join(', ')}`);
  }

  console.log('✅ Конфигурация загружена успешно');
  return true;
};

export default config;