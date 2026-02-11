"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramService = void 0;
const telegraf_1 = require("telegraf");
const config_1 = require("./config");
class TelegramService {
    constructor() {
        this.bot = null;
        this.webhookUrl = '';
        this.initialize();
    }
    initialize() {
        if (!config_1.config.telegram.botToken) {
            console.warn('⚠️ TELEGRAM_BOT_TOKEN не установлен. Бот не будет запущен.');
            return;
        }
        try {
            this.bot = new telegraf_1.Telegraf(config_1.config.telegram.botToken);
            this.webhookUrl = `${config_1.config.server.nodeEnv === 'production'
                ? process.env.APP_URL
                : `http://localhost:${config_1.config.server.port}`}/api/bot/webhook`;
            this.setupBot();
            console.log('🤖 Telegram сервис инициализирован');
        }
        catch (error) {
            console.error('❌ Ошибка инициализации Telegram бота:', error);
        }
    }
    setupBot() {
        if (!this.bot)
            return;
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
                                        url: `${config_1.config.frontend.url}${startParam ? `?ref=${startParam}` : ''}`
                                    }
                                }],
                            [{
                                    text: '📱 Открыть в WebApp',
                                    url: `https://t.me/${config_1.config.telegram.botUsername}/skin_factory${startParam ? `?startapp=${startParam}` : ''}`
                                }],
                            [{
                                    text: '📢 Проверить подписки',
                                    callback_data: 'check_subscriptions'
                                }]
                        ]
                    }
                });
            }
            catch (error) {
                console.error('Start command error:', error);
            }
        });
        this.bot.command('profile', async (ctx) => {
            try {
                const telegramId = ctx.from?.id.toString();
                if (!telegramId)
                    return;
                await ctx.reply('👤 Загружаю ваш профиль...', {
                    reply_markup: {
                        inline_keyboard: [[{
                                    text: '📊 Открыть профиль',
                                    web_app: { url: `${config_1.config.frontend.url}/profile` }
                                }]]
                    }
                });
            }
            catch (error) {
                console.error('Profile command error:', error);
            }
        });
        this.bot.command('balance', async (ctx) => {
            try {
                await ctx.reply('💰 Проверить баланс можно в приложении:', {
                    reply_markup: {
                        inline_keyboard: [[{
                                    text: '💰 Проверить баланс',
                                    web_app: { url: `${config_1.config.frontend.url}/profile` }
                                }]]
                    }
                });
            }
            catch (error) {
                console.error('Balance command error:', error);
            }
        });
        // Обработка WebApp данных
        this.bot.on('web_app_data', async (ctx) => {
            try {
                const webAppData = ctx.update.web_app_data?.data;
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
            }
            catch (error) {
                console.error('WebApp data error:', error);
                await ctx.reply('❌ Ошибка обработки данных');
            }
        });
        // Обработка ошибок
        this.bot.catch((error, ctx) => {
            console.error(`Ошибка в боте (${ctx.updateType}):`, error);
        });
    }
    generateStartMessage(startParam) {
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
    async handleUserConnected(ctx, data) {
        const telegramId = ctx.from?.id.toString();
        if (!telegramId)
            return;
        console.log(`Пользователь подключился: ${telegramId}`);
        // Здесь можно обновить информацию о пользователе в БД
    }
    async handleSubscriptionCheck(ctx, data) {
        const telegramId = ctx.from?.id.toString();
        if (!telegramId)
            return;
        console.log(`Проверка подписок для: ${telegramId}`);
        // Здесь можно проверить подписки на каналы
    }
    async handleCaseOpened(ctx, data) {
        const telegramId = ctx.from?.id.toString();
        if (!telegramId)
            return;
        console.log(`Кейс открыт пользователем ${telegramId}:`, data);
        // Здесь можно обработать открытие кейса
    }
    static getInstance() {
        if (!TelegramService.instance) {
            TelegramService.instance = new TelegramService();
        }
        return TelegramService.instance;
    }
    getBot() {
        return this.bot;
    }
    getWebhookUrl() {
        return this.webhookUrl;
    }
    async launchBot() {
        if (!this.bot) {
            console.warn('⚠️ Бот не инициализирован, пропускаем запуск');
            return;
        }
        try {
            if (config_1.config.server.nodeEnv === 'production') {
                await this.bot.launch({
                    webhook: {
                        domain: this.webhookUrl,
                        port: Number(config_1.config.server.port)
                    }
                });
                console.log('🤖 Бот запущен в режиме webhook');
            }
            else {
                await this.bot.launch();
                console.log('🤖 Бот запущен в режиме polling');
            }
            console.log(`🔗 Имя бота: ${config_1.config.telegram.botUsername}`);
            console.log(`🌐 Webhook URL: ${this.webhookUrl}`);
        }
        catch (error) {
            console.error('❌ Ошибка запуска бота:', error);
        }
    }
    async stopBot() {
        if (this.bot) {
            await this.bot.stop();
            console.log('🛑 Бот остановлен');
        }
    }
    async sendMessageToUser(telegramId, message, options) {
        if (!this.bot)
            return false;
        try {
            await this.bot.telegram.sendMessage(telegramId, message, {
                parse_mode: 'HTML',
                ...options
            });
            return true;
        }
        catch (error) {
            console.error('Ошибка отправки сообщения:', error);
            return false;
        }
    }
    async sendMessageToAdmin(message) {
        for (const adminId of config_1.config.admin.ids) {
            await this.sendMessageToUser(adminId, `👨‍💻 Админ уведомление:\n${message}`);
        }
    }
    async verifyUserSubscription(telegramId, channelUsername) {
        // В реальном приложении здесь проверка через Telegram API
        // Для демо возвращаем случайное значение
        return Math.random() > 0.3;
    }
}
exports.telegramService = TelegramService.getInstance();
exports.default = exports.telegramService;
