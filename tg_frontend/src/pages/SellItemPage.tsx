import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Tag, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useUserStore } from '../store/user.store';
import { inventoryAPI, marketAPI } from '../services/api';

const SellItemPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserStore();
  
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('7'); // 7 дней по умолчанию
  const [loading, setLoading] = useState(false);
  const [marketStats, setMarketStats] = useState<any>(null);
  
  // Парсим itemId из query параметров
  const searchParams = new URLSearchParams(location.search);
  const itemIdFromQuery = searchParams.get('itemId');

  useEffect(() => {
    loadInventory();
    loadMarketStats();
  }, []);

  useEffect(() => {
    if (itemIdFromQuery && inventoryItems.length > 0) {
      const item = inventoryItems.find(i => i.id === parseInt(itemIdFromQuery));
      if (item && item.isTradable && !item.isFragment) {
        setSelectedItem(item);
        setPrice(item.price?.toString() || '');
      }
    }
  }, [itemIdFromQuery, inventoryItems]);

  const loadInventory = async () => {
    try {
      const response = await inventoryAPI.getInventory({
        type: 'skins',
        marketable: true
      });
      const { items } = response.data;
      setInventoryItems(items || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  };

  const loadMarketStats = async () => {
    try {
      const response = await marketAPI.getListings({ limit: 1 });
      setMarketStats(response.status);
    } catch (error) {
      console.error('Failed to load market stats:', error);
    }
  };

  const validatePrice = (itemPrice: number) => {
    const priceNum = parseFloat(price);
    
    if (isNaN(priceNum) || priceNum <= 0) {
      return 'Цена должна быть положительным числом';
    }
    
    if (priceNum < 10) {
      return 'Минимальная цена - 10 CR';
    }
    
    if (priceNum > 1000000) {
      return 'Максимальная цена - 1,000,000 CR';
    }
    
    // Проверяем, не слишком ли низкая цена
    if (itemPrice && priceNum < itemPrice * 0.5) {
      return `Цена слишком низкая. Рекомендуемая цена от ${Math.floor(itemPrice * 0.8)} CR`;
    }
    
    // Проверяем, не слишком ли высокая цена
    if (itemPrice && priceNum > itemPrice * 5) {
      return `Цена слишком высокая. Рекомендуемая цена до ${Math.floor(itemPrice * 2)} CR`;
    }
    
    return null;
  };

  const handleSell = async () => {
    if (!selectedItem) {
      alert('Выберите предмет для продажи');
      return;
    }

    const validationError = validatePrice(selectedItem.price);
    if (validationError) {
      alert(validationError);
      return;
    }

    if (!user) {
      alert('Необходимо авторизоваться');
      navigate('/auth');
      return;
    }

    const confirmMessage = `Вы уверены, что хотите выставить ${selectedItem.name} за ${price} CR?\n\n` +
                          `Комиссия: ${Math.floor(parseFloat(price) * 0.05)} CR (5%)\n` +
                          `Вы получите: ${Math.floor(parseFloat(price) * 0.95)} CR\n` +
                          `Срок продажи: ${duration} дней`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await marketAPI.createListing({
        itemId: selectedItem.id,
        price: parseFloat(price),
        duration: parseInt(duration)
      });

      const { data } = response;
      if (data.success) {
        alert('✅ Предмет успешно выставлен на рынок!\n\n' +
              'Вы можете отслеживать продажу в разделе "Ваши лоты".');
        
        // Обновляем инвентарь
        await loadInventory();
        setSelectedItem(null);
        setPrice('');
        
        // Перенаправляем на рынок
        navigate('/market');
      }
    } catch (error: any) {
      console.error('Failed to create listing:', error);
      alert(error.error || 'Ошибка при создании лота');
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    const rarityMap: Record<string, string> = {
      'common': 'border-gray-400 text-gray-400',
      'uncommon': 'border-blue-400 text-blue-400',
      'rare': 'border-purple-400 text-purple-400',
      'mythical': 'border-pink-400 text-pink-400',
      'legendary': 'border-yellow-400 text-yellow-400',
      'ancient': 'border-orange-400 text-orange-400',
      'immortal': 'border-red-400 text-red-400',
      'classified': 'border-green-400 text-green-400',
      'covert': 'border-red-500 text-red-500',
      'contraband': 'border-yellow-500 text-yellow-500',
    };
    return rarityMap[rarity.toLowerCase()] || 'border-gray-500 text-gray-400';
  };

  const durations = [
    { value: '1', label: '1 день', fee: 3 },
    { value: '3', label: '3 дня', fee: 2.5 },
    { value: '7', label: '7 дней', fee: 2 },
    { value: '14', label: '14 дней', fee: 1.5 },
    { value: '30', label: '30 дней', fee: 1 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="glass"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/market')}
          />
          <h1 className="text-3xl font-bold">Продажа предмета</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Левая колонка - выбор предмета */}
          <div>
            {marketStats && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <h3 className="font-bold">Статистика рынка</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-800/50 rounded">
                    <div className="text-lg font-bold text-blue-400">
                      {marketStats.totalListings?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-400">Активных лотов</div>
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 rounded">
                    <div className="text-lg font-bold text-green-400">
                      {marketStats.totalVolume?.toLocaleString() || 0} CR
                    </div>
                    <div className="text-sm text-gray-400">Объем торгов</div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Правая колонка - настройки продажи */}
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">⚙️ Настройки продажи</h2>
              
              {selectedItem ? (
                <>
                  {/* Информация о предмете */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-20 h-20 border-2 rounded-lg flex items-center justify-center ${
                        getRarityColor(selectedItem.rarity)
                      }`}>
                        <div className="w-18 h-18 bg-gradient-to-br from-gray-800 to-gray-900 rounded" />
                      </div>
                      <div>
                        <div className="font-bold text-lg">{selectedItem.name}</div>
                        <div className={`text-sm font-bold ${getRarityColor(selectedItem.rarity)}`}>
                          {selectedItem.rarity?.toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          Оценочная цена: {selectedItem.price || 'Неизвестно'} CR
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Цена */}
                  <div className="mb-6">
                    <label className="block text-gray-400 mb-2">
                      Установите цену (CR)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min="10"
                        max="1000000"
                        step="10"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg pl-10"
                        placeholder="Введите цену"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-400">
                        CR
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[selectedItem.price * 0.8, selectedItem.price, selectedItem.price * 1.2, selectedItem.price * 1.5].map((suggestedPrice, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant="glass"
                          onClick={() => setPrice(Math.floor(suggestedPrice).toString())}
                        >
                          {Math.floor(suggestedPrice)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Срок продажи */}
                  <div className="mb-6">
                    <label className="block text-gray-400 mb-2">
                      Срок продажи
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {durations.map((dur) => (
                        <button
                          key={dur.value}
                          type="button"
                          onClick={() => setDuration(dur.value)}
                          className={`p-3 rounded-lg border text-center transition-colors ${
                            duration === dur.value
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <div className="font-medium">{dur.label}</div>
                          <div className="text-xs text-gray-400">комиссия {dur.fee}%</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Итог */}
                  <Card className="p-4 bg-gray-800/50 mb-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Цена продажи:</span>
                        <span className="font-bold">{price || 0} CR</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Комиссия рынка (5%):</span>
                        <span className="font-bold text-red-400">
                          -{Math.floor(parseFloat(price || '0') * 0.05)} CR
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Доп. комиссия за срок:</span>
                        <span className="font-bold text-orange-400">
                          -{Math.floor(parseFloat(price || '0') * (durations.find(d => d.value === duration)?.fee || 0) / 100)} CR
                        </span>
                      </div>
                      <div className="border-t border-gray-700 pt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Вы получите:</span>
                          <span className="text-green-400">
                            {Math.floor(parseFloat(price || '0') * 0.95 * (1 - (durations.find(d => d.value === duration)?.fee || 0) / 100))} CR
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                  {/* Кнопка продажи */}
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    loading={loading}
                    onClick={handleSell}
                    disabled={!price || parseFloat(price) < 10}
                  >
                    Выставить на продажу
                  </Button>

                  {/* Предупреждения */}
                  <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-bold mb-1">Важно!</div>
                        <ul className="space-y-1 text-gray-300">
                          <li>• Предмет будет снят с продажи автоматически через {duration} дней</li>
                          <li>• Вы можете снять предмет с продажи в любой момент</li>
                          <li>• После продажи предмет будет передан покупателю автоматически</li>
                          <li>• Средства будут зачислены на ваш баланс сразу после продажи</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Tag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-bold mb-2">Выберите предмет</h3>
                  <p className="text-gray-400">
                    Выберите предмет из вашего инвентаря для продажи на рынке
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellItemPage;