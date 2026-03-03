# 🎮 Skin Factory - CS:GO Skin Opening Platform

**Telegram бот с CS:GO скинами, где пользователи могут получать реальные скины бесплатно!**

---

## 📖 Описание

Skin Factory - это платформа в Telegram, где пользователи могут:
- 🎁 Открывать кейсы и получать скины
- 🔫 Собирать фрагменты и выводить реальные CS:GO скины
- 💰 Зарабатывать валюту через мини-игры и задания
- 🤑 Продавать скины на торговой площадке
- 👥 Приглашать друзей и получать бонусы

---

## 🚀 Быстрый Старт

### 1. Настройка окружения

```bash
cd backend_tg
copy .env.example .env
```

Отредактируйте `.env` и установите:
- `DATABASE_URL` - строка подключения к PostgreSQL
- `TELEGRAM_BOT_TOKEN` - токен бота от @BotFather
- `JWT_SECRET` - секретный ключ (минимум 32 символа)

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка базы данных

```bash
# Если используете Prisma
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Или автоматически при запуске (таблицы создадутся сами)
```

### 4. Запуск

```bash
# Режим разработки
npm run dev

# Продакшен
npm run build
npm start
```

---

## 📚 Документация

| Документ | Описание |
|----------|----------|
| [КОНЦЕПЦИЯ.md](./КОНЦЕПЦИЯ.md) | Полная идея проекта, механики, экономика |
| [ПЛАН.md](./ПЛАН.md) | Пошаговый план реализации (7 недель) |
| [ЭКОНОМИКА.md](./ЭКОНОМИКА.md) | Баланс игры, все цифры и настройки |
| [ИТОГИ.md](./ИТОГИ.md) | Список исправлений и инструкция |

---

## 🎯 Основная Механика

### Две валюты:
- **CR (Credits)** - обычная валюта (фарм в игре)
- **GC (Gem Coins)** - премиум валюта (покупка за реальные деньги)

### Система вывода скинов:
1. Каждый скин состоит из **фрагментов** (5-30 шт.)
2. Фрагменты падают из кейсов случайно
3. Собери все фрагменты → обменяй на реальный скин
4. Скин отправляется на Steam Trade Link

### Как заработать:
- 📅 Ежедневный вход (Daily Drop)
- 🎲 Мини-игры с другими игроками
- 👥 Приглашение друзей (200-500 GC за реферала)
- 📺 Подписка на каналы спонсоров

---

## 🛠️ Технологический Стек

- **Backend:** Node.js + TypeScript + Express
- **Database:** PostgreSQL (+ Prisma ORM опционально)
- **Bot:** Telegraf (Telegram Bot API)
- **Auth:** JWT токены
- **Frontend:** React/Vite (Telegram Web App)

---

## 📦 Структура Проекта

```
backend_tg/
├── src/
│   ├── bot/           # Telegram бот
│   ├── config/        # Конфигурация
│   ├── controllers/   # Контроллеры
│   ├── db/            # База данных
│   ├── middleware/    # Middleware (auth, validation)
│   ├── routes/        # API маршруты
│   ├── services/      # Сервисы
│   ├── types/         # TypeScript типы
│   └── index.ts       # Точка входа
├── prisma/
│   ├── schema.prisma  # Схема БД
│   └── seed.ts        # Seed данные
├── .env.example       # Пример окружения
├── package.json
└── tsconfig.json
```

---

## 🔌 API Endpoints

### Авторизация
- `POST /api/auth/login` - Вход через Telegram
- `POST /api/auth/verify` - Проверка токена

### Пользователь
- `GET /api/user/profile` - Профиль
- `GET /api/user/stats` - Статистика
- `POST /api/user/daily` - Ежедневная награда
- `GET /api/user/referrals` - Рефералы

### Кейсы
- `GET /api/cases` - Список кейсов
- `POST /api/cases/open` - Открыть кейс
- `GET /api/cases/history` - История

### Инвентарь
- `GET /api/inventory` - Предметы
- `POST /api/inventory/combine` - Сборка скина
- `POST /api/inventory/sell` - Продать предмет

### Рынок
- `GET /api/market` - Лоты
- `POST /api/market/buy` - Купить
- `POST /api/market/listings` - Создать лот

### Мини-игры
- `POST /api/games/dice/play` - Кости
- `POST /api/games/roulette/play` - Рулетка
- `POST /api/games/slots/play` - Слоты
- `POST /api/games/coinflip/play` - Орёл и решка

### Платежи
- `GET /api/payments/packages` - Пакеты GC
- `POST /api/payments/create` - Создать платёж

---

## 💰 Экономика

### Доход проекта:
1. **Продажа GC** - 1 GC = 10₽ (пакеты от 99₽)
2. **Комиссия с рынка** - 5% с каждой продажи
3. **Комиссия с игр** - 2-5% преимущество казино
4. **Спонсоры** - платные подписки на каналы
5. **Реклама** - просмотр за бесплатный кейс

### Прогноз:
- При 1000 пользователей: ~200,000-500,000₽/месяц
- При 10000 пользователей: ~2,000,000₽+/месяц

---

## 🔒 Безопасность

- JWT аутентификация
- Rate limiting (100 запросов / 15 мин)
- Защита от SQL инъекций
- Валидация всех входных данных
- Анти-фрод система для рефералов

---

## 📊 Мониторинг

```bash
# Проверка сервера
curl http://localhost:3001/api/health

# Проверка БД
curl http://localhost:3001/api/health/db

# Информация об API
curl http://localhost:3001/api
```

---

## 🧪 Тестирование

### Тестовый вход:
```bash
curl -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"telegramId\": \"123456789\", \"username\": \"testuser\"}"
```

### Инициализация БД (dev):
```bash
curl http://localhost:3001/api/dev/init-db
curl http://localhost:3001/api/dev/seed-db
```

---

## 📄 Лицензия

MIT License - см. [LICENSE](./LICENSE) файл

---

## 🤝 Поддержка

- Telegram: @SkinFactoryArBot
- Email: support@skinfactory.com
- Документация: см. файлы в корне проекта

---

## 🎯 Планы Развития

- [ ] Мобильное приложение
- [ ] Веб-сайт с расширенной статистикой
- [ ] Собственный маркетплейс
- [ ] Интеграция со Steam API
- [ ] Киберспортивные турниры

---

**Skin Factory © 2026. Все права защищены.**
