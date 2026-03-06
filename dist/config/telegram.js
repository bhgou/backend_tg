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
            // Определяем URL для webhook
            if (config_1.config.server.nodeEnv === 'production') {
                // Приоритет переменных окружения для URL:
                // 1. RENDER_EXTERNAL_URL (автоматически на Render)
                // 2. BACKEND_URL (ручная настройка)
                // 3. config.server.url (из конфига)
                const renderUrl = process.env.RENDER_EXTERNAL_URL;
                const backendUrl = process.env.BACKEND_URL;
                const configUrl = config_1.config.server.url;
                let httpsUrl = renderUrl || backendUrl || configUrl;
                if (!httpsUrl) {
                    console.error('❌ Не удалось определить URL для webhook!');
                    console.error('Установите одну из переменных окружения:');
                    console.error('  - RENDER_EXTERNAL_URL (автоматически на Render)');
                    console.error('  - BACKEND_URL (ручная настройка)');
                    return;
                }
                // Убеждаемся, что URL начинается с https://
                if (httpsUrl.startsWith('http://')) {
                    httpsUrl = httpsUrl.replace('http://', 'https://');
                }
                else if (!httpsUrl.startsWith('https://')) {
                    httpsUrl = `https://${httpsUrl}`;
                }
                this.webhookUrl = `${httpsUrl}/api/bot/webhook`;
            }
            else {
                // В разработке используем localhost
                this.webhookUrl = `http://localhost:${config_1.config.server.port}/api/bot/webhook`;
            }
            console.log('🤖 Telegram сервис инициализирован');
            console.log(`🌐 Webhook URL: ${this.webhookUrl}`);
            console.log(`🔧 Environment: ${config_1.config.server.nodeEnv}`);
            console.log(`📡 Backend URL: ${config_1.config.server.url}`);
            console.log(`🔗 RENDER_EXTERNAL_URL: ${process.env.RENDER_EXTERNAL_URL || 'not set'}`);
            console.log(`🔗 BACKEND_URL: ${process.env.BACKEND_URL || 'not set'}`);
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
                // Проверяем, что webhook URL начинается с https://
                if (!this.webhookUrl.startsWith('https://')) {
                    throw new Error(`Webhook URL должен начинаться с https://. Текущий URL: ${this.webhookUrl}`);
                }
                // В продакшене устанавливаем webhook через Express
                await bot_1.default.telegram.setWebhook(this.webhookUrl);
                console.log('🤖 Бот запущен в режиме webhook через Express');
                console.log(`🔗 Webhook установлен: ${this.webhookUrl}`);
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
            throw error;
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
//# sourceMappingURL=telegram.js.map