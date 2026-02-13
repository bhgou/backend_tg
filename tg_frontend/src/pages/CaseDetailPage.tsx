import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, Gift, Zap, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useUserStore } from '../store/user.store';
import { caseAPI, type OpenCaseResponse, type CasesResponse, type ApiResponse } from '../services/api';

const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, balance, premiumBalance, addBalance, addPremiumBalance } = useUserStore();
  const [caseData, setCaseData] = useState<any>(null);
  const [drops, setDrops] = useState<any[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [result, setResult] = useState<OpenCaseResponse | null>(null);
  const [selectedDrop, setSelectedDrop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCaseData();
  }, [id]);

  const loadCaseData = async () => {
    try {
      setLoading(true);
      const [caseResponse, dropsResponse] = await Promise.all([
        caseAPI.getCases(),
        caseAPI.getCaseDrops(Number(id))
      ]);
      
      // Приводим типы
      const casesResponse = caseResponse as unknown as CasesResponse;
      const foundCase = casesResponse.cases?.find((c: any) => c.id === Number(id));
      setCaseData(foundCase);
      
      // Исправляем получение дропов
      const dropsData = dropsResponse as unknown as ApiResponse;
      setDrops(dropsData.data?.drops || dropsData.drops || []);
    } catch (error) {
      console.error('Failed to load case data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCase = async () => {
    if (!caseData || !user) return;
    
    // Проверка баланса
    if (caseData.price && balance < caseData.price) {
      alert(`Недостаточно средств! Нужно: ${caseData.price} CR`);
      return;
    }

    if (caseData.premium_price && premiumBalance < caseData.premium_price) {
      alert(`Недостаточно премиум валюты! Нужно: ${caseData.premium_price} GC`);
      return;
    }

    try {
      setIsOpening(true);
      
      // Отправляем запрос на открытие кейса
      const response = await caseAPI.openCase(Number(id)) as unknown as ApiResponse;
      
      if (response.success) {
        // Обновляем баланс
        if (caseData.price) {
          addBalance(-caseData.price);
        }
        if (caseData.premium_price) {
          addPremiumBalance(-caseData.premium_price);
        }
        
        // Добавляем выигрыш
        const item = response.data?.item || response.item;
        if (item?.is_fragment || item?.isFragment) {
          // Для фрагментов просто показываем
          setResult({
            success: true,
            item,
            case: caseData || {
              id: 0,
              name: '',
              type: 'standard',
              price: 0,
              premiumPrice: 0,
              imageUrl: '',
              description: '',
              minReward: 0,
              maxReward: 0,
              isActive: false,
              coolDownMinutes: 0,
              totalOpened: 0,
              createdAt: ''
            },
            newBalance: response.data?.newBalance || 0,
            message: response.message || 'Вы получили фрагменты!'
          });
        } else {
          // Для скинов показываем анимацию
          await showOpeningAnimation(item);
        }
        
        // Обновляем баланс из ответа сервера
        if (response.data?.newBalance !== undefined) {
          addBalance(response.data.newBalance - balance);
        }
      }
    } catch (error) {
      console.error('Failed to open case:', error);
      alert('Ошибка при открытии кейса');
    } finally {
      setIsOpening(false);
    }
  };

  const showOpeningAnimation = async (item: any) => {
    if (!item) return;
    
    const dropsCount = drops.length;
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      setSelectedDrop(drops[Math.floor(Math.random() * dropsCount)]);
      currentIndex++;
    }, 50);
    
    // Через 2 секунды останавливаемся на реальном выигрыше
    await new Promise(resolve => setTimeout(resolve, 2000));
    clearInterval(interval);
    
    setSelectedDrop(item);
    setResult({ 
      success: true, 
      item, 
      case: caseData || {
        id: 0,
        name: '',
        type: 'standard',
        price: 0,
        premiumPrice: 0,
        imageUrl: '',
        description: '',
        minReward: 0,
        maxReward: 0,
        isActive: false,
        coolDownMinutes: 0,
        totalOpened: 0,
        createdAt: ''
      },
      newBalance: 0,
      message: 'Поздравляем с выигрышем!'
    });
    
    // Через 3 секунды сбрасываем
    setTimeout(() => {
      setSelectedDrop(null);
      setResult(null);
    }, 3000);
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      'common': 'text-gray-400 border-gray-400',
      'uncommon': 'text-green-400 border-green-400',
      'rare': 'text-blue-400 border-blue-400',
      'epic': 'text-purple-400 border-purple-400',
      'legendary': 'text-yellow-400 border-yellow-400',
      'mythical': 'text-pink-400 border-pink-400',
      'classified': 'text-orange-400 border-orange-400',
      'covert': 'text-red-400 border-red-400',
    };
    return colors[rarity?.toLowerCase()] || 'text-gray-400 border-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Загрузка кейса...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
        <div className="text-center py-12">
          <p className="text-xl">Кейс не найден</p>
          <Button onClick={() => navigate('/cases')} className="mt-4">
            Вернуться к кейсам
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      {/* Кнопка назад */}
      <Button
        variant="glass"
        size="sm"
        icon={<ArrowLeft className="w-4 h-4" />}
        onClick={() => navigate('/cases')}
        className="mb-6"
      >
        Назад
      </Button>

      {/* Основная информация о кейсе */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Левая колонка - кейс */}
          <div>
            <Card className="p-8 text-center">
              <div className="w-48 h-48 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl animate-pulse" />
                <div className="absolute inset-4 bg-gradient-to-tr from-gray-900 to-black rounded-xl border-2 border-yellow-400/30 flex items-center justify-center">
                  <Gift className="w-20 h-20 text-yellow-400" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold mb-2">{caseData.name}</h1>
              <p className="text-gray-400 mb-6">{caseData.description}</p>
              
              <div className="flex items-center justify-center gap-4 mb-6">
                {caseData.price && (
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <span className="text-xl font-bold">{caseData.price} CR</span>
                  </div>
                )}
                {caseData.premium_price && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <span className="text-xl font-bold">{caseData.premium_price} GC</span>
                  </div>
                )}
                {!caseData.price && !caseData.premium_price && (
                  <span className="text-xl font-bold text-green-400">БЕСПЛАТНО</span>
                )}
              </div>
              
              <Button
                variant="primary"
                size="xl"
                loading={isOpening}
                onClick={openCase}
                disabled={isOpening || (caseData.price && balance < caseData.price) || (caseData.premium_price && premiumBalance < caseData.premium_price)}
                className="w-full py-4 text-lg"
                icon={<Zap className="w-5 h-5" />}
              >
                {isOpening ? 'Открывается...' : 'Открыть кейс'}
              </Button>
              
              {caseData.price && balance < caseData.price && (
                <p className="text-red-400 mt-2">Недостаточно CR</p>
              )}
              {caseData.premium_price && premiumBalance < caseData.premium_price && (
                <p className="text-red-400 mt-2">Недостаточно GC</p>
              )}
            </Card>
            
            {/* Информация о наградах */}
            <Card className="mt-6 p-6">
              <h3 className="text-lg font-bold mb-4">Возможные награды</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gray-800/50 rounded">
                  <div className="text-yellow-400 font-bold">{caseData.min_reward || 10}+</div>
                  <div className="text-sm text-gray-400">Минимальная награда</div>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded">
                  <div className="text-green-400 font-bold">{caseData.max_reward || 100}+</div>
                  <div className="text-sm text-gray-400">Максимальная награда</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Правая колонка - дропы */}
          <div>
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Содержимое кейса</h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {drops.map((drop, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                      selectedDrop?.id === drop.id 
                        ? 'border-yellow-500 bg-yellow-500/10' 
                        : 'border-gray-700 bg-gray-800/30'
                    }`}>
                      <div className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center ${
                        getRarityColor(drop.rarity)
                      }`}>
                        {drop.is_fragment ? (
                          <div className="text-center">
                            <div className="font-bold">{drop.fragments || 1}</div>
                            <div className="text-xs">фраг.</div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-700 rounded" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{drop.skin_name || drop.name || 'Фрагмент скина'}</div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${getRarityColor(drop.rarity)}`}>
                            {(drop.rarity || 'COMMON')?.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">
                            {drop.probability ? `${(drop.probability * 100).toFixed(2)}%` : '?'}
                          </span>
                        </div>
                      </div>
                      {drop.price && (
                        <div className="text-right">
                          <div className="font-bold text-yellow-400">
                            {drop.price} CR
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
            
            {/* Статистика кейса */}
            <Card className="mt-6 p-6">
              <h3 className="text-lg font-bold mb-4">Статистика</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Всего дропов:</span>
                  <span className="font-bold">{drops.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Шанс легендарного:</span>
                  <span className="font-bold text-yellow-400">
                    {drops.filter(d => d.rarity?.toLowerCase() === 'legendary').length > 0 
                      ? `${(drops.filter(d => d.rarity?.toLowerCase() === 'legendary')[0]?.probability * 100 || 0).toFixed(2)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Фрагменты:</span>
                  <span className="font-bold text-blue-400">
                    {drops.filter(d => d.is_fragment).length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Анимация открытия */}
      <AnimatePresence>
        {isOpening && selectedDrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -180 }}
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: 0,
                transition: {
                  duration: 1.5,
                  times: [0, 0.5, 1]
                }
              }}
              className="relative"
            >
              <div className="w-96 h-96 bg-gradient-to-br from-yellow-500 to-red-600 rounded-2xl shadow-2xl shadow-yellow-500/50">
                <div className="absolute inset-8 bg-gradient-to-tr from-gray-900 to-black rounded-xl border-2 border-yellow-400/30 flex flex-col items-center justify-center p-6">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      transition: { repeat: Infinity, duration: 0.5 }
                    }}
                    className="mb-4"
                  >
                    <Gift className="w-20 h-20 text-yellow-400" />
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold mb-2">Открываем...</h3>
                  <p className="text-gray-400 text-center">
                    Скоро вы узнаете, что внутри!
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Результат открытия */}
      <AnimatePresence>
        {result && result.success && result.item && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-6 right-6 z-40"
          >
            <Card className="p-6 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-yellow-500 flex items-center justify-center">
                    {result.item?.is_fragment || result.item?.isFragment ? (
                      <div className="text-center">
                        <div className="text-2xl font-bold">{result.item.fragments || 1}</div>
                        <div className="text-xs">фрагментов</div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-700 rounded" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">🎉 Поздравляем!</h4>
                    <p className="text-gray-300">{result.message || 'Вы получили награду!'}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setResult(null)}
                >
                  Закрыть
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CaseDetailPage;