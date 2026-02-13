# 🎨 Vercel Deployment Guide

## 📋 Обзор

Полное руководство по деплою фронтенда Skin Factory на Vercel.

---

## 🚀 Способы деплоя

### Способ 1: Через Vercel Dashboard (рекомендуется)

1. **Создайте репозиторий на GitHub**
   ```bash
   cd tg_frontend
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/tg_frontend.git
   git push -u origin main
   ```

2. **Импортируйте в Vercel**
   - Перейдите на https://vercel.com/new
   - Нажмите "Import Project"
   - Выберите ваш GitHub репозиторий

3. **Настройте проект**
   - **Project Name:** `tg-frontend`
   - **Framework Preset:** `Vite`
   - **Root Directory:** `tg_frontend`
   - **Build Command:** `npm install && npm run build`
   - **Output Directory:** `dist`

4. **Добавьте переменные окружения**
   
   Нажмите "Environment Variables" и добавьте:
   
   ```bash
   VITE_API_URL=https://backend-tg-i7mg.onrender.com/api
   VITE_TELEGRAM_BOT_USERNAME=SkinFactoryArBot
   VITE_TELEGRAM_WEB_APP_URL=https://t.me/SkinFactoryArBot/skin_factory
   VITE_APP_NAME=Skin Factory
   VITE_APP_VERSION=2.0.0
   VITE_SUPPORT_EMAIL=support@skinfactory.com
   VITE_MAINTENANCE_MODE=false
   VITE_ENABLE_TELEGRAM_AUTH=true
   VITE_ENABLE_PAYMENTS=true
   VITE_ENABLE_WITHDRAWALS=true
   VITE_ENABLE_MINI_GAMES=true
   VITE_THEME=dark
   VITE_LANGUAGE=ru
   VITE_ANIMATIONS=true
   ```

5. **Нажмите "Deploy"**
   - Подождите завершения деплоя
   - Получите URL: `https://tg-frontend-7ltg.vercel.app`

---

### Способ 2: Через Vercel CLI

1. **Установите Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Войдите в Vercel**
   ```bash
   vercel login
   ```

3. **Задеплойте**
   ```bash
   cd tg_frontend
   vercel
   ```

   Следуйте инструкциям:
   - Set up and deploy? **Yes**
   - Which scope? **Ваш аккаунт**
   - Link to existing project? **No**
   - Project name? **tg-frontend**
   - In which directory is your code located? **./**
   - Want to override settings? **No**

4. **Для production**
   ```bash
   vercel --prod
   ```

---

### Способ 3: Через Git Integration

1. **Подключите репозиторий в Vercel Dashboard**
   - Settings → Git → Connected Repositories
   - Добавьте ваш GitHub репозиторий

2. **Автоматический деплой**
   - Каждый `git push` в ветку `main` автоматически запускает деплой
   - Можно настроить деплой для других веток

---

## 🔧 Конфигурация

### vercel.json

Файл `vercel.json` содержит настройки деплоя:

```json
{
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Переменные окружения

Все переменные должны начинаться с `VITE_`:

```bash
# API
VITE_API_URL=https://backend-tg-i7mg.onrender.com/api

# Telegram
VITE_TELEGRAM_BOT_USERNAME=SkinFactoryArBot
VITE_TELEGRAM_WEB_APP_URL=https://t.me/SkinFactoryArBot/skin_factory

# Приложение
VITE_APP_NAME=Skin Factory
VITE_APP_VERSION=2.0.0
VITE_SUPPORT_EMAIL=support@skinfactory.com
VITE_MAINTENANCE_MODE=false

# Функции
VITE_ENABLE_TELEGRAM_AUTH=true
VITE_ENABLE_PAYMENTS=true
VITE_ENABLE_WITHDRAWALS=true
VITE_ENABLE_MINI_GAMES=true

# UI
VITE_THEME=dark
VITE_LANGUAGE=ru
VITE_ANIMATIONS=true
```

---

## 🧪 Тестирование после деплоя

1. **Проверьте, что сайт открывается**
   - Откройте: `https://tg-frontend-7ltg.vercel.app`

2. **Проверьте консоль браузера**
   - Откройте DevTools (F12)
   - Перейдите на вкладку Console
   - Убедитесь, что нет ошибок

3. **Проверьте подключение к API**
   - Откройте Network вкладку
   - Откройте приложение
   - Убедитесь, что запросы к API успешны (статус 200)

4. **Проверьте авторизацию**
   - Откройте через Telegram: `https://t.me/SkinFactoryArBot/skin_factory`
   - Проверьте автоматическую авторизацию

---

## 🐛 Troubleshooting

### Build Failed

**Ошибка:** `Cannot find package '@vitejs/plugin-react'`

**Решение:**
```bash
# Убедитесь, что package.json содержит devDependencies
{
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    ...
  }
}
```

### Environment Variables Not Working

**Ошибка:** Переменные окружения не работают

**Решение:**
- Убедитесь, что все переменные начинаются с `VITE_`
- Перезадеплойте проект после добавления переменных
- Проверьте настройки в Vercel Dashboard

### API Connection Failed

**Ошибка:** Не удается подключиться к API

**Решение:**
- Проверьте `VITE_API_URL` в переменных окружения
- Убедитесь, что бэкенд запущен
- Проверьте CORS настройки на бэкенде

### 404 Not Found

**Ошибка:** Страницы не находятся

**Решение:**
- Убедитесь, что `vercel.json` содержит правильные rewrites
- Проверьте, что `outputDirectory` установлен в `dist`

---

## 📊 Мониторинг

### Логи

1. Перейдите в Vercel Dashboard
2. Выберите проект
3. Нажмите "Deployments"
4. Выберите нужный деплой
5. Нажмите "View Function Logs"

### Analytics

1. Перейдите в Vercel Dashboard
2. Выберите проект
3. Нажмите "Analytics"
4. Просматривайте статистику посещений

---

## 🔒 Безопасность

### Настроено

- ✅ HTTPS (автоматически)
- ✅ HTTP заголовки безопасности
- ✅ Кеширование статики
- ✅ CORS настройки

### Рекомендуется

- 🔐 Настройка CSP заголовков
- 🔐 Добавление rate limiting
- 🔐 Мониторинг безопасности

---

## 🎯 Оптимизация

### Размер бандла

```bash
# Проверьте размер бандла
npm run build

# Результат:
# dist/assets/index-*.js: ~500 kB (gzip: ~150 kB)
```

### Кеширование

- Статические файлы кешируются на 1 год
- HTML кешируется на 1 час
- API ответы кешируются в браузере

---

## 📞 Поддержка

- Telegram: @SkinFactoryArBot
- Email: support@skinfactory.com
- GitHub: https://github.com/bhgou/tg_frontend

---

**Версия:** 2.0.0  
**Дата обновления:** 2026-02-13  
**Статус:** ✅ Production Ready
