import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import telegramService from '../config/telegram';
import { authAPI } from '../services/api';
import { useUserStore } from '../store/user.store';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { initUser, user } = useUserStore();
  
  const [telegramId, setTelegramId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    // Проверяем, открыто ли приложение в Telegram
    const tgInitialized = telegramService.isTelegram();
    setIsTelegram(tgInitialized);

    // Если уже авторизованы, перенаправляем на главную
    if (user && user.id) {
      navigate('/');
    }

    // Если в Telegram, автоматически пытаемся авторизоваться
    if (tgInitialized) {
      autoLoginTelegram();
    }
  }, [user, navigate]);

  const autoLoginTelegram = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔐 Попытка авторизации через Telegram...');
      
      // Получаем данные пользователя из Telegram WebApp
      const authData = await telegramService.getAuthData();
      
      if (!authData.user) {
        throw new Error('Не удалось получить данные пользователя из Telegram');
      }

      console.log('👤 Telegram данные:', authData);

      // Формируем данные для отправки на бэкенд
      const loginData = {
        telegramId: authData.user.id.toString(),
        username: authData.user.username,
        firstName: authData.user.first_name,
        lastName: authData.user.last_name,
        photoUrl: authData.user.photo_url,
        referralCode: authData.startParam,
        initData: authData.initData,
      };

      // Отправляем запрос на бэкенд
      const response = await authAPI.login(loginData);
      
      console.log('✅ Авторизация успешна:', response);

      // Сохраняем токен и данные пользователя
      if (response.token) {
        localStorage.setItem('token', response.token);
        useUserStore.getState().setToken(response.token);
      }

      // Инициализируем пользователя
      await initUser({
        ...response.user,
        token: response.token,
      });

      // Перенаправляем на главную
      navigate('/');

    } catch (err: any) {
      console.error('❌ Ошибка авторизации:', err);
      setError(err.message || 'Ошибка авторизации через Telegram');
      setLoading(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!telegramId.trim()) {
        setError('Введите Telegram ID');
        setLoading(false);
        return;
      }

      // Создаем тестового пользователя
      const testUser = {
        telegramId: telegramId.trim(),
        username: 'test_user_' + telegramId.trim(),
        firstName: 'Тестовый',
        lastName: 'Пользователь',
        balance: 1000,
        premiumBalance: 100,
        dailyStreak: 1,
        referralCode: 'TEST' + Date.now().toString().slice(-6),
        isAdmin: false,
      };

      await initUser(testUser);
      navigate('/');

    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации');
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    if (isTelegram) {
      autoLoginTelegram();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Skin Factory</h1>
          <p className="text-gray-400">Авторизация в приложении</p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-center">Вход через Telegram</h2>
          
          {isTelegram ? (
            <>
              <p className="text-gray-400 text-center mb-6">
                Вы используете приложение в Telegram. Авторизация выполняется автоматически.
              </p>

              {loading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                  <p className="text-gray-400">Выполняется авторизация...</p>
                </div>
              ) : error ? (
                <>
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 text-sm">{error}</span>
                  </div>
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={handleRetry}
                    className="py-3"
                  >
                    Попробовать снова
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                  <p className="text-gray-400">Авторизация успешна!</p>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-gray-400 text-center mb-6">
                Для использования всех функций приложения требуется авторизация
              </p>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={() => window.open('https://t.me/SkinFactoryArBot/skin_factory', '_blank')}
                className="mb-4 py-3"
              >
                Открыть в Telegram
              </Button>

              <div className="text-center text-sm text-gray-400 mb-6">
                или
              </div>

              <form onSubmit={handleManualLogin}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Telegram ID (для тестирования)
                  </label>
                  <input
                    type="text"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    placeholder="Введите Telegram ID"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 text-sm">{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="glass"
                  fullWidth
                  loading={loading}
                >
                  Продолжить
                </Button>
              </form>
            </>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Преимущества авторизации
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Сохранение прогресса и инвентаря</li>
            <li>• Участие в турнирах и играх</li>
            <li>• Доступ к рынку скинов</li>
            <li>• Ежедневные награды</li>
            <li>• Реферальная программа</li>
            <li>• Вывод реальных скинов</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;