import { Telegraf } from 'telegraf';
import { config } from './config';
import bot from '../bot/bot';

class TelegramService {
  private static instance: TelegramService;
  private webhookUrl: string = '';

  private constructor() {
    this.initialize();
  }

  private initialize() {
    if (!config.telegram.botToken) {
      console.warn('⚠️ TELEGRAM_BOT_TOKEN не установлен. Бот не будет запущен.');
      return;
    }

    try {
      this.webhookUrl = `${config.server.nodeEnv === 'production' 
        ? config.server.url
        : `http://localhost:${config.server.port}`}/api/bot/webhook`;
      
      console.log('🤖 Telegram сервис инициализирован');
      console.log(`🌐 Webhook URL: ${this.webhookUrl}`);
    } catch (error) {
      console.error('❌ Ошибка инициализации Telegram бота:', error);
    }
  }

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  public getWebhookUrl(): string {
    return this.webhookUrl;
  }

  public async launchBot() {
    if (!config.telegram.botToken) {
      console.warn('⚠️ Бот не инициализирован, пропускаем запуск');
      return;
    }

    try {
      if (config.server.nodeEnv === 'production') {
        // В продакшене устанавливаем webhook через Express
        await bot.telegram.setWebhook(this.webhookUrl);
        console.log('🤖 Бот запущен в режиме webhook через Express');
      } else {
        // В разработке запускаем бота в режиме polling
        bot.launch();
        console.log('🤖 Бот запущен в режиме polling');
      }

      console.log(`🔗 Имя бота: ${config.telegram.botUsername}`);
    } catch (error) {
      console.error('❌ Ошибка запуска бота:', error);
    }
  }

  public async stopBot() {
    try {
      if (config.server.nodeEnv === 'production') {
        await bot.telegram.deleteWebhook();
        console.log('🛑 Webhook удален');
      } else {
        bot.stop('SIGTERM');
        console.log('🛑 Бот остановлен');
      }
    } catch (error) {
      console.error('Ошибка остановки бота:', error);
    }
  }

  public async sendMessageToUser(telegramId: string, message: string, options?: any) {
    try {
      await bot.telegram.sendMessage(telegramId, message, {
        parse_mode: 'HTML',
        ...options
      });
      return true;
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      return false;
    }
  }

  public async sendMessageToAdmin(message: string) {
    for (const adminId of config.admin.ids) {
      await this.sendMessageToUser(adminId, `👨‍💻 Админ уведомление:\n${message}`);
    }
  }

  public async verifyUserSubscription(telegramId: string, channelUsername: string): Promise<boolean> {
    // В реальном приложении здесь проверка через Telegram API
    // Для демо возвращаем случайное значение
    return Math.random() > 0.3;
  }
}

export const telegramService = TelegramService.getInstance();
export default telegramService;