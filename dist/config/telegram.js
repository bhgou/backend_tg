"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramService = void 0;
const config_1 = require("./config");
const bot_1 = __importDefault(require("../bot/bot"));
class TelegramService {
    constructor() {
        this.webhookUrl = '';
        this.initialize();
    }
    initialize() {
        if (!config_1.config.telegram.botToken) {
            console.warn('⚠️ TELEGRAM_BOT_TOKEN не установлен. Бот не будет запущен.');
            return;
        }
        try {
            this.webhookUrl = `${config_1.config.server.nodeEnv === 'production'
                ? config_1.config.server.url
                : `http://localhost:${config_1.config.server.port}`}/api/bot/webhook`;
            console.log('🤖 Telegram сервис инициализирован');
            console.log(`🌐 Webhook URL: ${this.webhookUrl}`);
        }
        catch (error) {
            console.error('❌ Ошибка инициализации Telegram бота:', error);
        }
    }
    static getInstance() {
        if (!TelegramService.instance) {
            TelegramService.instance = new TelegramService();
        }
        return TelegramService.instance;
    }
    getWebhookUrl() {
        return this.webhookUrl;
    }
    async launchBot() {
        if (!config_1.config.telegram.botToken) {
            console.warn('⚠️ Бот не инициализирован, пропускаем запуск');
            return;
        }
        try {
            if (config_1.config.server.nodeEnv === 'production') {
                // В продакшене устанавливаем webhook через Express
                await bot_1.default.telegram.setWebhook(this.webhookUrl);
                console.log('🤖 Бот запущен в режиме webhook через Express');
            }
            else {
                // В разработке запускаем бота в режиме polling
                bot_1.default.launch();
                console.log('🤖 Бот запущен в режиме polling');
            }
            console.log(`🔗 Имя бота: ${config_1.config.telegram.botUsername}`);
        }
        catch (error) {
            console.error('❌ Ошибка запуска бота:', error);
        }
    }
    async stopBot() {
        try {
            if (config_1.config.server.nodeEnv === 'production') {
                await bot_1.default.telegram.deleteWebhook();
                console.log('🛑 Webhook удален');
            }
            else {
                bot_1.default.stop('SIGTERM');
                console.log('🛑 Бот остановлен');
            }
        }
        catch (error) {
            console.error('Ошибка остановки бота:', error);
        }
    }
    async sendMessageToUser(telegramId, message, options) {
        try {
            await bot_1.default.telegram.sendMessage(telegramId, message, {
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
