"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// market.routes.ts
const express_1 = __importDefault(require("express"));
const database_1 = require("../db/database");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// Получение лотов с пагинацией и фильтрацией
router.get('/', async (req, res) => {
    try {
        const { page = '1', limit = '20', rarity, weapon, minPrice, maxPrice, sortBy = 'newest', search = '' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let query = `
      SELECT 
        ml.*,
        ii.name,
        ii.rarity,
        ii.weapon,
        ii.image_url,
        ii.is_fragment,
        ii.fragments,
        ii.price as item_price,
        u.username as seller_username,
        u.telegram_id as seller_telegram_id
      FROM market_listings ml
      JOIN inventory_items ii ON ml.item_id = ii.id
      JOIN users u ON ml.seller_id = u.id
      WHERE ml.is_active = true 
      AND ml.expires_at > NOW()
    `;
        const params = [];
        // Фильтры
        if (rarity && rarity !== 'all') {
            params.push(rarity);
            query += ` AND ii.rarity = $${params.length}`;
        }
        if (weapon && weapon !== 'all') {
            params.push(weapon);
            query += ` AND ii.weapon = $${params.length}`;
        }
        if (minPrice) {
            params.push(minPrice);
            query += ` AND ml.price >= $${params.length}`;
        }
        if (maxPrice) {
            params.push(maxPrice);
            query += ` AND ml.price <= $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (ii.name ILIKE $${params.length} OR u.username ILIKE $${params.length})`;
        }
        // Сортировка
        switch (sortBy) {
            case 'price_asc':
                query += ' ORDER BY ml.price ASC';
                break;
            case 'price_desc':
                query += ' ORDER BY ml.price DESC';
                break;
            case 'oldest':
                query += ' ORDER BY ml.created_at ASC';
                break;
            case 'newest':
            default:
                query += ' ORDER BY ml.created_at DESC';
                break;
        }
        // Получаем лоты
        params.push(limit, offset);
        const listingsResult = await database_1.pool.query(`${query} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
        // Получаем общее количество
        const countQuery = query.replace('SELECT ml.*, ii.name, ii.rarity, ii.weapon, ii.image_url, ii.is_fragment, ii.fragments, ii.price as item_price, u.username as seller_username, u.telegram_id as seller_telegram_id', 'SELECT COUNT(*)').split(' LIMIT ')[0];
        const countResult = await database_1.pool.query(countQuery, params.slice(0, -2));
        const total = parseInt(countResult.rows[0]?.count || '0');
        // Статистика рынка
        const statsResult = await database_1.pool.query(`
      SELECT 
        COUNT(*) as total_listings,
        COALESCE(SUM(price), 0) as total_volume,
        COALESCE(AVG(price), 0) as average_price,
        COUNT(DISTINCT seller_id) as active_sellers
      FROM market_listings 
      WHERE is_active = true AND expires_at > NOW()
    `);
        res.json({
            success: true,
            listings: listingsResult.rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            },
            stats: statsResult.rows[0]
        });
    }
    catch (error) {
        console.error('Get market listings error:', error);
        res.status(500).json({ success: false, error: 'Ошибка получения лотов' });
    }
});
// Создание лота
router.post('/listings', auth_1.authenticate, validation_1.validateMarketListing, async (req, res) => {
    const userId = req.user.id;
    const { itemId, price, duration = 7 } = req.body;
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        // 1. Проверяем предмет
        const itemResult = await client.query(`SELECT * FROM inventory_items 
       WHERE id = $1 AND user_id = $2 AND is_tradable = true AND is_marketable = true`, [itemId, userId]);
        if (itemResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'Предмет не найден или не может быть продан'
            });
        }
        const item = itemResult.rows[0];
        // 2. Проверяем цену
        if (price < 10 || price > 1000000) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'Цена должна быть от 10 до 1,000,000 CR'
            });
        }
        // 3. Проверяем, не выставлен ли уже предмет
        const existingListing = await client.query('SELECT * FROM market_listings WHERE item_id = $1 AND is_active = true', [itemId]);
        if (existingListing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'Предмет уже выставлен на рынок'
            });
        }
        // 4. Рассчитываем комиссию
        const feePercentage = getFeePercentage(duration);
        const fee = Math.floor(price * feePercentage / 100);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + duration);
        // 5. Создаем лот
        const listingResult = await client.query(`INSERT INTO market_listings 
       (seller_id, item_id, price, fee_percentage, expires_at) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`, [userId, itemId, price, feePercentage, expiresAt]);
        const listing = listingResult.rows[0];
        // 6. Обновляем предмет (помечаем как выставленный)
        await client.query(`UPDATE inventory_items SET is_marketable = false WHERE id = $1`, [itemId]);
        // 7. Записываем транзакцию
        await client.query(`INSERT INTO transactions (user_id, type, amount, metadata) 
       VALUES ($1, 'market_listing', $2, $3)`, [
            userId,
            -fee,
            JSON.stringify({
                listingId: listing.id,
                itemId,
                price,
                fee,
                duration,
                expiresAt: expiresAt.toISOString()
            })
        ]);
        await client.query('COMMIT');
        res.json({
            success: true,
            listing,
            message: 'Предмет успешно выставлен на рынок'
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Create listing error:', error);
        res.status(500).json({ success: false, error: 'Ошибка создания лота' });
    }
    finally {
        client.release();
    }
});
// Покупка лота
router.post('/buy', auth_1.authenticate, async (req, res) => {
    const userId = req.user.id;
    const { listingId } = req.body;
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        // 1. Получаем лот с блокировкой
        const listingResult = await client.query(`SELECT ml.*, ii.*, u.balance as seller_balance 
       FROM market_listings ml
       JOIN inventory_items ii ON ml.item_id = ii.id
       JOIN users u ON ml.seller_id = u.id
       WHERE ml.id = $1 AND ml.is_active = true 
       AND ml.expires_at > NOW()
       FOR UPDATE`, [listingId]);
        if (listingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Лот не найден' });
        }
        const listing = listingResult.rows[0];
        // 2. Проверяем, не покупатель ли это сам у себя
        if (listing.seller_id === userId) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: 'Нельзя купить свой же лот' });
        }
        // 3. Проверяем баланс покупателя
        const buyerResult = await client.query('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [userId]);
        if (buyerResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Покупатель не найден' });
        }
        const buyerBalance = buyerResult.rows[0].balance;
        if (buyerBalance < listing.price) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'Недостаточно средств',
                required: listing.price,
                current: buyerBalance
            });
        }
        // 4. Списываем средства у покупателя
        await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [listing.price, userId]);
        // 5. Зачисляем средства продавцу (минус комиссия)
        const commission = Math.floor(listing.price * listing.fee_percentage / 100);
        const sellerAmount = listing.price - commission;
        await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [sellerAmount, listing.seller_id]);
        // 6. Передаем предмет покупателю
        await client.query(`UPDATE inventory_items 
       SET user_id = $1, is_marketable = true 
       WHERE id = $2`, [userId, listing.item_id]);
        // 7. Помечаем лот как проданный
        await client.query(`UPDATE market_listings 
       SET is_active = false, sold_at = NOW(), buyer_id = $1 
       WHERE id = $2`, [userId, listingId]);
        // 8. Записываем транзакции
        await client.query(`INSERT INTO transactions (user_id, type, amount, metadata) 
       VALUES ($1, 'market_buy', $2, $3)`, [
            userId,
            -listing.price,
            JSON.stringify({
                listingId,
                itemId: listing.item_id,
                itemName: listing.name,
                sellerId: listing.seller_id,
                price: listing.price,
                commission
            })
        ]);
        await client.query(`INSERT INTO transactions (user_id, type, amount, metadata) 
       VALUES ($1, 'market_sell', $2, $3)`, [
            listing.seller_id,
            sellerAmount,
            JSON.stringify({
                listingId,
                itemId: listing.item_id,
                itemName: listing.name,
                buyerId: userId,
                price: listing.price,
                commission
            })
        ]);
        await client.query('COMMIT');
        // 9. Получаем обновленный баланс покупателя
        const updatedBuyer = await client.query('SELECT balance FROM users WHERE id = $1', [userId]);
        res.json({
            success: true,
            item: {
                id: listing.item_id,
                name: listing.name,
                rarity: listing.rarity,
                imageUrl: listing.image_url
            },
            newBalance: updatedBuyer.rows[0].balance,
            message: `Вы успешно купили ${listing.name} за ${listing.price} CR`
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Buy item error:', error);
        res.status(500).json({ success: false, error: 'Ошибка покупки предмета' });
    }
    finally {
        client.release();
    }
});
// Вспомогательная функция для расчета комиссии
function getFeePercentage(duration) {
    if (duration <= 1)
        return 5;
    if (duration <= 3)
        return 4;
    if (duration <= 7)
        return 3;
    if (duration <= 14)
        return 2;
    return 1;
}
exports.default = router;
