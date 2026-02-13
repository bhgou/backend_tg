import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [telegramId, setTelegramId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTelegramLogin = () => {
    // В реальном приложении здесь будет интеграция с Telegram Login
    setLoading(true);
    
    setTimeout(() => {
      // Имитация успешного входа
      setLoading(false);
      navigate('/');
    }, 1500);
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      if (telegramId.trim()) {
        // Имитация успешного входа
        setLoading(false);
        navigate('/');
      } else {
        setError('Введите Telegram ID');
        setLoading(false);
      }
    }, 1500);
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
          <p className="text-gray-400 text-center mb-6">
            Для использования всех функций приложения требуется авторизация
          </p>

          <Button
            variant="primary"
            fullWidth
            size="lg"
            loading={loading}
            onClick={handleTelegramLogin}
            className="mb-4 py-3"
          >
            Войти через Telegram
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
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400">{error}</span>
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