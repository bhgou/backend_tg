"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../db/database");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Получение активных лотов (публичный доступ)
router.get('/', async (req, res) => {
    try {
        const { page = '1', limit = '20', rarity, weapon, minPrice, maxPrice, sortBy = 'newest' } = req.query;
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
        u.username as seller_name
      FROM market_listings ml
      JOIN inventory_items ii ON ml.item_id = ii.id
      JOIN users u ON ml.seller_id = u.id
      WHERE ml.is_active = true
    `;
        const params = [];
        let paramCount = 0;
        // Фильтры
        if (rarity) {
            paramCount++;
            query += ` AND ii.rarity = $${paramCount}`;
            params.push(rarity);
        }
        if (weapon) {
            paramCount++;
            query += ` AND ii.weapon = $${paramCount}`;
            params.push(weapon);
        }
        if (minPrice) {
            paramCount++;
            query += ` AND ml.price >= $${paramCount}`;
            params.push(minPrice);
        }
        if (maxPrice) {
            paramCount++;
            query += ` AND ml.price <= $${paramCount}`;
            params.push(maxPrice);
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
        // Пагинация
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);
        // Получаем лоты
        const listingsResult = await database_1.pool.query(query, params);
        const listings = listingsResult.rows;
        // Получаем общее количество
        let countQuery = `
      SELECT COUNT(*) 
      FROM market_listings ml
      JOIN inventory_items ii ON ml.item_id = ii.id
      WHERE ml.is_active = true
    `;
        const countParams = [];
        if (rarity) {
            countQuery += ' AND ii.rarity = $1';
            countParams.push(rarity);
        }
        if (weapon) {
            countQuery += rarity ? ' AND ii.weapon = $2' : ' AND ii.weapon = $1';
            countParams.push(weapon);
        }
        const countResult = await database_1.pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0]?.count || '0');
        res.json({
            success: true,
            listings,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Get market listings error:', error);
        res.status(500).json({ error: 'Ошибка получения лотов' });
    }
});
// Покупка лота (требует аутентификации)
router.post('/buy', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { listingId } = req.body;
        if (!listingId) {
            return res.status(400).json({ error: 'ID лота обязателен' });
        }
        // Получаем информацию о лоте
        const listingResult = await database_1.pool.query(`SELECT 
        ml.*,
        ii.*,
        u.balance as seller_balance
       FROM market_listings ml
       JOIN inventory_items ii ON ml.item_id = ii.id
       JOIN users u ON ml.seller_id = u.id
       WHERE ml.id = $1 AND ml.is_active = true`, [listingId]);
        if (listingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Лот не найден' });
        }
        const listing = listingResult.rows[0];
        // Проверяем, не покупатель ли это сам у себя
        if (listing.seller_id === userId) {
            return res.status(400).json({ error: 'Нельзя купить свой же лот' });
        }
        // Проверяем баланс покупателя
        const buyerResult = await database_1.pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
        if (buyerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Покупатель не найден' });
        }
        const buyerBalance = buyerResult.rows[0].balance;
        if (buyerBalance < listing.price) {
            return res.status(400).json({
                error: 'Недостаточно средств',
                required: listing.price,
                current: buyerBalance
            });
        }
        // Начинаем транзакцию
        await database_1.pool.query('BEGIN');
        try {
            // Списываем средства у покупателя
            await database_1.pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [listing.price, userId]);
            // Зачисляем средства продавцу (минус комиссия 5%)
            const commission = Math.round(listing.price * 0.05);
            const sellerAmount = listing.price - commission;
            await database_1.pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [sellerAmount, listing.seller_id]);
            // Передаем предмет покупателю
            await database_1.pool.query(`UPDATE inventory_items 
         SET user_id = $1 
         WHERE id = $2`, [userId, listing.item_id]);
            // Помечаем лот как проданный
            await database_1.pool.query(`UPDATE market_listings 
         SET is_active = false, sold_at = CURRENT_TIMESTAMP 
         WHERE id = $1`, [listingId]);
            // Записываем транзакции
            await database_1.pool.query(`INSERT INTO transactions (user_id, type, amount, metadata) 
         VALUES ($1, 'market_buy', $2, $3)`, [
                userId,
                -listing.price,
                JSON.stringify({
                    listingId,
                    itemId: listing.item_id,
                    itemName: listing.name,
                    sellerId: listing.seller_id,
                    price: listing.price
                })
            ]);
            await database_1.pool.query(`INSERT INTO transactions (user_id, type, amount, metadata) 
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
            await database_1.pool.query('COMMIT');
            // Получаем обновленный баланс покупателя
            const updatedBuyer = await database_1.pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
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
        catch (transactionError) {
            await database_1.pool.query('ROLLBACK');
            throw transactionError;
        }
    }
    catch (error) {
        console.error('Buy item error:', error);
        res.status(500).json({ error: 'Ошибка покупки предмета' });
    }
});
// Получение истории покупок/продаж пользователя
router.get('/history', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { type = 'all' } = req.query; // all, buy, sell
        let query = `
      SELECT 
        t.*,
        t.metadata->>'itemName' as item_name,
        t.metadata->>'price' as price
      FROM transactions t
      WHERE t.user_id = $1 
    `;
        const params = [userId];
        if (type === 'buy') {
            query += " AND t.type = 'market_buy'";
        }
        else if (type === 'sell') {
            query += " AND t.type = 'market_sell'";
        }
        else {
            query += " AND t.type IN ('market_buy', 'market_sell')";
        }
        query += ' ORDER BY t.created_at DESC LIMIT 20';
        const historyResult = await database_1.pool.query(query, params);
        const history = historyResult.rows;
        res.json({
            success: true,
            history
        });
    }
    catch (error) {
        console.error('Get market history error:', error);
        res.status(500).json({ error: 'Ошибка получения истории' });
    }
});
exports.default = router;
