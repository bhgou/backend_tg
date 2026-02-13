import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, Search, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { marketAPI, MarketResponse } from '../services/api';

export const MarketPage: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadListings();
  }, [filter]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const response = await marketAPI.getListings({
        page: 1,
        limit: 20
      });
      const data: MarketResponse = response.data; // или используйте сразу response.data
      setListings(data.listings || []);
    } catch (error) {
      console.error('Failed to load listings:', error);
      // Тестовые данные
      setListings([
        {
          id: 1,
          name: 'AK-47 | Redline',
          rarity: 'classified',
          price: 4550,
          seller_name: 'pro_player',
          fragments: 1,
          is_fragment: false
        },
        {
          id: 2,
          name: 'Glock-18 | Water Elemental',
          rarity: 'mil-spec',
          price: 550,
          seller_name: 'trader123',
          fragments: 1,
          is_fragment: false
        },
        {
          id: 3,
          name: 'Фрагменты AWP',
          rarity: 'common',
          price: 100,
          seller_name: 'collector',
          fragments: 5,
          is_fragment: true
        },
        {
          id: 4,
          name: 'M4A1-S | Guardian',
          rarity: 'restricted',
          price: 1200,
          seller_name: 'csgo_fan',
          fragments: 1,
          is_fragment: false
        },
      ]);
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
      'restricted': 'border-blue-500 text-blue-500',
      'mil-spec': 'border-purple-500 text-purple-500',
    };
    return rarityMap[rarity.toLowerCase()] || 'border-gray-500 text-gray-400';
  };

  const handleBuyItem = async (listingId: number) => {
    try {
      alert(`Покупка предмета #${listingId}\n\nЭта функция в разработке.`);
      // await marketAPI.buyItem(listingId);
      // loadListings(); // Перезагружаем список
    } catch (error) {
      console.error('Failed to buy item:', error);
      alert('Ошибка покупки предмета');
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
          <h1 className="text-2xl font-bold">Рынок</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="glass"
            size="sm"
            icon={<Search className="w-4 h-4" />}
          />
          <Button
            variant="glass"
            size="sm"
            icon={<Filter className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {['all', 'skins', 'fragments', 'trending'].map((filterType) => (
          <Button
            key={filterType}
            variant={filter === filterType ? 'primary' : 'glass'}
            size="sm"
            onClick={() => setFilter(filterType)}
          >
            {filterType === 'all' ? 'Все' : 
             filterType === 'skins' ? 'Скины' : 
             filterType === 'fragments' ? 'Фрагменты' : 'Тренды'}
          </Button>
        ))}
      </div>

      {/* Market stats */}
      <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h3 className="font-bold">Статистика рынка</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-400">24</div>
            <div className="text-sm text-gray-400">Продажи за день</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-400">1,245</div>
            <div className="text-sm text-gray-400">Активных лотов</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-400">15,670</div>
            <div className="text-sm text-gray-400">CR в обороте</div>
          </div>
        </div>
      </div>

      {/* Listings */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-3 animate-pulse">
              <div className="aspect-square bg-gray-800 rounded-lg mb-2" />
              <div className="h-4 bg-gray-800 rounded mb-2" />
              <div className="h-3 bg-gray-800 rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {listings.map((listing: any) => (
            <div
              key={listing.id}
              className="transition-transform hover:scale-105"
            >
              <Card hoverable className="p-3">
                <div className={`border-2 rounded-lg p-2 mb-2 ${getRarityColor(listing.rarity || 'common')}`}>
                  <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded flex items-center justify-center">
                    {listing.is_fragment ? (
                      <div className="text-center">
                        <div className="text-2xl font-bold">{listing.fragments || 1}</div>
                        <div className="text-xs">фрагментов</div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-700 rounded" />
                    )}
                  </div>
                </div>
                
                <div className="mb-2">
                  <h3 className="font-bold text-sm truncate">{listing.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs font-bold ${getRarityColor(listing.rarity || 'common')}`}>
                      {(listing.rarity || 'COMMON').toUpperCase()}
                    </span>
                    {listing.is_fragment && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        {listing.fragments || 1}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-yellow-400 font-bold">{listing.price} CR</div>
                    <div className="text-xs text-gray-400">
                      от {listing.seller_name || 'Продавец'}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleBuyItem(listing.id)}
                  >
                    Купить
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};  