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
  const { isAuthenticated, isLoading, initUser } = useUserStore();
  const location = useLocation();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Инициализация приложения...');
        
        // 1. Проверяем подключение к API
        const apiCheck = await checkApiConnection();
        if (!apiCheck.success) {
          throw new Error('Не удалось подключиться к серверу');
        }
        
        // 2. Инициализируем Telegram или аутентификацию
        const userData = await telegramService.initUser();
        
        // 3. Загружаем данные пользователя
        if (userData) {
          await initUser(userData);
        }
        
        console.log('✅ Приложение инициализировано');
        
      } catch (error: any) {
        console.error('❌ Ошибка инициализации:', error);
        useUserStore.getState().setError(error.message);
      }
    };
    
    initializeApp();
  }, []);

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