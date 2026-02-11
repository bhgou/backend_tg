"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../db/database");
const auth_1 = require("../middleware/auth");
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
// Получение доступных пакетов премиум валюты
router.get('/packages', auth_1.authenticate, async (req, res) => {
    try {
        const packages = [
            { id: 1, rub: 99, premium: 1000, bonus: 100, popular: true },
            { id: 2, rub: 299, premium: 3500, bonus: 500, popular: false },
            { id: 3, rub: 599, premium: 7500, bonus: 1500, popular: true },
            { id: 4, rub: 1199, premium: 16000, bonus: 4000, popular: false },
            { id: 5, rub: 2999, premium: 45000, bonus: 15000, popular: true },
        ];
        res.json({
            success: true,
            packages
        });
    }
    catch (error) {
        console.error('Get packages error:', error);
        res.status(500).json({ error: 'Ошибка получения пакетов' });
    }
});
// Создание платежа
router.post('/create', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { package_id, payment_method = 'yookassa' } = req.body;
        // Находим пакет
        const packages = [
            { id: 1, rub: 99, premium: 1000, bonus: 100 },
            { id: 2, rub: 299, premium: 3500, bonus: 500 },
            { id: 3, rub: 599, premium: 7500, bonus: 1500 },
            { id: 4, rub: 1199, premium: 16000, bonus: 4000 },
            { id: 5, rub: 2999, premium: 45000, bonus: 15000 },
        ];
        const selectedPackage = packages.find(p => p.id === package_id);
        if (!selectedPackage) {
            return res.status(400).json({ error: 'Пакет не найден' });
        }
        // Генерируем ID платежа
        const paymentId = `pay_${Date.now()}_${crypto_1.default.randomBytes(8).toString('hex')}`;
        // Создаем запись о платеже
        const paymentResult = await database_1.pool.query(`INSERT INTO premium_payments 
       (user_id, amount_rub, amount_premium, payment_method, payment_id, status, metadata) 
       VALUES ($1, $2, $3, $4, $5, 'pending', $6) 
       RETURNING *`, [
            userId,
            selectedPackage.rub,
            selectedPackage.premium + selectedPackage.bonus,
            payment_method,
            paymentId,
            JSON.stringify({
                package_id,
                base_premium: selectedPackage.premium,
                bonus: selectedPackage.bonus,
                description: `Пополнение ${selectedPackage.premium + selectedPackage.bonus} GC`
            })
        ]);
        const payment = paymentResult.rows[0];
        // В реальном приложении здесь будет интеграция с платежной системой
        // Для демо сразу помечаем как успешный
        if (process.env.NODE_ENV === 'development' || payment_method === 'demo') {
            // Автоматически завершаем платеж в демо режиме
            await completePayment(paymentId, userId);
            res.json({
                success: true,
                payment: {
                    ...payment,
                    status: 'completed'
                },
                demo: true,
                message: 'Демо-платеж успешно завершен'
            });
        }
        else {
            // Интеграция с реальной платежной системой
            const paymentData = {
                payment_id: paymentId,
                amount: selectedPackage.rub,
                currency: 'RUB',
                description: `Пополнение баланса на ${selectedPackage.premium + selectedPackage.bonus} GC`,
                return_url: `${process.env.FRONTEND_URL}/payment/success`,
                metadata: {
                    userId,
                    packageId: package_id
                }
            };
            // Здесь будет вызов API платежной системы
            // const gatewayResponse = await paymentGateway.createPayment(paymentData);
            res.json({
                success: true,
                payment,
                // gateway_data: gatewayResponse,
                payment_url: `${process.env.FRONTEND_URL}/payment/process/${paymentId}`,
                message: 'Платеж создан'
            });
        }
    }
    catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ error: 'Ошибка создания платежа' });
    }
});
// Вебхук для платежной системы
router.post('/webhook/:provider', async (req, res) => {
    try {
        const { provider } = req.params;
        const { payment_id, status, amount, currency } = req.body;
        console.log(`Webhook from ${provider}:`, { payment_id, status, amount });
        // Проверяем подпись (в реальном приложении)
        // const isValid = verifySignature(provider, req);
        // if (!isValid) return res.status(401).json({ error: 'Invalid signature' });
        if (status === 'succeeded') {
            // Находим платеж
            const paymentResult = await database_1.pool.query('SELECT * FROM premium_payments WHERE payment_id = $1', [payment_id]);
            if (paymentResult.rows.length > 0) {
                const payment = paymentResult.rows[0];
                if (payment.status !== 'completed') {
                    await completePayment(payment_id, payment.user_id);
                }
            }
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Ошибка обработки вебхука' });
    }
});
// Проверка статуса платежа
router.get('/status/:paymentId', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { paymentId } = req.params;
        const paymentResult = await database_1.pool.query(`SELECT * FROM premium_payments 
       WHERE payment_id = $1 AND user_id = $2`, [paymentId, userId]);
        if (paymentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Платеж не найден' });
        }
        const payment = paymentResult.rows[0];
        res.json({
            success: true,
            payment
        });
    }
    catch (error) {
        console.error('Payment status error:', error);
        res.status(500).json({ error: 'Ошибка проверки статуса' });
    }
});
// История платежей пользователя
router.get('/history', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = '10' } = req.query;
        const paymentsResult = await database_1.pool.query(`SELECT * FROM premium_payments 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`, [userId, limit]);
        res.json({
            success: true,
            payments: paymentsResult.rows
        });
    }
    catch (error) {
        console.error('Payment history error:', error);
        res.status(500).json({ error: 'Ошибка получения истории платежей' });
    }
});
// Вспомогательная функция для завершения платежа
async function completePayment(paymentId, userId) {
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Получаем данные платежа
        const paymentResult = await client.query(`SELECT * FROM premium_payments 
       WHERE payment_id = $1 AND user_id = $2 AND status = 'pending' 
       FOR UPDATE`, [paymentId, userId]);
        if (paymentResult.rows.length === 0) {
            throw new Error('Платеж не найден или уже обработан');
        }
        const payment = paymentResult.rows[0];
        // Обновляем статус платежа
        await client.query(`UPDATE premium_payments 
       SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
       WHERE id = $1`, [payment.id]);
        // Начисляем премиум валюту
        await client.query(`UPDATE users 
       SET premium_balance = premium_balance + $1,
           total_spent_rub = total_spent_rub + $2
       WHERE id = $3`, [payment.amount_premium, payment.amount_rub, userId]);
        // Записываем транзакцию
        await client.query(`INSERT INTO transactions (user_id, type, amount, metadata) 
       VALUES ($1, 'premium_purchase', $2, $3)`, [
            userId,
            payment.amount_premium,
            JSON.stringify({
                paymentId: payment.payment_id,
                amountRub: payment.amount_rub,
                description: 'Пополнение премиум баланса'
            })
        ]);
        await client.query('COMMIT');
        console.log(`✅ Платеж ${paymentId} успешно завершен`);
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
exports.default = router;
