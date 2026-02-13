import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useUserStore } from '../store/user.store';

const WithdrawalPage: React.FC = () => {
  const navigate = useNavigate();
  const { premiumBalance } = useUserStore();
  const [skins, setSkins] = useState<any[]>([]);
  const [selectedSkin, setSelectedSkin] = useState<any>(null);
  const [steamLink, setSteamLink] = useState('');
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSkins();
    loadHistory();
  }, []);

  const loadSkins = () => {
    const demoSkins = [
      {
        id: 1,
        name: 'AK-47 | Redline (Field-Tested)',
        weapon: 'AK-47',
        rarity: 'Classified',
        steam_price: 45.50,
        fragments_required: 5,
        premium_fee: 100,
        fragments_collected: 3,
        progress: 60
      },
      {
        id: 2,
        name: 'Glock-18 | Fade (Factory New)',
        weapon: 'Glock-18',
        rarity: 'Covert',
        steam_price: 320.00,
        fragments_required: 8,
        premium_fee: 200,
        fragments_collected: 8,
        progress: 100
      },
      {
        id: 3,
        name: 'AWP | Asiimov (Field-Tested)',
        weapon: 'AWP',
        rarity: 'Covert',
        steam_price: 120.00,
        fragments_required: 10,
        premium_fee: 150,
        fragments_collected: 5,
        progress: 50
      }
    ];
    setSkins(demoSkins);
  };

  const loadHistory = () => {
    const demoHistory = [
      {
        id: 1,
        skin_name: 'AK-47 | Redline',
        status: 'completed',
        fragments_used: 5,
        premium_paid: 100,
        created_at: '2024-01-15',
        processed_at: '2024-01-16'
      },
      {
        id: 2,
        skin_name: 'Glock-18 | Fade',
        status: 'processing',
        fragments_used: 8,
        premium_paid: 200,
        created_at: '2024-01-20',
        processed_at: null
      }
    ];
    setWithdrawHistory(demoHistory);
  };

  const handleWithdraw = () => {
    if (!selectedSkin) {
      alert('Выберите скин для вывода');
      return;
    }

    if (!steamLink.includes('steamcommunity.com/tradeoffer/new/')) {
      alert('Введите корректную Steam Trade Link');
      return;
    }

    if (selectedSkin.fragments_collected < selectedSkin.fragments_required) {
      alert(`Недостаточно фрагментов. Нужно еще ${selectedSkin.fragments_required - selectedSkin.fragments_collected}`);
      return;
    }

    if (premiumBalance < selectedSkin.premium_fee) {
      alert(`Недостаточно GC для комиссии. Нужно: ${selectedSkin.premium_fee} GC`);
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      alert('✅ Заявка на вывод создана! Скин будет отправлен в течение 24 часов.');
      setSelectedSkin(null);
      setSteamLink('');
      setLoading(false);
      loadHistory();
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'processing': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'processing': return 'В обработке';
      case 'completed': return 'Завершено';
      case 'rejected': return 'Отклонено';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <Button
        variant="glass"
        size="sm"
        icon={<ArrowLeft className="w-4 h-4" />}
        onClick={() => navigate('/')}
        className="mb-6"
      >
        Назад
      </Button>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Вывод реальных скинов</h1>
        <p className="text-gray-400 mb-8">Собирайте фрагменты и выводите реальные скины CS:GO в Steam</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Доступные скины</h2>
            <div className="space-y-4">
              {skins.map((skin) => (
                <Card 
                  key={skin.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedSkin?.id === skin.id ? 'border-2 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedSkin(skin)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-gray-700 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{skin.fragments_collected}/{skin.fragments_required}</div>
                        <div className="text-xs text-gray-400">фрагментов</div>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{skin.name}</h3>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-gray-400">{skin.weapon}</span>
                        <span className={`text-sm font-bold ${
                          skin.rarity === 'Covert' ? 'text-red-400' :
                          skin.rarity === 'Classified' ? 'text-orange-400' :
                          'text-yellow-400'
                        }`}>
                          {skin.rarity}
                        </span>
                        <span className="text-sm text-green-400">${skin.steam_price}</span>
                      </div>
                      
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Прогресс</span>
                          <span className="font-bold">{skin.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all"
                            style={{ width: `${skin.progress}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <div className="text-gray-400">Комиссия:</div>
                          <div className="font-bold text-purple-400">{skin.premium_fee} GC</div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant={skin.fragments_collected >= skin.fragments_required ? 'primary' : 'glass'}
                          disabled={skin.fragments_collected < skin.fragments_required}
                        >
                          {skin.fragments_collected >= skin.fragments_required ? 'Вывести' : 'Недостаточно фрагментов'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Форма вывода</h2>
            
            <Card className="p-6 mb-6">
              {selectedSkin ? (
                <>
                  <div className="mb-6">
                    <h3 className="font-bold mb-2">Выбранный скин:</h3>
                    <div className="p-3 bg-gray-800/50 rounded">
                      <div className="font-bold">{selectedSkin.name}</div>
                      <div className="text-sm text-gray-400">
                        {selectedSkin.fragments_collected}/{selectedSkin.fragments_required} фрагментов
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      Steam Trade Link
                    </label>
                    <input
                      type="text"
                      value={steamLink}
                      onChange={(e) => setSteamLink(e.target.value)}
                      placeholder="https://steamcommunity.com/tradeoffer/new/..."
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                    />
                    <a 
                      href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Как получить Trade Link?
                    </a>
                  </div>

                  <div className="mb-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Фрагментов использовано:</span>
                      <span className="font-bold">{selectedSkin.fragments_required}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Комиссия за вывод:</span>
                      <span className="font-bold text-purple-400">{selectedSkin.premium_fee} GC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ваш баланс GC:</span>
                      <span className={`font-bold ${
                        premiumBalance >= selectedSkin.premium_fee ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {premiumBalance} GC
                      </span>
                    </div>
                    <div className="border-t border-gray-700 pt-3">
                      <div className="flex justify-between font-bold">
                        <span>Итого к оплате:</span>
                        <span className="text-yellow-400">{selectedSkin.premium_fee} GC</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    fullWidth
                    loading={loading}
                    onClick={handleWithdraw}
                    disabled={!steamLink || premiumBalance < selectedSkin.premium_fee}
                  >
                    {loading ? 'Отправка...' : 'Отправить заявку'}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">Выберите скин для вывода</p>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-4">📋 Правила вывода</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Вывод доступен при наличии всех фрагментов скина</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Комиссия списывается с премиум баланса (GC)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Скины отправляются в течение 24 часов</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>Убедитесь, что Steam Trade Link корректен</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">История выводов</h2>
          <Card className="p-6">
            {withdrawHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4 text-left">Скин</th>
                      <th className="py-3 px-4 text-left">Фрагментов</th>
                      <th className="py-3 px-4 text-left">Комиссия</th>
                      <th className="py-3 px-4 text-left">Статус</th>
                      <th className="py-3 px-4 text-left">Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawHistory.map((item) => (
                      <tr key={item.id} className="border-b border-gray-800">
                        <td className="py-3 px-4">
                          <div className="font-medium">{item.skin_name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-yellow-400">{item.fragments_used}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-purple-400">{item.premium_paid} GC</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`font-bold ${getStatusColor(item.status)}`}>
                            {getStatusText(item.status)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-400">
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                У вас еще не было выводов
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalPage;