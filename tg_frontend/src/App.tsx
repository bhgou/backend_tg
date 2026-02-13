import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navigation } from './components/layout/Navigation';
import { HomePage } from './pages/HomePage';
import { CasesPage } from './pages/CasesPage';
import { InventoryPage } from './pages/InventoryPage';
import { MarketPage } from './pages/MarketPage';
import { ProfilePage } from './pages/ProfilePage';
import telegramService from './config/telegram';
import { useUserStore } from './store/user.store';
import { checkApiConnection } from './services/api';
import AdminPage from './pages/AdminPage';
import PaymentPage from './pages/PaymentPage';
import GamesPage from './pages/GamesPage';
import GameMatchPage from './pages/GameMatchPage';
import CaseDetailPage from './pages/CaseDetailPage';
import SponsorsPage from './pages/SponsorsPage';
import WithdrawalPage from './pages/WithdrawalPage';
import RealSkinsPage from './pages/RealSkinsPage';
import SellItemPage from './pages/SellItemPage';
import ReferralPage from './pages/ReferralPage';
import LeaderboardPage from './pages/LeaderboardPage';
import SupportPage from './pages/SupportPage';
import AuthPage from './pages/AuthPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoadingScreen } from './components/layout/LoadingScreen';
import { ErrorBoundary } from './components/layout/ErrorBoundary';

function App() {
  const { isAuthenticated, isLoading, initUser, verifyToken, token } = useUserStore();
  const location = useLocation();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Инициализация приложения...');
        
        // 1. Проверяем подключение к API
        const apiCheck = await checkApiConnection();
        if (!apiCheck.success) {
          console.error('❌ Ошибка подключения к API:', apiCheck.error, apiCheck.details);
          throw new Error(`Не удалось подключиться к серверу: ${apiCheck.error}`);
        }
        
        console.log('✅ API подключен');
        
        // 2. Проверяем наличие сохраненного токена
        if (token) {
          // Верифицируем токен
          const isValid = await verifyToken();
          if (isValid) {
            console.log('✅ Токен валидный, пользователь авторизован');
            return;
          }
        }
        
        // 3. Если нет токена или он невалидный, пробуем авторизацию через Telegram
        if (telegramService.isTelegram()) {
          console.log('📱 Открыто в Telegram, выполняем авторизацию...');
          
          const authData = await telegramService.getAuthData();
          
          if (authData.user) {
            try {
              const { authAPI } = await import('./services/api');
              
              const loginData = {
                telegramId: authData.user.id.toString(),
                username: authData.user.username,
                firstName: authData.user.first_name,
                lastName: authData.user.last_name,
                photoUrl: authData.user.photo_url,
                referralCode: authData.startParam,
                initData: authData.initData,
              };

              console.log('📤 Отправка данных авторизации:', loginData);
              const response = await authAPI.login(loginData);
              
              console.log('✅ Авторизация через Telegram успешна:', response);

              if (response.token) {
                localStorage.setItem('token', response.token);
                useUserStore.getState().setToken(response.token);
              }

              await initUser({
                ...response.user,
                token: response.token,
              });
              
              return;
            } catch (authError) {
              console.error('❌ Ошибка авторизации через Telegram:', authError);
            }
          }
        }
        
        // 4. Если в браузере и нет авторизации, остаемся неавторизованными
        console.log('ℹ️ Пользователь не авторизован');
        
      } catch (error: any) {
        console.error('❌ Ошибка инициализации:', error);
        useUserStore.getState().setError(error.message);
      } finally {
        useUserStore.getState().setLoading(false);
      }
    };
    
    initializeApp();
  }, [token]);
}
export default App;