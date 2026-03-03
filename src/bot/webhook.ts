import express, { Request, Response } from 'express';
import bot from './bot';
import { config } from '../config/config';

const router = express.Router();

// Вебхук для Telegram
router.post('/webhook', (req, res) => {
  try {
    // Проверяем, что данные существуют
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Empty request body' 
      });
    }

    // Обрабатываем обновление
    bot.handleUpdate(req.body)
      .then(() => {
        res.json({ success: true, message: 'Update processed' });
      })
      .catch((error: Error) => {
        console.error('Webhook handleUpdate error:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Error processing update',
          message: error.message 
        });
      });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      success: false, 
      error: 'Webhook processing error',
      message: errorMessage 
    });
  }
});

// Проверка статуса вебхука
router.get('/webhook', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Webhook is working',
    botUsername: bot.botInfo?.username || 'Unknown'
  });
});

// Удаление вебхука (для отладки)
router.delete('/webhook', async (req, res) => {
  try {
    await bot.telegram.deleteWebhook();
    res.json({ 
      success: true, 
      message: 'Webhook deleted' 
    });
  } catch (error: unknown) {
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
router.get('/webhook/info', async (req, res) => {
  try {
    const webhookInfo = await bot.telegram.getWebhookInfo();
    res.json({ 
      success: true, 
      info: webhookInfo 
    });
  } catch (error: unknown) {
    console.error('Get webhook info error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      success: false, 
      error: 'Error getting webhook info',
      message: errorMessage 
    });
  }
});

export default router;
