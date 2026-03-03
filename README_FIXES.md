# Исправления для backend_tg

## 📋 Список исправленных проблем

### 1. Схема базы данных (schema.prisma)
**Проблема:** Отсутствовали необходимые поля и таблицы
**Решение:**
- Добавлены поля: `premiumBalance`, `totalSpentRub`, `isAdmin` в модель `User`
- Добавлены поля: `steamPrice` в модель `Skin`
- Добавлены поля: `isMarketable` в модель `InventoryItem`
- Добавлены поля: `premiumPrice` в модель `Case`
- Добавлены поля: `dropType`, `rewardType`, `rewardValue` в модель `CaseDrop`
- Добавлены поля: `expiresAt`, `feePercentage`, `buyerId` в модель `MarketListing`
- Добавлена модель `Channel`
- Добавлена модель `UserSubscription`
- Добавлены остальные недостающие модели

### 2. Market routes (market.routes.ts)
**Проблема:** Использовались несуществующие поля в БД
**Решение:**
- Убраны проверки на `is_tradable`
- Исправлены SQL запросы для работы с новыми полями
- Добавлен роут для отмены продажи (`/listings/:id/cancel`)
- Добавлен роут для истории продаж (`/history`)

### 3. Auth routes (auth.routes.ts)
**Проблема:** Обращение к полям `premium_balance`, `is_admin` с неправильными именами
**Решение:**
- Исправлено обращение к полям БД (`user.premium_balance`, `user.is_admin`)
- Добавлена обработка для случая, когда поля могут быть null

### 4. Database module (database.ts)
**Проблема:** 
- Дублирование кода в конце файла
- Неправильная реализация `getDatabaseStats`
- Отсутствовала таблица `channels`
**Решение:**
- Удалено дублирование
- Исправлена функция `getDatabaseStats`
- Добавлено создание таблицы `channels`
- Добавлено создание таблицы `user_subscriptions`

### 5. Auth middleware (auth.ts)
**Проблема:** Неправильный тип `userId` (number вместо string)
**Решение:**
- Изменен тип `id` в `req.user` на `string`
- Добавлена обработка `jwt.TokenExpiredError`
- Улучшена обработка ошибок

### 6. Webhook (webhook.ts)
**Проблема:** Отсутствовала обработка ошибок
**Решение:**
- Добавлена полная обработка ошибок
- Добавлена проверка на пустой request body
- Добавлены роуты для проверки статуса вебхука и его удаления

### 7. Seed file (seed.ts)
**Проблема:** Использовал Prisma, но проект работает на `pg`
**Решение:**
- Создана новая версия seed.ts с полной совместимостью с Prisma
- Все данные в database.ts теперь используют SQL запросы (pg)

---

## 🚀 Как применить исправления

### Вариант 1: Копирование файлов

1. **Схема БД:**
   ```bash
   cp C:\Users\brati\backend_tg_fixes\schema.prisma E:\github\ArFintes2\backend_tg\prisma\schema.prisma
   ```

2. **Market routes:**
   ```bash
   cp C:\Users\brati\backend_tg_fixes\market.routes.ts E:\github\ArFintes2\backend_tg\src\routes\market.routes.ts
   ```

3. **Auth routes:**
   ```bash
   cp C:\Users\brati\backend_tg_fixes\auth.routes.ts E:\github\ArFintes2\backend_tg\src\routes\auth.routes.ts
   ```

4. **Database module:**
   ```bash
   cp C:\Users\brati\backend_tg_fixes\database.ts E:\github\ArFintes2\backend_tg\src\db\database.ts
   ```

5. **Auth middleware:**
   ```bash
   cp C:\Users\brati\backend_tg_fixes\auth.ts E:\github\ArFintes2\backend_tg\src\middleware\auth.ts
   ```

6. **Webhook:**
   ```bash
   cp C:\Users\brati\backend_tg_fixes\webhook.ts E:\github\ArFintes2\backend_tg\src\bot\webhook.ts
   ```

### Вариант 2: Ручное копирование содержимого

Откройте каждый файл из папки `backend_tg_fixes` и скопируйте содержимое в соответствующие файлы проекта.

---

## 📝 Дополнительные действия

### 1. Обновление зависимостей

Если вы хотите использовать Prisma:
```bash
cd E:\github\ArFintes2\backend_tg
npm install @prisma/client
npm install -D prisma
npx prisma generate
```

### 2. Миграция базы данных

Если используете Prisma:
```bash
npx prisma migrate dev --name fix_schema
```

Если используете прямой SQL (pg):
- Запустите сервер в режиме разработки
- Таблицы создадутся автоматически через `initDatabase()`

### 3. Заполнение БД тестовыми данными

Для Prisma:
```bash
npx prisma db seed
```

Для pg (автоматически при запуске в dev режиме):
```bash
npm run dev
# Затем откройте: http://localhost:3001/api/dev/seed-db
```

---

## ✅ Проверка работы

1. **Запустите сервер:**
   ```bash
   npm run dev
   ```

2. **Проверьте API:**
   - Health check: `http://localhost:3001/api/health`
   - БД: `http://localhost:3001/api/health/db`

3. **Протестируйте авторизацию:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"telegramId": "123456789", "username": "test"}'
   ```

4. **Протестируйте рынок:**
   - Получение лотов: `GET /api/market`
   - Создание лота: `POST /api/market/listings` (требуется токен)

---

## 🐛 Известные проблемы

1. **Платежная система** - интеграция с реальными платежными системами не реализована (только демо режим)

2. **Проверка подписок Telegram** - используется случайная генерация для демо. Для продакшена нужна реальная интеграция с Telegram Bot API

3. **Rate limiting** - реализован упрощенно. Для продакшена рекомендуется использовать Redis

---

## 📞 Поддержка

Если возникнут проблемы:
1. Проверьте логи сервера
2. Проверьте подключение к БД
3. Убедитесь, что все переменные окружения установлены
