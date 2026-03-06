"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bot_1 = __importDefault(require("./bot"));
const router = express_1.default.Router();
// Вебхук для Telegram
router.post('/webhook', async (req, res) => {
    try {
        // Проверяем, что данные существуют
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Empty request body'
            });
        }
        // Обрабатываем обновление
        await bot_1.default.handleUpdate(req.body);
        res.json({ success: true, message: 'Update processed' });
    }
    catch (error) {
        console.error('Webhook handleUpdate error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: 'Error processing update',
            message: errorMessage
        });
    }
});
// Проверка статуса вебхука
router.get('/webhook', (_req, res) => {
    res.json({
        success: true,
        message: 'Webhook is working',
        botUsername: bot_1.default.botInfo?.username || 'Unknown'
    });
});
// Удаление вебхука (для отладки)
router.delete('/webhook', async (_req, res) => {
    try {
        await bot_1.default.telegram.deleteWebhook();
        res.json({
            success: true,
            message: 'Webhook deleted'
        });
    }
    catch (error) {
        console.error('Delete webhook error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: 'Error deleting webhook',
            message: errorMessage
        });
    }
});
// Информация о вебхуке
router.get('/webhook/info', async (_req, res) => {
    try {
        const webhookInfo = await bot_1.default.telegram.getWebhookInfo();
        res.json({
            success: true,
            info: webhookInfo
        });
    }
    catch (error) {
        console.error('Get webhook info error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: 'Error getting webhook info',
            message: errorMessage
        });
    }
});
exports.default = router;
//# sourceMappingURL=webhook.js.map