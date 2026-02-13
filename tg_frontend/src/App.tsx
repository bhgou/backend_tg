import { useEffect, useState } from 'react';
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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Предотвращаем повторную инициализацию
    if (initialized) {
      return;
    }

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
          console.log('🔑 Найден сохраненный токен, верифицируем...');
          // Верифицируем токен
          const isValid = await verifyToken();
          if (isValid) {
            console.log('✅ Токен валидный, пользователь авторизован');
            setInitialized(true);
            return;
          } else {
            console.warn('⚠️ Токен невалидный, удаляем...');
            localStorage.removeItem('token');
            useUserStore.getState().setToken(null);
          }
        }
        
        // 3. Если нет токена или он невалидный, пробуем авторизацию через Telegram
        if (telegramService.isTelegram()) {
          console.log('📱 Открыто в Telegram, выполняем авторизацию...');
          
          const authData = await telegramService.getAuthData();
          
          console.log('📦 AuthData:', {
            hasUser: !!authData.user,
            user: authData.user,
            hasInitData: !!authData.initData,
            startParam: authData.startParam,
          });
          
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
              
              setInitialized(true);
              return;
            } catch (authError) {
              console.error('❌ Ошибка авторизации через Telegram:', authError);
            }
          } else {
            console.warn('⚠️ authData.user отсутствует. Пользователь не будет авторизован через Telegram.');
            console.warn('ℹ️ Это нормально для первого запуска в режиме разработки или если бот не настроен правильно.');
          }
        }
        
        // 4. Если в браузере и нет авторизации, остаемся неавторизованными
        console.log('ℹ️ Пользователь не авторизован');
        setInitialized(true);
        
      } catch (error: any) {
        console.error('❌ Ошибка инициализации:', error);
        useUserStore.getState().setError(error.message);
        setInitialized(true);
      } finally {
        useUserStore.getState().setLoading(false);
      }
    };
    
    initializeApp();
  }, [initialized]); // Изменена зависимость с [token] на [initialized]

  // Показываем загрузку
  if (isLoading) {
    return <LoadingScreen message="Загрузка приложения..." />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="pb-16">
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/cases/:id" element={<CaseDetailPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/sponsors" element={<SponsorsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            
            {/* Защищенные маршруты */}
            <Route element={<ProtectedRoute />}>
              <Route path="/game/match/:id" element={<GameMatchPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/payment/:packageId" element={<PaymentPage />} />
              <Route path="/withdraw" element={<WithdrawalPage />} />
              <Route path="/real-skins" element={<RealSkinsPage />} />
              <Route path="/sell-item" element={<SellItemPage />} />
              <Route path="/referrals" element={<ReferralPage />} />
              <Route path="/support" element={<SupportPage />} />
            </Route>
            
            {/* Админ маршрут (доступ только по whitelist) */}
            <Route 
              path="/admin" 
              element={
                isAuthenticated && useUserStore.getState().user?.is_admin ? 
                <AdminPage /> : 
                <Navigate to="/" replace />
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        
        {/* Показываем навигацию только на основных страницах */}
        {!location.pathname.includes('/game/match/') && <Navigation />}
      </div>
    </ErrorBoundary>
  );
}

export default App;