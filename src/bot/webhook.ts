import express from 'express';
import bot from './bot';

const router = express.Router();

// Вебхук для Telegram
router.post(`/webhook/${process.env.BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body, res);
});

router.get(`/webhook/${process.env.BOT_TOKEN}`, (req, res) => {
  res.send('Webhook is working');
});

export default router;