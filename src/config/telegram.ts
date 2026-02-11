import { Telegraf } from 'telegraf';
import { config } from './config';

class TelegramService {
  private static instance: TelegramService;
  private bot: Telegraf | null = null;
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
      this.bot = new Telegraf(config.telegram.botToken);
      this.webhookUrl = `${config.server.nodeEnv === 'production' 
        ? config.server.url
        : `http://localhost:${config.server.port}`}/api/bot/webhook`;
      
      this.setupBot();
      console.log('🤖 Telegram сервис инициализирован');
    } catch (error) {
      console.error('❌ Ошибка инициализации Telegram бота:', error);
    }
  }

  private setupBot() {
    if (!this.bot) return;

    // Команды бота
    this.bot.start(async (ctx) => {
      try {
        const startParam = ctx.message && 'text' in ctx.message ? 
          ctx.message.text.split(' ')[1] : undefined;
        
        const message = this.generateStartMessage(startParam);
        
        await ctx.reply(message, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{
                text: '🎮 Открыть приложение',
                web_app: { 
                  url: `${config.frontend.url}${startParam ? `?ref=${startParam}` : ''}` 
                }
              }],
              [{
                text: '📱 Открыть в WebApp',
                url: `https://t.me/${config.telegram.botUsername}/skin_factory${startParam ? `?startapp=${startParam}` : ''}`
              }],
              [{
                text: '📢 Проверить подписки',
                callback_data: 'check_subscriptions'
              }]
            ]
          }
        });
      } catch (error) {
        console.error('Start command error:', error);
      }
    });

    this.bot.command('profile', async (ctx) => {
      try {
        const telegramId = ctx.from?.id.toString();
        if (!telegramId) return;

        await ctx.reply('👤 Загружаю ваш профиль...', {
          reply_markup: {
            inline_keyboard: [[{
              text: '📊 Открыть профиль',
              web_app: { url: `${config.frontend.url}/profile` }
            }]]
          }
        });
      } catch (error) {
        console.error('Profile command error:', error);
      }
    });

    this.bot.command('balance', async (ctx) => {
      try {
        await ctx.reply('💰 Проверить баланс можно в приложении:', {
          reply_markup: {
            inline_keyboard: [[{
              text: '💰 Проверить баланс',
              web_app: { url: `${config.frontend.url}/profile` }
            }]]
          }
        });
      } catch (error) {
        console.error('Balance command error:', error);
      }
    });

    // Обработка WebApp данных
    this.bot.on('web_app_data', async (ctx) => {
      try {
        const webAppData = (ctx.update as any).web_app_data?.data;
        if (webAppData) {
          const data = JSON.parse(webAppData);
          console.log('📱 Данные из WebApp:', data);
          
          // Обработка различных типов данных
          switch (data.type) {
            case 'user_connected':
              await this.handleUserConnected(ctx, data);
              break;
            case 'subscription_check':
              await this.handleSubscriptionCheck(ctx, data);
              break;
            case 'case_opened':
              await this.handleCaseOpened(ctx, data);
              break;
            default:
              console.log('Неизвестный тип данных:', data.type);
          }
          
          await ctx.reply('✅ Данные получены успешно!');
        }
      } catch (error) {
        console.error('WebApp data error:', error);
        await ctx.reply('❌ Ошибка обработки данных');
      }
    });

    // Обработка ошибок
    this.bot.catch((error: any, ctx: any) => {
      console.error(`Ошибка в боте (${ctx.updateType}):`, error);
    });
  }

  private generateStartMessage(startParam?: string): string {
    let message = '🎮 *Добро пожаловать в Skin Factory!*\n\n';
    message += '🎁 Открывай кейсы\n';
    message += '💰 Выигрывай скины\n';
    message += '🔫 Получай реальные скины CS:GO\n\n';
    
    if (startParam) {
      message += `✨ Пригласил друг: ${startParam}\n`;
      message += 'Вы оба получите бонусы за приглашение!\n\n';
    }
    
    message += 'Нажмите кнопку ниже, чтобы начать:';
    return message;
  }

  private async handleUserConnected(ctx: any, data: any) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    console.log(`Пользователь подключился: ${telegramId}`);
    // Здесь можно обновить информацию о пользователе в БД
  }

  private async handleSubscriptionCheck(ctx: any, data: any) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    console.log(`Проверка подписок для: ${telegramId}`);
    // Здесь можно проверить подписки на каналы
  }

  private async handleCaseOpened(ctx: any, data: any) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    console.log(`Кейс открыт пользователем ${telegramId}:`, data);
    // Здесь можно обработать открытие кейса
  }

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  public getBot(): Telegraf | null {
    return this.bot;
  }

  public getWebhookUrl(): string {
    return this.webhookUrl;
  }

  public async launchBot() {
    if (!this.bot) {
      console.warn('⚠️ Бот не инициализирован, пропускаем запуск');
      return;
    }

    try {
      if (config.server.nodeEnv === 'production') {
        await this.bot.launch({
          webhook: {
            domain: this.webhookUrl,
            port: Number(config.server.port)
          }
        });
        console.log('🤖 Бот запущен в режиме webhook');
      } else {
        await this.bot.launch();
        console.log('🤖 Бот запущен в режиме polling');
      }
      
      console.log(`🔗 Имя бота: ${config.telegram.botUsername}`);
      console.log(`🌐 Webhook URL: ${this.webhookUrl}`);
    } catch (error) {
      console.error('❌ Ошибка запуска бота:', error);
    }
  }

  public async stopBot() {
    if (this.bot) {
      await this.bot.stop();
      console.log('🛑 Бот остановлен');
    }
  }

  public async sendMessageToUser(telegramId: string, message: string, options?: any) {
    if (!this.bot) return false;

    try {
      await this.bot.telegram.sendMessage(telegramId, message, {
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