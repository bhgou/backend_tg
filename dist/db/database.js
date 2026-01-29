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
        total_earned INTEGER DEFAULT 0,
        daily_streak INTEGER DEFAULT 0,
        last_daily_at TIMESTAMP,
        referral_code VARCHAR(50) UNIQUE DEFAULT md5(random()::text || clock_timestamp()::text)::varchar(50),
        referred_by INTEGER,
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
        price DECIMAL(10, 2) NOT NULL,
        image_url TEXT,
        fragments_required INTEGER DEFAULT 1,
        is_tradable BOOLEAN DEFAULT true,
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
        price DECIMAL(10, 2),
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
        image_url TEXT,
        description TEXT,
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
        drop_type VARCHAR(50) DEFAULT 'regular' -- regular, fragment, real_skin_fragment
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
        // Таблица каналов для подписки
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS channels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(100),
        invite_link TEXT NOT NULL,
        reward_type VARCHAR(50) DEFAULT 'case',
        reward_value INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        required BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Таблица подписок пользователей
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        telegram_username VARCHAR(100),
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified BOOLEAN DEFAULT false,
        reward_claimed BOOLEAN DEFAULT false,
        UNIQUE(user_id, channel_id)
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
        fragments_required INTEGER DEFAULT 50,
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
        // Таблица спонсоров
        await (0, exports.query)(client, `
      CREATE TABLE IF NOT EXISTS sponsors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        website VARCHAR(255),
        image_url TEXT,
        reward_amount INTEGER DEFAULT 100,
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
        // Тестовый пользователь
        const userResult = await (0, exports.query)(client, `
      INSERT INTO users (telegram_id, username, first_name, last_name, balance, total_earned, daily_streak) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (telegram_id) DO NOTHING
      RETURNING id
    `, ['123456789', 'testuser', 'Test', 'User', 10000, 20000, 7]);
        // Скины
        await (0, exports.query)(client, `
      INSERT INTO skins (name, weapon, rarity, price, fragments_required) 
      VALUES 
        ('AK-47 | Redline', 'AK-47', 'Classified', 45.50, 15),
        ('Glock-18 | Water Elemental', 'Glock-18', 'Mil-Spec', 5.50, 5),
        ('M4A1-S | Guardian', 'M4A1-S', 'Restricted', 12.00, 8),
        ('AWP | Asiimov', 'AWP', 'Covert', 120.00, 25),
        ('Desert Eagle | Blaze', 'Desert Eagle', 'Classified', 85.00, 18),
        ('M4A4 | Howl', 'M4A4', 'Contraband', 2500.00, 100),
        ('Karambit | Fade', 'Karambit', 'Covert', 3200.00, 150),
        ('AWP | Dragon Lore', 'AWP', 'Covert', 5000.00, 200)
      ON CONFLICT DO NOTHING
    `);
        // Кейсы
        await (0, exports.query)(client, `
      INSERT INTO cases (name, type, price, description) 
      VALUES 
        ('Бесплатный кейс', 'ad', NULL, 'Открывается после просмотра рекламы'),
        ('Стандартный кейс', 'standard', 500, 'Обычные и редкие скины'),
        ('Премиум кейс', 'premium', 1500, 'Редкие и легендарные скины'),
        ('Фрагментный кейс', 'fragment', 1000, 'Фрагменты реальных скинов'),
        ('Легендарный кейс', 'legendary', 5000, 'Самые редкие скины')
      ON CONFLICT DO NOTHING
    `);
        // Каналы для подписки
        await (0, exports.query)(client, `
      INSERT INTO channels (name, username, invite_link, reward_type, reward_value, required) 
      VALUES 
        ('CS:GO News', 'csgonews', 'https://t.me/csgonews', 'case', 3, true),
        ('CS:GO Trading', 'csgotrading', 'https://t.me/csgotrading', 'balance', 500, true),
        ('CS:GO Updates', 'csgoupdates', 'https://t.me/csgoupdates', 'case', 2, false),
        ('Skin Factory', 'skinfactory', 'https://t.me/skinfactory', 'fragment', 10, true),
        ('CS:GO Skins', 'csgoskins', 'https://t.me/csgoskins', 'balance', 1000, false)
      ON CONFLICT DO NOTHING
    `);
        // Реальные скины CS:GO
        await (0, exports.query)(client, `
      INSERT INTO real_skins (name, weapon, rarity, steam_price, image_url, fragments_required, is_stattrak) 
      VALUES 
        ('AK-47 | Redline (Field-Tested)', 'AK-47', 'Classified', 45.50, 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpopujwezhhwszXeC9W0926lpKKmPLLI7fUqW5D19d5jeHU-4n0jFO1-0U5NW2nctSdIQ9sN1_D_1jqk-_ngsC4v8iOwSdm6D5luygU0g', 500, false),
        ('Glock-18 | Fade (Factory New)', 'Glock-18', 'Covert', 320.00, 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJTwW09-3mJmOqPP9Nq_ummJW4NE_2riYodqg2wLs_0Q9Y2D7J4eQdAM5ZQ7T-VK_x-3v1pXp6p7AySdh6HMn5XfUyUKy1UEYMXyLvw', 800, false),
        ('AWP | Asiimov (Field-Tested)', 'AWP', 'Covert', 120.00, 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpopujwezhhwszXeC9W096mgZKKmPLLI7fUqW5D19d5jeHU-4n0jFO1-0U5NW2nctSdIQ9sN1_D_1jqk-_ngsC4v8iOwSdm6D5luygU0g', 600, false),
        ('M4A4 | Howl (Factory New)', 'M4A4', 'Contraband', 2500.00, 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpopujwezhhwszXeC9W096mgZKKmPLLI7fUqW5D19d5jeHU-4n0jFO1-0U5NW2nctSdIQ9sN1_D_1jqk-_ngsC4v8iOwSdm6D5luygU0g', 5000, false),
        ('Karambit | Fade (Factory New)', 'Karambit', 'Covert', 3200.00, 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJTwW09-3mJmOqPP9Nq_ummJW4NE_2riYodqg2wLs_0Q9Y2D7J4eQdAM5ZQ7T-VK_x-3v1pXp6p7AySdh6HMn5XfUyUKy1UEYMXyLvw', 10000, true)
      ON CONFLICT DO NOTHING
    `);
        // Спонсоры
        await (0, exports.query)(client, `
      INSERT INTO sponsors (name, website, image_url, reward_amount) 
      VALUES 
        ('CS:GO Empire', 'https://csgoempire.com', 'https://csgoempire.com/img/logo.png', 500),
        ('CSGORoll', 'https://csgoroll.com', 'https://csgoroll.com/logo.png', 300),
        ('HellCase', 'https://hellcase.com', 'https://hellcase.com/logo.png', 400),
        ('CSGOFast', 'https://csgofast.com', 'https://csgofast.com/logo.png', 250)
      ON CONFLICT DO NOTHING
    `);
        // Добавляем дропы в кейсы
        const cases = await (0, exports.query)(client, 'SELECT id FROM cases');
        const skins = await (0, exports.query)(client, 'SELECT id FROM skins');
        const realSkins = await (0, exports.query)(client, 'SELECT id FROM real_skins');
        // Регулярные дропы (скины)
        for (const skin of skins.rows.slice(0, 5)) {
            await (0, exports.query)(client, `
        INSERT INTO case_drops (case_id, skin_id, probability, is_fragment, drop_type)
        VALUES ($1, $2, $3, $4, $5)
      `, [cases.rows[1].id, skin.id, 0.15, false, 'regular']);
        }
        // Фрагменты обычных скинов
        for (const skin of skins.rows) {
            await (0, exports.query)(client, `
        INSERT INTO case_drops (case_id, skin_id, probability, is_fragment, fragments, drop_type)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [cases.rows[3].id, skin.id, 0.25, true, Math.floor(Math.random() * 3) + 1, 'fragment']);
        }
        // Фрагменты реальных скинов (очень редкие)
        for (const realSkin of realSkins.rows) {
            await (0, exports.query)(client, `
        INSERT INTO case_drops (case_id, skin_id, probability, is_fragment, fragments, drop_type)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [cases.rows[4].id, null, 0.01, true, 1, 'real_skin_fragment']);
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
        (SELECT COUNT(*) FROM skins) as total_skins,
        (SELECT COUNT(*) FROM real_skins) as total_real_skins,
        (SELECT COUNT(*) FROM cases) as total_cases,
        (SELECT COUNT(*) FROM channels) as total_channels,
        (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending') as pending_withdrawals
    `);
        return result.rows[0];
    }
    catch (error) {
        console.error('Error getting database stats:', error.message);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.getDatabaseStats = getDatabaseStats;
