# 🔧 Исправление ошибки Webhook на Render

## ❌ Проблема

```
TelegramError: 400: Bad Request: bad webhook: An HTTPS URL must be provided for webhook
```

Причина: переменная `BACKEND_URL` не установлена или указывает на локальный URL.

---

## ✅ Решение

### Шаг 1: Добавьте переменную BACKEND_URL в Render

1. Перейдите в Render Dashboard
2. Выберите ваш Web Service (ar-fintes2)
3. Нажмите "Environment" → "Environment Variables"
4. Добавьте новую переменную:

```
Key: BACKEND_URL
Value: https://ar-fintes2.onrender.com
```

**Важно:** Замените `ar-fintes2.onrender.com` на реальный URL вашего сервиса на Render.

### Шаг 2: Перезадеплойте проект

1. В Render Dashboard нажмите "Manual Deploy"
2. Выберите "Deploy latest commit"
3. Дождитесь завершения деплоя

### Шаг 3: Проверьте логи

После деплоя проверьте логи. Вы должны увидеть:

```
🤖 Telegram сервис инициализирован
🌐 Webhook URL: https://ar-fintes2.onrender.com/api/bot/webhook
🔧 Environment: production
📡 Backend URL: https://ar-fintes2.onrender.com
🤖 Бот запущен в режиме webhook через Express
🔗 Webhook установлен: https://ar-fintes2.onrender.com/api/bot/webhook
```

---

## 🔍 Как найти правильный URL вашего сервиса

1. В Render Dashboard выберите ваш Web Service
2. URL будет указан вверху страницы (например: `https://ar-fintes2.onrender.com`)
3. Скопируйте этот URL и используйте его как `BACKEND_URL`

---

## 🧪 Проверка Webhook

После деплоя проверьте, что webhook установлен правильно:

```bash
curl https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo
```

Ответ должен содержать:

```json
{
  "ok": true,
  "result": {
    "url": "https://ar-fintes2.onrender.com/api/bot/webhook",
    "has_custom_certificate": false,
    ...
  }
}
```

---

## 🐛 Если проблема не решена

### Проверьте список переменных окружения

В Render Dashboard → Environment → Environment Variables убедитесь, что:

- ✅ `BACKEND_URL` установлен и начинается с `https://`
- ✅ `TELEGRAM_BOT_TOKEN` установлен
- ✅ `NODE_ENV` = `production`

### Проверьте логи

В Render Dashboard → Logs найдите строку:

```
🌐 Webhook URL: https://...
```

Убедитесь, что URL начинается с `https://`.

### Удалите и установите webhook вручную

```bash
# Удалите старый webhook
curl https://api.telegram.org/botYOUR_BOT_TOKEN/deleteWebhook

# Установите новый webhook
curl -X POST https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://ar-fintes2.onrender.com/api/bot/webhook"}'
```

---

## 📝 Полный список переменных окружения для Render

Убедитесь, что все эти переменные установлены:

```bash
NODE_ENV=production
PORT=10000
BACKEND_URL=https://ar-fintes2.onrender.com
FRONTEND_URL=https://tg-frontend-7ltg.vercel.app
ALLOWED_ORIGINS=https://tg-frontend-7ltg.vercel.app,https://*.vercel.app
TELEGRAM_BOT_TOKEN=8550648832:AAFey51LR3SiWIf0r91iSBwfYg3vWNEl_AQ
TELEGRAM_BOT_USERNAME=SkinFactoryArBot
TELEGRAM_WEB_APP_URL=https://tg-frontend-7ltg.vercel.app
ADMIN_IDS=777777777,123456789
JWT_SECRET=ваш_секретный_ключ
DATABASE_URL=postgresql://... (автоматически из Render)
```

---

## 🎯 После исправления

1. ✅ Бот должен успешно запуститься
2. ✅ Webhook должен быть установлен с HTTPS URL
3. ✅ Команды `/start`, `/play` должны работать
4. ✅ Автоматическая авторизация через Telegram должна работать

---

**Обновлено:** 2026-02-13
