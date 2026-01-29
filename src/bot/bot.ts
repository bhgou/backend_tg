import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL;

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN не установлен в .env');
}

if (!FRONTEND_URL) {
  throw new Error('FRONTEND_URL не установлен в .env');
}

const bot = new Telegraf(BOT_TOKEN);

// Команда /start с кнопкой для WebApp
bot.start((ctx) => {
  ctx.reply(
    '🎮 Добро пожаловать в Skin Factory!\n\nОткройте мини-приложение для начала игры:',
    {
      reply_markup: {
        inline_keyboard: [
          [{
            text: '🎮 Открыть приложение',
            web_app: { url: FRONTEND_URL }
          }],
          [{
            text: '📱 Открыть на телефоне',
            url: `https://t.me/${bot.botInfo?.username}?startapp=skin_factory`
          }]
        ]
      }
    }
  );
});

// Команда для открытия WebApp
bot.command('play', (ctx) => {
  ctx.reply('Открываю игру...', {
    reply_markup: {
      inline_keyboard: [[{
        text: '🎮 Играть',
        web_app: { url: FRONTEND_URL }
      }]]
    }
  });
});

// Обработка данных из WebApp
bot.on('web_app_data', (ctx) => {
  const data = ctx.webAppData?.data.json();
  console.log('Данные из WebApp:', data);
  // Обработка данных от WebApp
});

// Запуск бота
export const startBot = () => {
  bot.launch()
    .then(() => {
      console.log('🤖 Telegram бот запущен');
      console.log('🔗 Ссылка на бота:', `https://t.me/${bot.botInfo?.username}`);
      console.log('🌐 FRONTEND_URL:', FRONTEND_URL);
    })
    .catch((error) => {
      console.error('❌ Ошибка запуска бота:', error);
    });
};

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;