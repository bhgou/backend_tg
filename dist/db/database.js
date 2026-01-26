"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseStats = exports.seedDatabase = exports.initDatabase = exports.testConnection = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
// Вспомогательная функция для запросов
const query = async (client, text, params) => {
    return client.query(text, params);
};
// Проверка подключения
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
        console.error('❌ Ошибка подключения к PostgreSQL:', error);
        return false;
    }
    finally {
        if (client) {
            client.release();
        }
    }
};
exports.testConnection = testConnection;
// Создание таблиц (исправленная версия)
const initDatabase = async () => {
    const client = await exports.pool.connect();
    try {
        console.log('🔄 Создание таблиц...');
        await query(client, 'BEGIN');
        // Включаем расширение pgcrypto
        await query(client, 'CREATE EXTENSION IF NOT EXISTS pgcrypto');
        // Таблица пользователей (упрощенная, без gen_random_bytes)
        await query(client, `
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
        await query(client, `
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
        await query(client, `
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        skin_id INTEGER NOT NULL REFERENCES skins(id) ON DELETE CASCADE,
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
        await query(client, `
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
        await query(client, `
      CREATE TABLE IF NOT EXISTS case_drops (
        id SERIAL PRIMARY KEY,
        case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        skin_id INTEGER NOT NULL REFERENCES skins(id) ON DELETE CASCADE,
        probability DECIMAL(5,4) DEFAULT 0.01,
        is_fragment BOOLEAN DEFAULT false,
        fragments INTEGER DEFAULT 1
      );
    `);
        // Таблица транзакций
        await query(client, `
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
        await query(client, `
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
        await query(client, 'COMMIT');
        console.log('✅ Таблицы созданы успешно');
    }
    catch (error) {
        await query(client, 'ROLLBACK');
        console.error('❌ Ошибка при создании таблиц:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.initDatabase = initDatabase;
// Упрощенное заполнение тестовыми данными
const seedDatabase = async () => {
    const client = await exports.pool.connect();
    try {
        console.log('🔄 Заполнение тестовыми данными...');
        await query(client, 'BEGIN');
        // Добавляем тестового пользователя
        const userResult = await query(client, `
      INSERT INTO users (telegram_id, username, first_name, last_name, balance, total_earned, daily_streak) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (telegram_id) DO UPDATE 
      SET username = EXCLUDED.username,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name
      RETURNING id
    `, ['123456789', 'testuser', 'Test', 'User', 5000, 10000, 5]);
        const userId = userResult.rows[0]?.id;
        if (userId) {
            console.log(`✅ Тестовый пользователь создан (ID: ${userId})`);
        }
        // Добавляем несколько скинов
        await query(client, `
      INSERT INTO skins (name, weapon, rarity, price, fragments_required) 
      VALUES 
        ('AK-47 | Redline', 'AK-47', 'classified', 45.50, 15),
        ('Glock-18 | Water Elemental', 'Glock-18', 'mil-spec', 5.50, 5),
        ('M4A1-S | Guardian', 'M4A1-S', 'restricted', 12.00, 8)
      ON CONFLICT DO NOTHING
    `);
        // Добавляем кейсы
        await query(client, `
      INSERT INTO cases (name, type, price, description) 
      VALUES 
        ('Бесплатный кейс', 'ad', NULL, 'Открывается после просмотра рекламы'),
        ('Стандартный кейс', 'standard', 500, 'Обычные и редкие скины'),
        ('Премиум кейс', 'premium', 1500, 'Редкие и легендарные скины')
      ON CONFLICT DO NOTHING
    `);
        await query(client, 'COMMIT');
        console.log('✅ Тестовые данные успешно добавлены!');
    }
    catch (error) {
        await query(client, 'ROLLBACK');
        console.error('❌ Ошибка при заполнении данных:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.seedDatabase = seedDatabase;
// Получение статистики
const getDatabaseStats = async () => {
    const client = await exports.pool.connect();
    try {
        const result = await query(client, `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM skins) as total_skins,
        (SELECT COUNT(*) FROM cases) as total_cases
    `);
        return result.rows[0];
    }
    catch (error) {
        console.error('Error getting database stats:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.getDatabaseStats = getDatabaseStats;
