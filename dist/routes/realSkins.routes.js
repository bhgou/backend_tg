"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../db/database");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Получение реальных скинов
router.get('/', async (req, res) => {
    try {
        const { rarity, weapon, minPrice, maxPrice, sortBy = 'price_desc' } = req.query;
        let query = `
      SELECT * FROM real_skins 
      WHERE tradeable = true
    `;
        const params = [];
        if (rarity) {
            params.push(rarity);
            query += ` AND rarity = $${params.length}`;
        }
        if (weapon) {
            params.push(weapon);
            query += ` AND weapon = $${params.length}`;
        }
        if (minPrice) {
            params.push(minPrice);
            query += ` AND steam_price >= $${params.length}`;
        }
        if (maxPrice) {
            params.push(maxPrice);
            query += ` AND steam_price <= $${params.length}`;
        }
        // Сортировка
        switch (sortBy) {
            case 'price_asc':
                query += ' ORDER BY steam_price ASC';
                break;
            case 'rarity':
                query += ` ORDER BY 
    CASE 
      WHEN rarity = 'Contraband' THEN 1
      WHEN rarity = 'Covert' THEN 2
      WHEN rarity = 'Classified' THEN 3
      WHEN rarity = 'Restricted' THEN 4
      WHEN rarity = 'Mil-Spec' THEN 5
      WHEN rarity = 'Industrial Grade' THEN 6
      WHEN rarity = 'Consumer Grade' THEN 7
      ELSE 8
    END`;
                break;
            case 'price_desc':
            default:
                query += ' ORDER BY steam_price DESC';
                break;
        }
        query += ' LIMIT 50';
        const skinsResult = await database_1.pool.query(query, params);
        res.json({
            success: true,
            skins: skinsResult.rows
        });
    }
    catch (error) {
        console.error('Get real skins error:', error);
        res.status(500).json({ error: 'Ошибка получения скинов' });
    }
});
// Получение конкретного скина
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const skinResult = await database_1.pool.query('SELECT * FROM real_skins WHERE id = $1', [id]);
        if (skinResult.rows.length === 0) {
            return res.status(404).json({ error: 'Скин не найден' });
        }
        res.json({
            success: true,
            skin: skinResult.rows[0]
        });
    }
    catch (error) {
        console.error('Get real skin error:', error);
        res.status(500).json({ error: 'Ошибка получения скина' });
    }
});
// Заявка на вывод реального скина
router.post('/withdraw', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { skinId, steamTradeLink } = req.body;
        if (!skinId || !steamTradeLink) {
            return res.status(400).json({
                error: 'ID скина и Steam Trade Link обязательны'
            });
        }
        // Валидация Steam Trade Link
        if (!steamTradeLink.includes('steamcommunity.com/tradeoffer/new/')) {
            return res.status(400).json({
                error: 'Неверный Steam Trade Link формат'
            });
        }
        // Проверяем скин
        const skinResult = await database_1.pool.query('SELECT * FROM real_skins WHERE id = $1 AND tradeable = true', [skinId]);
        if (skinResult.rows.length === 0) {
            return res.status(404).json({ error: 'Скин не найден' });
        }
        const skin = skinResult.rows[0];
        // Проверяем фрагменты пользователя
        const fragmentsResult = await database_1.pool.query(`SELECT COALESCE(SUM(fragments), 0) as total_fragments 
       FROM inventory_items 
       WHERE user_id = $1 AND is_fragment = true`, [userId]);
        const totalFragments = parseInt(fragmentsResult.rows[0]?.total_fragments || '0');
        if (totalFragments < skin.fragments_required) {
            return res.status(400).json({
                error: 'Недостаточно фрагментов',
                required: skin.fragments_required,
                current: totalFragments,
                needed: skin.fragments_required - totalFragments
            });
        }
        await database_1.pool.query('BEGIN');
        try {
            // Создаем заявку на вывод
            const withdrawalResult = await database_1.pool.query(`INSERT INTO withdrawal_requests 
         (user_id, real_skin_id, steam_trade_link, fragments_used, status) 
         VALUES ($1, $2, $3, $4, 'pending') 
         RETURNING *`, [userId, skinId, steamTradeLink, skin.fragments_required]);
            // Удаляем использованные фрагменты
            await database_1.pool.query(`DELETE FROM inventory_items 
         WHERE user_id = $1 AND is_fragment = true`, [userId]);
            // Добавляем запись в real_skin_fragments для истории
            await database_1.pool.query(`INSERT INTO real_skin_fragments 
         (user_id, real_skin_id, fragments) 
         VALUES ($1, $2, $3)`, [userId, skinId, skin.fragments_required]);
            // Записываем транзакцию
            await database_1.pool.query(`INSERT INTO transactions (user_id, type, amount, metadata) 
         VALUES ($1, 'real_skin_withdrawal', $2, $3)`, [
                userId,
                -skin.fragments_required,
                JSON.stringify({
                    skinId: skin.id,
                    skinName: skin.name,
                    skinPrice: skin.steam_price,
                    fragmentsUsed: skin.fragments_required,
                    withdrawalId: withdrawalResult.rows[0].id,
                    steamTradeLink: steamTradeLink
                })
            ]);
            await database_1.pool.query('COMMIT');
            // Получаем обновленное количество фрагментов
            const updatedFragments = await database_1.pool.query(`SELECT COALESCE(SUM(fragments), 0) as total_fragments 
         FROM inventory_items 
         WHERE user_id = $1 AND is_fragment = true`, [userId]);
            res.json({
                success: true,
                withdrawal: withdrawalResult.rows[0],
                remainingFragments: parseInt(updatedFragments.rows[0]?.total_fragments || '0'),
                message: '✅ Заявка на вывод создана успешно!\n\n' +
                    'Администратор обработает её в течение 24 часов.\n' +
                    'После одобрения скин будет отправлен на указанный Steam Trade Link.'
            });
        }
        catch (error) {
            await database_1.pool.query('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('Withdraw skin error:', error);
        res.status(500).json({ error: 'Ошибка создания заявки' });
    }
});
// Получение истории выводов пользователя
router.get('/withdrawals/history', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const withdrawalsResult = await database_1.pool.query(`SELECT 
        wr.*,
        rs.name as skin_name,
        rs.image_url,
        rs.steam_price
       FROM withdrawal_requests wr
       JOIN real_skins rs ON wr.real_skin_id = rs.id
       WHERE wr.user_id = $1
       ORDER BY wr.created_at DESC
       LIMIT 20`, [userId]);
        res.json({
            success: true,
            withdrawals: withdrawalsResult.rows
        });
    }
    catch (error) {
        console.error('Get withdrawals history error:', error);
        res.status(500).json({ error: 'Ошибка получения истории выводов' });
    }
});
// Получение прогресса по фрагментам
router.get('/fragments/progress', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const fragmentsResult = await database_1.pool.query(`SELECT COALESCE(SUM(fragments), 0) as total_fragments 
       FROM inventory_items 
       WHERE user_id = $1 AND is_fragment = true`, [userId]);
        const totalFragments = parseInt(fragmentsResult.rows[0]?.total_fragments || '0');
        // Получаем скины, которые можно купить
        const affordableSkinsResult = await database_1.pool.query(`SELECT *, 
        ($1 >= fragments_required) as can_afford,
        (fragments_required - $1) as needed_fragments
       FROM real_skins 
       WHERE tradeable = true
       ORDER BY steam_price DESC`, [totalFragments]);
        res.json({
            success: true,
            totalFragments,
            affordableSkins: affordableSkinsResult.rows
        });
    }
    catch (error) {
        console.error('Get fragments progress error:', error);
        res.status(500).json({ error: 'Ошибка получения прогресса' });
    }
});
exports.default = router;
