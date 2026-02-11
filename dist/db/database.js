"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseStats = exports.seedDatabase = exports.initDatabase = exports.testConnection = exports.query = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Отладка
console.log('🔧 DATABASE_URL:', process.env.DATABASE_URL ?
    process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') :
    'Не найден');
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});
const query = async (client, text, params) => {
    return client.query(text, params);
};
exports.query = query;
const testConnection = async () => {
    let client = null;
    try {
        client = await exports.pool.connect();
        const result = await client.query('SELECT version()');
        console.log('✅ PostgreSQL подключен успешно');
        console.log('📊 Версия PostgreSQL:', result.rows[0].version);
        return true;
    }
    catch (error) {
        console.error('❌ Ошибка подключения к PostgreSQL:', error.message);
        console.error('🔧 Код ошибки:', error.code);
        return false;
    }
    finally {
        if (client) {
            client.release();
        }
    }
};
exports.testConnection = testConnection;
const initDatabase = async () => {
    const client = await exports.pool.connect();
    try {
        console.log('🔄 Создание таблиц...');
        await (0, exports.query)(client, 'BEGIN');
        // Включаем расширения
        await (0, exports.query)(client, 'CREATE EXTENSION IF NOT EXISTS pgcrypto');
        // Таблица пользователей
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id VARCHAR(50) UNIQUE NOT NULL,
        username VARCHAR(100),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        avatar_url TEXT,
        balance INTEGER DEFAULT 0,
        premium_balance INTEGER DEFAULT 0,
        total_earned INTEGER DEFAULT 0,
        total_spent_rub DECIMAL(10,2) DEFAULT 0,
        daily_streak INTEGER DEFAULT 0,
        last_daily_at TIMESTAMP,
        referral_code VARCHAR(50) UNIQUE DEFAULT md5(random()::text || clock_timestamp()::text)::varchar(50),
        referred_by INTEGER,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Таблица скинов
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS skins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        weapon VARCHAR(100) NOT NULL,
        rarity VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        image_url TEXT,
        fragments_required INTEGER DEFAULT 5,
        is_tradable BOOLEAN DEFAULT true,
        steam_price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Таблица инвентаря
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        skin_id INTEGER REFERENCES skins(id),
        name VARCHAR(255) NOT NULL,
        rarity VARCHAR(50) NOT NULL,
        image_url TEXT,
        is_fragment BOOLEAN DEFAULT false,
        fragments INTEGER DEFAULT 1,
        price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Таблица кейсов
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS cases (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        price INTEGER,
        premium_price INTEGER,
        image_url TEXT,
        description TEXT,
        min_reward INTEGER DEFAULT 10,
        max_reward INTEGER DEFAULT 100,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Таблица дропов кейсов
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS case_drops (
        id SERIAL PRIMARY KEY,
        case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        skin_id INTEGER REFERENCES skins(id),
        probability DECIMAL(5,4) DEFAULT 0.01,
        is_fragment BOOLEAN DEFAULT false,
        fragments INTEGER DEFAULT 1,
        drop_type VARCHAR(50) DEFAULT 'regular',
        reward_type VARCHAR(50) DEFAULT 'skin',
        reward_value INTEGER DEFAULT 1
      );
    `);
        // Таблица транзакций
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        amount INTEGER NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Таблица рынка
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS market_listings (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
        price INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sold_at TIMESTAMP
      );
    `);
        // Таблица спонсоров
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS sponsors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(100),
        invite_link TEXT NOT NULL,
        reward_type VARCHAR(50) DEFAULT 'fragment',
        reward_value INTEGER DEFAULT 10,
        premium_reward INTEGER DEFAULT 50,
        is_active BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Таблица подписок на спонсоров
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS sponsor_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sponsor_id INTEGER NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
        telegram_username VARCHAR(100),
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified BOOLEAN DEFAULT false,
        reward_claimed BOOLEAN DEFAULT false,
        UNIQUE(user_id, sponsor_id)
      );
    `);
        // Таблица реальных скинов CS:GO
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS real_skins (
        id SERIAL PRIMARY KEY,
        steam_market_id VARCHAR(100) UNIQUE,
        name VARCHAR(255) NOT NULL,
        weapon VARCHAR(100) NOT NULL,
        rarity VARCHAR(50) NOT NULL,
        exterior VARCHAR(50),
        float_value DECIMAL(8,6),
        steam_price DECIMAL(10,2),
        image_url TEXT NOT NULL,
        fragments_required INTEGER DEFAULT 5,
        premium_fee INTEGER DEFAULT 100,
        tradeable BOOLEAN DEFAULT true,
        is_stattrak BOOLEAN DEFAULT false,
        is_souvenir BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Таблица заявок на вывод реальных скинов
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS withdrawal_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        real_skin_id INTEGER NOT NULL REFERENCES real_skins(id),
        steam_trade_link TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        fragments_used INTEGER NOT NULL,
        premium_paid INTEGER DEFAULT 0,
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP
      );
    `);
        // Таблица фрагментов реальных скинов
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS real_skin_fragments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        real_skin_id INTEGER NOT NULL REFERENCES real_skins(id),
        fragments INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Таблица платежей за премиум валюту
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS premium_payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount_rub DECIMAL(10,2) NOT NULL,
        amount_premium INTEGER NOT NULL,
        payment_method VARCHAR(50),
        payment_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);
        // Таблица мини-игр
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS minigames (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        min_bet INTEGER DEFAULT 10,
        max_bet INTEGER DEFAULT 1000,
        win_multiplier DECIMAL(5,2) DEFAULT 2.0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Таблица игр
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS game_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        minigame_id INTEGER REFERENCES minigames(id),
        bet INTEGER NOT NULL,
        win_amount INTEGER,
        result JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Таблица настроек приложения
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        type VARCHAR(50) DEFAULT 'string',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Таблица реферальных наград
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS referral_rewards (
        id SERIAL PRIMARY KEY,
        level INTEGER NOT NULL,
        reward_type VARCHAR(50) NOT NULL,
        reward_value INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        await (0, exports.query)(client, 'COMMIT');
        console.log('✅ Таблицы созданы успешно');
    }
    catch (error) {
        await (0, exports.query)(client, 'ROLLBACK');
        console.error('❌ Ошибка при создании таблиц:', error.message);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.initDatabase = initDatabase;
const seedDatabase = async () => {
    const client = await exports.pool.connect();
    try {
        console.log('🔄 Заполнение тестовыми данными...');
        await (0, exports.query)(client, 'BEGIN');
        // Администратор
        await (0, exports.query)(client, `
      INSERT INTO users (telegram_id, username, first_name, last_name, balance, premium_balance, is_admin) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (telegram_id) DO UPDATE SET is_admin = true
    `, ['777777777', 'admin', 'Администратор', 'Системы', 100000, 50000, true]);
        // Тестовый пользователь
        await (0, exports.query)(client, `
      INSERT INTO users (telegram_id, username, first_name, last_name, balance, premium_balance, total_earned) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (telegram_id) DO NOTHING
    `, ['123456789', 'testuser', 'Test', 'User', 5000, 1000, 10000]);
        // Скины
        await (0, exports.query)(client, `
      INSERT INTO skins (name, weapon, rarity, price, fragments_required, steam_price) 
      VALUES 
        ('AK-47 | Redline', 'AK-47', 'Classified', 4550, 5, 45.50),
        ('Glock-18 | Water Elemental', 'Glock-18', 'Mil-Spec', 550, 5, 5.50),
        ('M4A1-S | Guardian', 'M4A1-S', 'Restricted', 1200, 5, 12.00),
        ('AWP | Asiimov', 'AWP', 'Covert', 12000, 10, 120.00),
        ('Desert Eagle | Blaze', 'Desert Eagle', 'Classified', 8500, 8, 85.00),
        ('M4A4 | Howl', 'M4A4', 'Contraband', 250000, 20, 2500.00),
        ('Karambit | Fade', 'Karambit', 'Covert', 320000, 25, 3200.00),
        ('AWP | Dragon Lore', 'AWP', 'Covert', 500000, 30, 5000.00)
      ON CONFLICT DO NOTHING
    `);
        // Кейсы (с премиум ценой)
        await (0, exports.query)(client, `
      INSERT INTO cases (name, type, price, premium_price, description, min_reward, max_reward) 
      VALUES 
        ('Бесплатный кейс', 'free', NULL, NULL, 'Открывается после просмотра рекламы', 10, 50),
        ('Стандартный кейс', 'standard', 500, 50, 'Обычные и редкие скины', 50, 500),
        ('Премиум кейс', 'premium', 1500, 100, 'Редкие и легендарные скины', 200, 2000),
        ('Фрагментный кейс', 'fragment', 1000, 80, 'Фрагменты реальных скинов', 1, 5),
        ('Золотой кейс', 'gold', 5000, 200, 'Самые редкие скины и много фрагментов', 500, 5000)
      ON CONFLICT DO NOTHING
    `);
        // Спонсоры
        await (0, exports.query)(client, `
      INSERT INTO sponsors (name, username, invite_link, reward_type, reward_value, premium_reward, priority) 
      VALUES 
        ('CS:GO Empire', 'csgoempire', 'https://t.me/csgoempire', 'premium', 100, 200, 1),
        ('CSGORoll', 'csgoroll', 'https://t.me/csgoroll', 'balance', 500, 100, 2),
        ('HellCase', 'hellcase', 'https://t.me/hellcase', 'fragment', 3, 5, 3),
        ('CSGOFast', 'csgofast', 'https://t.me/csgofast', 'premium', 50, 100, 4),
        ('CS:GO Trading', 'csgotrading', 'https://t.me/csgotrading', 'balance', 300, 50, 5)
      ON CONFLICT DO NOTHING
    `);
        // Реальные скины CS:GO
        await (0, exports.query)(client, `
      INSERT INTO skins (name, weapon, rarity, price, fragments_required, steam_price) 
      VALUES 
        ('AK-47 | Redline (Field-Tested)', 'AK-47', 'Classified', 4550, 5, 45.50),
        ('Glock-18 | Water Elemental (Field-Tested)', 'Glock-18', 'Mil-Spec', 550, 5, 5.50),
        ('M4A1-S | Guardian (Field-Tested)', 'M4A1-S', 'Restricted', 1200, 5, 12.00),
        ('AWP | Asiimov (Field-Tested)', 'AWP', 'Covert', 12000, 10, 120.00),
        ('Desert Eagle | Blaze (Factory New)', 'Desert Eagle', 'Classified', 8500, 8, 85.00),
        ('M4A4 | Howl (Factory New)', 'M4A4', 'Contraband', 250000, 20, 2500.00),
        ('Karambit | Fade (Factory New)', 'Karambit', 'Covert', 320000, 25, 3200.00),
        ('AWP | Dragon Lore (Factory New)', 'AWP', 'Covert', 500000, 30, 5000.00),
        ('M4A4 | Poseidon (Factory New)', 'M4A4', 'Covert', 180000, 15, 1800.00),
        ('AK-47 | Fire Serpent (Field-Tested)', 'AK-47', 'Covert', 95000, 12, 950.00),
        ('USP-S | Kill Confirmed (Factory New)', 'USP-S', 'Classified', 6500, 6, 65.00),
        ('Desert Eagle | Hand Cannon (Factory New)', 'Desert Eagle', 'Classified', 4500, 5, 45.00),
        ('P90 | Asiimov (Factory New)', 'P90', 'Restricted', 2500, 4, 25.00),
        ('AWP | Hyper Beast (Field-Tested)', 'AWP', 'Classified', 18000, 8, 180.00),
        ('M4A1-S | Cyrex (Factory New)', 'M4A1-S', 'Classified', 4200, 5, 42.00)
      ON CONFLICT DO NOTHING
    `);
        // Мини-игры
        await (0, exports.query)(client, `
      INSERT INTO minigames (name, type, min_bet, max_bet, win_multiplier) 
      VALUES 
        ('Кости', 'dice', 10, 1000, 2.0),
        ('Рулетка', 'roulette', 50, 5000, 3.0),
        ('Слоты', 'slots', 20, 2000, 5.0),
        ('Орёл и решка', 'coinflip', 10, 1000, 1.95)
      ON CONFLICT DO NOTHING
    `);
        // Настройки приложения
        await (0, exports.query)(client, `
      INSERT INTO app_settings (key, value, type, description) 
      VALUES 
        ('premium_currency_name', 'GC', 'string', 'Название премиум валюты'),
        ('withdrawal_fee_percent', '5', 'number', 'Комиссия за вывод (%)'),
        ('referral_bonus', '200', 'number', 'Бонус за реферала'),
        ('daily_reward_base', '100', 'number', 'Базовая ежедневная награда'),
        ('daily_reward_streak_bonus', '20', 'number', 'Бонус за стрик'),
        ('ad_reward', '50', 'number', 'Награда за рекламу'),
        ('min_withdrawal_amount', '1000', 'number', 'Минимальная сумма вывода'),
        ('exchange_rate', '10', 'number', 'Курс RUB к GC (1 GC = 10 RUB)')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `);
        // Реферальные награды
        await (0, exports.query)(client, `
      INSERT INTO referral_rewards (level, reward_type, reward_value) 
      VALUES 
        (1, 'balance', 200),
        (2, 'premium', 50),
        (3, 'balance', 500),
        (5, 'premium', 200),
        (10, 'balance', 2000)
      ON CONFLICT DO NOTHING
    `);
        // Добавляем дропы в кейсы
        const cases = await (0, exports.query)(client, 'SELECT id FROM cases');
        const skins = await (0, exports.query)(client, 'SELECT id FROM skins');
        const realSkins = await (0, exports.query)(client, 'SELECT id FROM real_skins');
        // Регулярные дропы (скины)
        for (const skin of skins.rows.slice(0, 5)) {
            await (0, exports.query)(client, `
        INSERT INTO case_drops (case_id, skin_id, probability, is_fragment, drop_type, reward_type)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [cases.rows[1].id, skin.id, 0.15, false, 'regular', 'skin']);
        }
        // Фрагменты обычных скинов
        for (const skin of skins.rows) {
            await (0, exports.query)(client, `
        INSERT INTO case_drops (case_id, skin_id, probability, is_fragment, fragments, drop_type, reward_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [cases.rows[3].id, skin.id, 0.25, true, Math.floor(Math.random() * 3) + 1, 'fragment', 'fragment']);
        }
        // Премиум валюта в кейсах
        await (0, exports.query)(client, `
      INSERT INTO case_drops (case_id, skin_id, probability, is_fragment, fragments, drop_type, reward_type, reward_value)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [cases.rows[4].id, null, 0.10, false, 1, 'premium', 'premium', 100]);
        // Фрагменты реальных скинов
        for (const realSkin of realSkins.rows) {
            await (0, exports.query)(client, `
        INSERT INTO case_drops (case_id, skin_id, probability, is_fragment, fragments, drop_type, reward_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [cases.rows[4].id, null, 0.05, true, 1, 'real_skin_fragment', 'real_fragment']);
        }
        await (0, exports.query)(client, 'COMMIT');
        console.log('✅ Тестовые данные успешно добавлены!');
    }
    catch (error) {
        await (0, exports.query)(client, 'ROLLBACK');
        console.error('❌ Ошибка при заполнении данных:', error.message);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.seedDatabase = seedDatabase;
const getDatabaseStats = async () => {
    const client = await exports.pool.connect();
    try {
        const result = await (0, exports.query)(client, `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_admin = true) as total_admins,
        (SELECT COUNT(*) FROM skins) as total_skins,
        (SELECT COUNT(*) FROM real_skins) as total_real_skins,
        (SELECT COUNT(*) FROM cases) as total_cases,
        (SELECT COUNT(*) FROM sponsors) as total_sponsors,
        (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending') as pending_withdrawals,
        (SELECT COALESCE(SUM(total_spent_rub), 0) FROM users) as total_revenue_rub,
        (SELECT COUNT(*) FROM premium_payments WHERE status = 'completed') as total_payments
    `);
        await (0, exports.query)(client, 'COMMIT');
        console.log('✅ Реальные данные успешно добавлены!');
    }
    catch (error) {
        await (0, exports.query)(client, 'ROLLBACK');
        console.error('❌ Ошибка при заполнении данных:', error.message);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.getDatabaseStats = getDatabaseStats;
