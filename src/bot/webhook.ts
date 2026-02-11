import express from 'express';
import bot from './bot';
import { config } from '../config/config';

const router = express.Router();

// Вебхук для Telegram
router.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body, res);
});

router.get('/webhook', (req, res) => {
  res.send('Webhook is working');
});

export default router;