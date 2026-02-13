import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User, 
  Coins, 
  Award, 
  Calendar,
  Settings,
  LogOut,
  Share2,
  Shield,
  CreditCard,
  Check,
  AlertCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useUserStore } from '../store/user.store';
import { userAPI, UserStatsResponse } from '../services/api';
import { paymentAPI } from '../services/api';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const [stats, setStats] = useState<any>({});
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const { data }: { data: UserStatsResponse } = await userAPI.getStats();
      setStats(data.stats || {});
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Тестовые данные
      setStats({
        totalCasesOpened: 42,
        totalSkinsCollected: 15,
        totalReferrals: 8,
        tradeAccuracy: 65
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { icon: <Coins className="w-5 h-5" />, label: 'Баланс', value: `${user?.balance || 0} CR`, color: 'text-yellow-400' },
    { icon: <Award className="w-5 h-5" />, label: 'Всего заработано', value: `${user?.totalEarned || 0} CR`, color: 'text-green-400' },
    { icon: <Calendar className="w-5 h-5" />, label: 'Стрик', value: `${user?.dailyStreak || 0} дней`, color: 'text-blue-400' },
    { icon: <Shield className="w-5 h-5" />, label: 'Статус', value: 'Новичок', color: 'text-purple-400' },
  ];

  const actions = [
    { icon: <Share2 className="w-5 h-5" />, label: 'Пригласить друзей', onClick: () => alert('Функция "Пригласить друзей" в разработке') },
    { icon: <Settings className="w-5 h-5" />, label: 'Настройки', onClick: () => alert('Функция "Настройки" в разработке') },
    { icon: <LogOut className="w-5 h-5" />, label: 'Выйти', onClick: handleLogout },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="glass"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/')}
          />
          <h1 className="text-2xl font-bold">Профиль</h1>
        </div>
      </div>

      {/* User info */}
      <div className="glass-effect rounded-2xl p-6 mb-6 text-center">
        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <User className="w-12 h-12 text-white" />
        </div>
        
        <h2 className="text-xl font-bold mb-1">
          {user?.firstName || 'Тест'} {user?.lastName || 'Пользователь'}
        </h2>
        <p className="text-gray-400 mb-4">@{user?.username || 'user'}</p>
        
        <div className="inline-block bg-blue-500/20 text-blue-400 px-4 py-1 rounded-full text-sm font-medium">
          ID: {user?.telegramId?.slice(0, 8) || '12345678'}...
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {menuItems.map((item, index) => (
          <div key={index} className="glass-effect rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              {item.icon}
              <span className="text-sm text-gray-400">{item.label}</span>
            </div>
            <div className={`text-lg font-bold ${item.color}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed stats */}
      <div className="glass-effect rounded-2xl p-4 mb-6">
        <h3 className="font-bold mb-4">Статистика</h3>
        {loadingStats ? (
          <div className="text-center py-4">
            <div className="inline-block w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-2">Загрузка статистики...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { label: 'Открыто кейсов', value: stats.totalCasesOpened || 0 },
              { label: 'Собрано скинов', value: stats.totalSkinsCollected || 0 },
              { label: 'Приглашено друзей', value: stats.totalReferrals || 0 },
              { label: 'Точность трейдов', value: `${stats.tradeAccuracy || 0}%` },
            ].map((stat, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-400">{stat.label}</span>
                <span className="font-bold">{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {actions.map((action, index) => (
          <div key={index}>
            <Button
              variant={action.label === 'Выйти' ? 'danger' : 'glass'}
              fullWidth
              className="justify-start h-14"
              icon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { packageId } = useParams<{ packageId?: string }>();
  const { user, addBalance } = useUserStore();
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  useEffect(() => {
    if (packageId && packages.length > 0) {
      const pkg = packages.find(p => p.id === parseInt(packageId));
      if (pkg) {
        setSelectedPackage(pkg);
      }
    }
  }, [packageId, packages]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPackages();
      setPackages(response.data.packages || []);
    } catch (error) {
      console.error('Failed to load packages:', error);
      // Демо данные
      setPackages([
        { id: 1, rub: 99, premium: 1000, bonus: 100, popular: false },
        { id: 2, rub: 299, premium: 3500, bonus: 500, popular: true },
        { id: 3, rub: 599, premium: 7500, bonus: 1500, popular: false },
        { id: 4, rub: 999, premium: 15000, bonus: 3000, popular: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPackage) return;

    try {
      setProcessing(true);
      // Имитация оплаты
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Добавляем премиум баланс
      addBalance(selectedPackage.premium + selectedPackage.bonus);
      
      alert(`✅ Успешно!\n\n+${selectedPackage.premium + selectedPackage.bonus} GC добавлено на ваш баланс.`);
      navigate('/profile');
    } catch (error) {
      console.error('Payment failed:', error);
      alert('❌ Ошибка оплаты. Попробуйте снова.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="glass"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/')}
          />
          <h1 className="text-2xl font-bold">Пополнение баланса</h1>
        </div>
      </div>

      {/* Current balance */}
      <div className="glass-effect rounded-2xl p-6 mb-6 text-center">
        <p className="text-gray-400 mb-2">Текущий баланс</p>
        <div className="text-4xl font-bold text-purple-400">
          {user?.premiumBalance || 0} GC
        </div>
      </div>

      {/* Payment packages */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Загрузка пакетов...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`glass-effect rounded-2xl p-6 cursor-pointer transition-all ${
                selectedPackage?.id === pkg.id
                  ? 'border-2 border-purple-500 bg-purple-500/10'
                  : 'border border-transparent hover:border-purple-500/50'
              } ${pkg.popular ? 'relative' : ''}`}
              onClick={() => setSelectedPackage(pkg)}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    ПОПУЛЯРНО
                  </span>
                </div>
              )}

              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {pkg.premium + pkg.bonus} GC
                </div>
                <div className="text-xl font-bold text-white mb-2">{pkg.rub} ₽</div>
                {pkg.bonus > 0 && (
                  <div className="text-sm text-green-400">
                    +{pkg.bonus} GC бонус!
                  </div>
                )}
              </div>

              {selectedPackage?.id === pkg.id && (
                <div className="mt-4 flex justify-center">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment button */}
      {selectedPackage && (
        <div className="mt-6 space-y-3">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            icon={<CreditCard className="w-5 h-5" />}
            onClick={handlePayment}
            disabled={processing}
          >
            {processing ? 'Обработка...' : `Оплатить ${selectedPackage.rub} ₽`}
          </Button>

          <div className="flex items-start gap-2 text-sm text-gray-400">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Это демо-версия. В реальном приложении здесь будет интеграция с платёжной системой.
            </p>
          </div>
        </div>
      )}

      {/* Info */}
      {!selectedPackage && (
        <div className="mt-6 glass-effect rounded-xl p-4">
          <h3 className="font-bold mb-2">Информация</h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• GC — премиум валюта для покупки кейсов и игр</li>
            <li>• Мгновенное зачисление на баланс</li>
            <li>• Безопасные платежи</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;