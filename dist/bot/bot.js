"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBot = void 0;
const telegraf_1 = require("telegraf");
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("../db/database");
dotenv_1.default.config();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL;
const BOT_USERNAME = process.env.BOT_USERNAME;
if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN не установлен в .env');
}
if (!FRONTEND_URL) {
    throw new Error('FRONTEND_URL не установлен в .env');
}
const bot = new telegraf_1.Telegraf(BOT_TOKEN);
// Вспомогательная функция для безопасного парсинга
const parseWebAppData = (data) => {
    try {
        return JSON.parse(data);
    }
    catch (error) {
        console.error('Error parsing WebApp data:', error);
        return null;
    }
};
// Функция для проверки подписки
const checkSubscription = async (userId, channelUsername) => {
    try {
        if (!channelUsername)
            return false;
        // Для демо возвращаем случайное значение
        return Math.random() > 0.5;
    }
    catch (error) {
        console.error('Check subscription error:', error);
        return false;
    }
};
// Команда /start
bot.start(async (ctx) => {
    try {
        const startParam = ctx.message && 'text' in ctx.message ?
            (ctx.message.text.split(' ')[1] || undefined) :
            undefined;
        let message = '🎮 *Добро пожаловать в Skin Factory!*\n\n';
        message += 'Открывай кейсы, собирай фрагменты и получай реальные скины CS:GO!\n\n';
        if (startParam) {
            message += `✨ Реферальный код: ${startParam}\n`;
            message += 'При регистрации с этим кодом вы оба получите бонус!\n\n';
        }
        message += 'Нажмите кнопку ниже, чтобы начать:';
        await ctx.reply(message, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{
                            text: '🎮 Открыть приложение',
                            web_app: { url: `${FRONTEND_URL}${startParam ? `?ref=${startParam}` : ''}` }
                        }],
                    [{
                            text: '📱 Открыть на телефоне',
                            url: `https://t.me/${BOT_USERNAME || bot.botInfo?.username}/skin_factory${startParam ? `?startapp=${startParam}` : ''}`
                        }],
                    [{
                            text: '📢 Проверить подписки',
                            callback_data: 'check_subs'
                        }]
                ]
            }
        });
    }
    catch (error) {
        console.error('Start command error:', error);
    }
});
// Команда /play
bot.command('play', async (ctx) => {
    try {
        await ctx.reply('Открываю игру...', {
            reply_markup: {
                inline_keyboard: [[{
                            text: '🎮 Играть в Skin Factory',
                            web_app: { url: FRONTEND_URL }
                        }]]
            }
        });
    }
    catch (error) {
        console.error('Play command error:', error);
    }
});
// Команда для проверки подписок
bot.command('check_subs', async (ctx) => {
    try {
        if (!ctx.from) {
            await ctx.reply('Не удалось получить информацию о пользователе');
            return;
        }
        const telegramId = ctx.from.id.toString();
        // Получаем пользователя из БД
        const userResult = await database_1.pool.query('SELECT id, username FROM users WHERE telegram_id = $1', [telegramId]);
        if (userResult.rows.length === 0) {
            await ctx.reply('⚠️ Сначала войдите в приложение через кнопку "🎮 Открыть приложение"');
            return;
        }
        const userId = userResult.rows[0].id;
        const username = userResult.rows[0].username;
        // Получаем каналы для подписки
        const channelsResult = await database_1.pool.query('SELECT * FROM channels WHERE is_active = true');
        if (channelsResult.rows.length === 0) {
            await ctx.reply('📭 Нет доступных каналов для подписки');
            return;
        }
        let message = '📢 *Проверка подписок*\n\n';
        message += `Пользователь: @${username || 'не указан'}\n\n`;
        message += 'Список каналов:\n';
        const channels = channelsResult.rows;
        let subscribedCount = 0;
        for (const channel of channels) {
            const isSubscribed = await checkSubscription(telegramId, channel.username);
            // Обновляем статус в БД
            if (isSubscribed) {
                subscribedCount++;
                await database_1.pool.query(`INSERT INTO user_subscriptions (user_id, channel_id, telegram_username, verified)
           VALUES ($1, $2, $3, true)
           ON CONFLICT (user_id, channel_id) 
           DO UPDATE SET verified = true, subscribed_at = CURRENT_TIMESTAMP`, [userId, channel.id, username]);
            }
            const status = isSubscribed ? '✅ Подписан' : '❌ Не подписан';
            message += `\n${channel.name}: ${status}`;
            if (isSubscribed) {
                // Проверяем, получал ли награду
                const rewardResult = await database_1.pool.query('SELECT reward_claimed FROM user_subscriptions WHERE user_id = $1 AND channel_id = $2', [userId, channel.id]);
                if (rewardResult.rows.length > 0 && !rewardResult.rows[0].reward_claimed) {
                    message += ` (🎁 Награда доступна!)`;
                }
            }
        }
        message += `\n\n📊 Итого: ${subscribedCount}/${channels.length} каналов`;
        if (subscribedCount > 0) {
            message += '\n\n🎉 Откройте приложение, чтобы получить награды за подписки!';
        }
        else {
            message += '\n\n⚠️ Подпишитесь на каналы, чтобы получать бесплатные кейсы и фрагменты!';
        }
        await ctx.reply(message, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{
                            text: '🎮 Открыть приложение',
                            web_app: { url: FRONTEND_URL }
                        }],
                    [{
                            text: '🔄 Проверить подписки заново',
                            callback_data: 'check_subs'
                        }]
                ]
            }
        });
    }
    catch (error) {
        console.error('Check subs command error:', error);
        await ctx.reply('Произошла ошибка при проверке подписок. Попробуйте позже.');
    }
});
// Обработка callback query - УПРОЩЕННАЯ версия
bot.action('check_subs', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        await ctx.reply('Для проверки подписок используйте команду /check_subs в личных сообщениях с ботом.');
    }
    catch (error) {
        console.error('Callback query error:', error);
    }
});
// Обработка данных из WebApp - УПРОЩЕННАЯ версия
bot.on('web_app_data', async (ctx) => {
    try {
        // Используем any тип для обхода проблем с типами
        const update = ctx.update;
        if (update.web_app_data && update.web_app_data.data) {
            try {
                const data = parseWebAppData(update.web_app_data.data);
                if (data) {
                    console.log('Данные из WebApp:', data);
                    // Обработка различных типов данных
                    if (data.type === 'user_connected') {
                        const telegramId = ctx.from?.id.toString();
                        if (telegramId) {
                            // Обновляем username пользователя
                            await database_1.pool.query('UPDATE users SET username = $1 WHERE telegram_id = $2', [ctx.from?.username, telegramId]);
                        }
                    }
                    // Отправляем подтверждение
                    await ctx.reply('✅ Данные получены успешно!');
                }
            }
            catch (parseError) {
                console.error('Error parsing WebApp data:', parseError);
                await ctx.reply('❌ Ошибка обработки данных: неверный формат');
            }
        }
    }
    catch (error) {
        console.error('WebApp data error:', error);
        await ctx.reply('❌ Ошибка обработки данных');
    }
});
// Команда для администраторов
bot.command('stats', async (ctx) => {
    try {
        // Проверяем, является ли пользователь администратором
        const adminIds = process.env.ADMIN_IDS?.split(',').map(id => id.trim()) || [];
        if (!ctx.from || !adminIds.includes(ctx.from.id.toString())) {
            await ctx.reply('У вас нет доступа к этой команде');
            return;
        }
        const stats = await database_1.pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '1 day') as new_users_today,
        (SELECT COUNT(*) FROM cases) as total_cases,
        (SELECT COUNT(*) FROM real_skins) as total_real_skins,
        (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending') as pending_withdrawals,
        (SELECT SUM(balance) FROM users) as total_balance
    `);
        const statData = stats.rows[0];
        let message = '📊 *Статистика Skin Factory*\n\n';
        message += `👥 Пользователей: ${statData.total_users}\n`;
        message += `🆕 Новых сегодня: ${statData.new_users_today}\n`;
        message += `🎁 Кейсов: ${statData.total_cases}\n`;
        message += `🔫 Реальных скинов: ${statData.total_real_skins}\n`;
        message += `⏳ Заявок на вывод: ${statData.pending_withdrawals}\n`;
        message += `💰 Общий баланс: ${statData.total_balance} CR\n`;
        await ctx.reply(message, { parse_mode: 'Markdown' });
    }
    catch (error) {
        console.error('Stats command error:', error);
        await ctx.reply('Ошибка получения статистики');
    }
});
// Обработка ошибок
bot.catch((err, ctx) => {
    console.error(`Ошибка для ${ctx.updateType}:`, err);
});
// Запуск бота
const startBot = () => {
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
exports.startBot = startBot;
// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
exports.default = bot;
