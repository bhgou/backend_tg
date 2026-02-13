// Используем интерфейс для env переменных
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_TELEGRAM_BOT_USERNAME: string;
  readonly VITE_TELEGRAM_WEB_APP_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_SUPPORT_EMAIL: string;
  readonly VITE_MAINTENANCE_MODE: string;
  readonly VITE_THEME: string;
  readonly VITE_LANGUAGE: string;
  readonly VITE_ENABLE_TELEGRAM_AUTH: string;
  readonly VITE_ENABLE_PAYMENTS: string;
  readonly VITE_ENABLE_WITHDRAWALS: string;
  readonly VITE_ENABLE_MINI_GAMES: string;
  readonly VITE_ANIMATIONS: string;
}

interface Config {
  api: {
    baseUrl: string;
    timeout: number;
    version: string;
  };
  
  telegram: {
    botUsername: string;
    webAppUrl: string;
    loginWidget: string;
  };
  
  app: {
    name: string;
    version: string;
    description: string;
    supportEmail: string;
    maintenance: boolean;
  };
  
  features: {
    enableTelegramAuth: boolean;
    enablePayments: boolean;
    enableWithdrawals: boolean;
    enableMiniGames: boolean;
  };
  
  payment: {
    currencies: {
      cr: string;
      gc: string;
    };
    minDeposit: number;
    maxDeposit: number;
  };
  
  game: {
    minBet: number;
    maxBet: number;
    dailyRewardBase: number;
    dailyStreakBonus: number;
  };
  
  ui: {
    theme: 'dark' | 'light' | 'auto';
    language: string;
    animations: boolean;
  };
}

// Получаем переменные окружения
const getEnv = (key: keyof ImportMetaEnv, defaultValue: string = ''): string => {
  // В браузере используем import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = (import.meta.env as any)[key];
    return value !== undefined ? value : defaultValue;
  }
  // Для SSR или Node.js возвращаем дефолтное значение
  return defaultValue;
};

const config: Config = {
  api: {
    baseUrl: getEnv('VITE_API_URL', 'http://localhost:3001/api'),
    timeout: 30000,
    version: 'v1',
  },
  
  telegram: {
    botUsername: getEnv('VITE_TELEGRAM_BOT_USERNAME', 'skin_factory_bot'),
    webAppUrl: getEnv('VITE_TELEGRAM_WEB_APP_URL', 'https://t.me/skin_factory_bot/skin_factory'),
    loginWidget: 'https://oauth.telegram.org',
  },
  
  app: {
    name: getEnv('VITE_APP_NAME', 'Skin Factory'),
    version: getEnv('VITE_APP_VERSION', '2.0.0'),
    description: 'CS:GO Skin Opening Platform',
    supportEmail: getEnv('VITE_SUPPORT_EMAIL', 'support@skinfactory.com'),
    maintenance: getEnv('VITE_MAINTENANCE_MODE', 'false') === 'true',
  },
  
  features: {
    enableTelegramAuth: getEnv('VITE_ENABLE_TELEGRAM_AUTH', 'true') !== 'false',
    enablePayments: getEnv('VITE_ENABLE_PAYMENTS', 'true') !== 'false',
    enableWithdrawals: getEnv('VITE_ENABLE_WITHDRAWALS', 'true') !== 'false',
    enableMiniGames: getEnv('VITE_ENABLE_MINI_GAMES', 'true') !== 'false',
  },
  
  payment: {
    currencies: {
      cr: 'CR',
      gc: 'GC',
    },
    minDeposit: 50,
    maxDeposit: 50000,
  },
  
  game: {
    minBet: 10,
    maxBet: 10000,
    dailyRewardBase: 100,
    dailyStreakBonus: 20,
  },
  
  ui: {
    theme: (getEnv('VITE_THEME', 'dark') as 'dark' | 'light' | 'auto') || 'dark',
    language: getEnv('VITE_LANGUAGE', 'ru'),
    animations: getEnv('VITE_ANIMATIONS', 'true') !== 'false',
  },
};

// Валидация конфигурации
const validateConfig = () => {
  const required = ['VITE_API_URL'];
  const missing = required.filter(key => !getEnv(key as keyof ImportMetaEnv));
  
  if (missing.length > 0) {
    console.error(`Отсутствуют обязательные переменные окружения: ${missing.join(', ')}`);
    console.error('Пожалуйста, создайте файл .env с этими переменными');
    return false;
  }
  
  console.log('✅ Конфигурация фронтенда загружена');
  console.log(`📱 API URL: ${config.api.baseUrl}`);
  console.log(`🎮 App Name: ${config.app.name}`);
  console.log(`🔧 Features: Telegram Auth: ${config.features.enableTelegramAuth}, Payments: ${config.features.enablePayments}`);
  
  return true;
};

// Проверка при загрузке
validateConfig();

export default config;