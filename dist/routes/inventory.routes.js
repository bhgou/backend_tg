"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../db/database");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Все роуты требуют аутентификации
router.use(auth_1.authenticate);
// Получение инвентаря пользователя
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { type = 'all' } = req.query; // all, skins, fragments
        let query = `
      SELECT 
        ii.*,
        s.weapon,
        s.fragments_required
      FROM inventory_items ii
      LEFT JOIN skins s ON ii.skin_id = s.id
      WHERE ii.user_id = $1
    `;
        const params = [userId];
        if (type === 'skins') {
            query += ' AND ii.is_fragment = false';
        }
        else if (type === 'fragments') {
            query += ' AND ii.is_fragment = true';
        }
        query += ' ORDER BY ii.created_at DESC';
        const inventoryResult = await database_1.pool.query(query, params);
        const items = inventoryResult.rows;
        const groupedItems = items.reduce((acc, item) => {
            if (item.is_fragment) {
                const key = `${item.skin_id}_${item.name}`;
                if (!acc[key]) {
                    acc[key] = {
                        ...item,
                        total_fragments: item.fragments,
                        fragments_required: item.fragments_required || 1,
                        progress: Math.round((item.fragments / (item.fragments_required || 1)) * 100)
                    };
                }
                else {
                    const existing = acc[key];
                    existing.total_fragments += item.fragments;
                    existing.progress = Math.round((existing.total_fragments / existing.fragments_required) * 100);
                }
            }
            else {
                acc[item.id] = item;
            }
            return acc;
        }, {});
        res.json({
            success: true,
            items: Object.values(groupedItems),
            total: items.length
        });
    }
    catch (error) {
        console.error('Get inventory error:', error);
        res.status(500).json({ error: 'Ошибка получения инвентаря' });
    }
});
// Сборка скина из фрагментов
router.post('/combine', async (req, res) => {
    try {
        const userId = req.user.id;
        const { skinId } = req.body;
        if (!skinId) {
            return res.status(400).json({ error: 'ID скина обязателен' });
        }
        // Получаем информацию о скине
        const skinResult = await database_1.pool.query('SELECT * FROM skins WHERE id = $1', [skinId]);
        if (skinResult.rows.length === 0) {
            return res.status(404).json({ error: 'Скин не найден' });
        }
        const skin = skinResult.rows[0];
        // Проверяем, есть ли достаточно фрагментов
        const fragmentsResult = await database_1.pool.query(`SELECT SUM(fragments) as total_fragments 
       FROM inventory_items 
       WHERE user_id = $1 AND skin_id = $2 AND is_fragment = true`, [userId, skinId]);
        const totalFragments = parseInt(fragmentsResult.rows[0]?.total_fragments || '0');
        if (totalFragments < skin.fragments_required) {
            return res.status(400).json({
                error: 'Недостаточно фрагментов',
                required: skin.fragments_required,
                current: totalFragments
            });
        }
        // Удаляем использованные фрагменты
        await database_1.pool.query(`DELETE FROM inventory_items 
       WHERE user_id = $1 AND skin_id = $2 AND is_fragment = true`, [userId, skinId]);
        // Добавляем собранный скин
        const newSkinResult = await database_1.pool.query(`INSERT INTO inventory_items 
       (user_id, skin_id, name, rarity, image_url, is_fragment, fragments, price) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`, [
            userId,
            skin.id,
            skin.name,
            skin.rarity,
            skin.image_url,
            false,
            1,
            skin.price
        ]);
        const newSkin = newSkinResult.rows[0];
        // Записываем транзакцию
        await database_1.pool.query(`INSERT INTO transactions (user_id, type, amount, metadata) 
       VALUES ($1, 'skin_combine', 0, $2)`, [
            userId,
            JSON.stringify({
                skinId: skin.id,
                skinName: skin.name,
                fragmentsUsed: skin.fragments_required,
                newItemId: newSkin.id
            })
        ]);
        res.json({
            success: true,
            skin: newSkin,
            message: `Поздравляем! Вы собрали ${skin.name}!`
        });
    }
    catch (error) {
        console.error('Combine skin error:', error);
        res.status(500).json({ error: 'Ошибка сборки скина' });
    }
});
// Выставление предмета на рынок
router.post('/sell', async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId, price } = req.body;
        if (!itemId || !price) {
            return res.status(400).json({
                error: 'ID предмета и цена обязательны'
            });
        }
        if (price < 10) {
            return res.status(400).json({
                error: 'Минимальная цена - 10 CR'
            });
        }
        // Проверяем, существует ли предмет и принадлежит ли пользователю
        const itemResult = await database_1.pool.query(`SELECT * FROM inventory_items 
       WHERE id = $1 AND user_id = $2`, [itemId, userId]);
        if (itemResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Предмет не найден или не принадлежит вам'
            });
        }
        const item = itemResult.rows[0];
        // Проверяем, не выставлен ли уже предмет
        const existingListing = await database_1.pool.query('SELECT * FROM market_listings WHERE item_id = $1 AND is_active = true', [itemId]);
        if (existingListing.rows.length > 0) {
            return res.status(400).json({
                error: 'Предмет уже выставлен на рынок'
            });
        }
        // Создаем лот на рынке
        const listingResult = await database_1.pool.query(`INSERT INTO market_listings (seller_id, item_id, price) 
       VALUES ($1, $2, $3) 
       RETURNING *`, [userId, itemId, price]);
        const listing = listingResult.rows[0];
        res.json({
            success: true,
            listing,
            message: 'Предмет успешно выставлен на рынок'
        });
    }
    catch (error) {
        console.error('Sell item error:', error);
        res.status(500).json({ error: 'Ошибка выставления предмета' });
    }
});
// Снятие предмета с рынка
router.post('/cancel-sale', async (req, res) => {
    try {
        const userId = req.user.id;
        const { listingId } = req.body;
        if (!listingId) {
            return res.status(400).json({ error: 'ID лота обязателен' });
        }
        // Проверяем, существует ли лот и принадлежит ли пользователю
        const listingResult = await database_1.pool.query(`SELECT * FROM market_listings 
       WHERE id = $1 AND seller_id = $2 AND is_active = true`, [listingId, userId]);
        if (listingResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Лот не найден или не принадлежит вам'
            });
        }
        // Деактивируем лот
        await database_1.pool.query(`UPDATE market_listings 
       SET is_active = false 
       WHERE id = $1`, [listingId]);
        res.json({
            success: true,
            message: 'Лот успешно снят с продажи'
        });
    }
    catch (error) {
        console.error('Cancel sale error:', error);
        res.status(500).json({ error: 'Ошибка снятия лота' });
    }
});
exports.default = router;
