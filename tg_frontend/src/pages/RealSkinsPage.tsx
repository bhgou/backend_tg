import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, TrendingUp, Award } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const RealSkinsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const skins = [
    {
      id: 1,
      name: 'AK-47 | Redline',
      weapon: 'AK-47',
      rarity: 'Classified',
      steam_price: 45.50,
      fragments_required: 5,
      fragments_collected: 3,
      premium_fee: 100,
      exterior: 'Field-Tested',
      is_stattrak: false,
      is_souvenir: false,
      float_value: 0.15,
      progress: 60
    },
    {
      id: 2,
      name: 'Glock-18 | Fade',
      weapon: 'Glock-18',
      rarity: 'Covert',
      steam_price: 320.00,
      fragments_required: 8,
      fragments_collected: 8,
      premium_fee: 200,
      exterior: 'Factory New',
      is_stattrak: false,
      is_souvenir: false,
      float_value: 0.01,
      progress: 100
    },
    {
      id: 3,
      name: 'AWP | Asiimov',
      weapon: 'AWP',
      rarity: 'Covert',
      steam_price: 120.00,
      fragments_required: 10,
      fragments_collected: 5,
      premium_fee: 150,
      exterior: 'Field-Tested',
      is_stattrak: false,
      is_souvenir: false,
      float_value: 0.25,
      progress: 50
    },
    {
      id: 4,
      name: 'M4A4 | Howl',
      weapon: 'M4A4',
      rarity: 'Contraband',
      steam_price: 2500.00,
      fragments_required: 20,
      fragments_collected: 12,
      premium_fee: 500,
      exterior: 'Factory New',
      is_stattrak: false,
      is_souvenir: false,
      float_value: 0.03,
      progress: 60
    },
    {
      id: 5,
      name: 'Karambit | Fade',
      weapon: 'Karambit',
      rarity: 'Covert',
      steam_price: 3200.00,
      fragments_required: 25,
      fragments_collected: 8,
      premium_fee: 800,
      exterior: 'Factory New',
      is_stattrak: true,
      is_souvenir: false,
      float_value: 0.02,
      progress: 32
    },
    {
      id: 6,
      name: 'Desert Eagle | Blaze',
      weapon: 'Desert Eagle',
      rarity: 'Classified',
      steam_price: 85.00,
      fragments_required: 8,
      fragments_collected: 6,
      premium_fee: 120,
      exterior: 'Factory New',
      is_stattrak: false,
      is_souvenir: false,
      float_value: 0.01,
      progress: 75
    }
  ];

  const filteredSkins = skins.filter(skin => {
    if (filter === 'available' && skin.fragments_collected < skin.fragments_required) return true;
    if (filter === 'ready' && skin.fragments_collected >= skin.fragments_required) return true;
    if (filter === 'stattrak' && skin.is_stattrak) return true;
    if (filter !== 'all' && filter !== 'available' && filter !== 'ready' && filter !== 'stattrak') {
      return skin.weapon.toLowerCase() === filter;
    }
    if (search) {
      return skin.name.toLowerCase().includes(search.toLowerCase()) ||
             skin.weapon.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Contraband': return 'text-yellow-500';
      case 'Covert': return 'text-red-400';
      case 'Classified': return 'text-orange-400';
      case 'Restricted': return 'text-purple-400';
      case 'Mil-Spec': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-green-400';
    if (progress >= 70) return 'text-yellow-400';
    if (progress >= 40) return 'text-orange-400';
    return 'text-red-400';
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

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Реальные скины CS:GO</h1>
        <p className="text-gray-400 mb-8">Собирайте фрагменты и выводите реальные скины в Steam</p>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск скинов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'glass'}
              onClick={() => setFilter('all')}
              icon={<Filter className="w-4 h-4" />}
            >
              Все
            </Button>
            <Button
              variant={filter === 'available' ? 'primary' : 'glass'}
              onClick={() => setFilter('available')}
            >
              Доступные
            </Button>
            <Button
              variant={filter === 'ready' ? 'primary' : 'glass'}
              onClick={() => setFilter('ready')}
            >
              Готовы к выводу
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          {['AK-47', 'AWP', 'M4A4', 'Glock-18', 'Desert Eagle', 'Karambit'].map((weapon) => (
            <Button
              key={weapon}
              variant={filter === weapon.toLowerCase() ? 'primary' : 'glass'}
              size="sm"
              onClick={() => setFilter(weapon.toLowerCase())}
            >
              {weapon}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-400">
              {skins.length}
            </div>
            <div className="text-sm text-gray-400">Всего скинов</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-400">
              {skins.filter(s => s.fragments_collected >= s.fragments_required).length}
            </div>
            <div className="text-sm text-gray-400">Готовы к выводу</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {skins.reduce((acc, s) => acc + s.fragments_collected, 0)}
            </div>
            <div className="text-sm text-gray-400">Всего фрагментов</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-purple-400">
              ${skins.reduce((acc, s) => acc + s.steam_price, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Общая стоимость</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkins.map((skin) => (
            <Card key={skin.id} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg mb-1">{skin.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{skin.weapon}</span>
                    <span className={`text-sm font-bold ${getRarityColor(skin.rarity)}`}>
                      {skin.rarity}
                    </span>
                    {skin.is_stattrak && (
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                        StatTrak™
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-400">${skin.steam_price}</div>
                  <div className="text-xs text-gray-400">{skin.exterior}</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">
                    Фрагменты: {skin.fragments_collected}/{skin.fragments_required}
                  </span>
                  <span className={`font-bold ${getProgressColor(skin.progress)}`}>
                    {skin.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      skin.progress >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                      skin.progress >= 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                      'bg-gradient-to-r from-blue-500 to-cyan-400'
                    }`}
                    style={{ width: `${skin.progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-2 bg-gray-800/50 rounded">
                  <div className="text-sm text-gray-400">Комиссия</div>
                  <div className="font-bold text-purple-400">{skin.premium_fee} GC</div>
                </div>
                <div className="text-center p-2 bg-gray-800/50 rounded">
                  <div className="text-sm text-gray-400">Float</div>
                  <div className="font-bold text-blue-400">{skin.float_value}</div>
                </div>
              </div>

              <Button
                variant={skin.fragments_collected >= skin.fragments_required ? 'primary' : 'glass'}
                fullWidth
                onClick={() => navigate('/withdraw')}
                icon={skin.fragments_collected >= skin.fragments_required ? <TrendingUp className="w-4 h-4" /> : <Award className="w-4 h-4" />}
              >
                {skin.fragments_collected >= skin.fragments_required ? 'Вывести' : 'Собирать фрагменты'}
              </Button>
            </Card>
          ))}
        </div>

        <Card className="mt-8 p-6">
          <h3 className="text-xl font-bold mb-4">🎮 Как получить реальный скин?</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="text-3xl mb-2">1️⃣</div>
              <div className="font-bold mb-2">Собирайте фрагменты</div>
              <div className="text-sm text-gray-400">
                Открывайте кейсы и получайте фрагменты скинов
              </div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">2️⃣</div>
              <div className="font-bold mb-2">Наберите все фрагменты</div>
              <div className="text-sm text-gray-400">
                Соберите необходимое количество фрагментов для скина
              </div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">3️⃣</div>
              <div className="font-bold mb-2">Оплатите комиссию</div>
              <div className="text-sm text-gray-400">
                Уплатите комиссию в премиум валюте (GC)
              </div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">4️⃣</div>
              <div className="font-bold mb-2">Получите скин</div>
              <div className="text-sm text-gray-400">
                Скин будет отправлен на ваш Steam аккаунт
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RealSkinsPage;