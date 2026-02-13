import React, { useState, useEffect } from 'react';
import { ArrowLeft, Grid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { inventoryAPI } from '../services/api';

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadInventory();
  }, [filter]);

  const loadInventory = async () => {
    try {
      const response = await inventoryAPI.getInventory({
        type: filter === 'all' ? undefined : filter
      });
      
      // Исправляем обработку ответа API
      const responseData = response as any;
      setItems(responseData.items || responseData.data?.items || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      // Тестовые данные
      setItems([
        {
          id: 1,
          name: 'AK-47 | Redline',
          rarity: 'classified',
          is_fragment: false,
          fragments: 1,
          price: 45.50
        },
        {
          id: 2,
          name: 'Glock-18 | Water Elemental',
          rarity: 'mil-spec',
          is_fragment: false,
          fragments: 1,
          price: 5.50
        },
        {
          id: 3,
          name: 'Фрагменты M4A1-S',
          rarity: 'common',
          is_fragment: true,
          fragments: 8,
          price: 0
        },
        {
          id: 4,
          name: 'AWP | Asiimov',
          rarity: 'covert',
          is_fragment: false,
          fragments: 1,
          price: 120.00
        },
      ]);
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
          <h1 className="text-2xl font-bold">Инвентарь</h1>
          <span className="text-gray-400">({items.length})</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'glass'}
            size="sm"
            icon={<Grid className="w-4 h-4" />}
            onClick={() => setViewMode('grid')}
          />
          <Button
            variant={viewMode === 'list' ? 'primary' : 'glass'}
            size="sm"
            icon={<List className="w-4 h-4" />}
            onClick={() => setViewMode('list')}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {['all', 'skins', 'fragments'].map((filterType) => (
          <Button
            key={filterType}
            variant={filter === filterType ? 'primary' : 'glass'}
            size="sm"
            onClick={() => setFilter(filterType)}
          >
            {filterType === 'all' ? 'Все' : 
             filterType === 'skins' ? 'Скины' : 'Фрагменты'}
          </Button>
        ))}
      </div>

      {/* Inventory items */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="transition-transform hover:scale-105"
            >
              <Card hoverable className="p-3">
                <div className={`border-2 rounded-lg p-2 mb-2 ${getRarityColor(item.rarity)}`}>
                  <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded flex items-center justify-center">
                    {item.is_fragment ? (
                      <div className="text-center">
                        <div className="text-2xl font-bold">{item.fragments}</div>
                        <div className="text-xs">фрагментов</div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-700 rounded" />
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-sm truncate">{item.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs font-bold ${getRarityColor(item.rarity)}`}>
                    {item.rarity.toUpperCase()}
                  </span>
                  {item.price ? (
                    <span className="text-yellow-400 text-sm font-bold">
                      {item.price} CR
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">бесплатно</span>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="transition-transform hover:scale-[1.02]"
            >
              <Card hoverable className="flex items-center gap-3 p-3">
                <div className={`w-16 h-16 border-2 rounded-lg p-1 ${getRarityColor(item.rarity)}`}>
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded flex items-center justify-center">
                    {item.is_fragment && (
                      <div className="text-center">
                        <div className="text-lg font-bold">{item.fragments}</div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-bold ${getRarityColor(item.rarity)}`}>
                      {item.rarity.toUpperCase()}
                    </span>
                    {item.is_fragment && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        {item.fragments} фрагментов
                      </span>
                    )}
                  </div>
                </div>
                {item.price ? (
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold">{item.price} CR</div>
                    <Button size="sm" className="mt-2">
                      Продать
                    </Button>
                  </div>
                ) : (
                  <Button size="sm">Объединить</Button>
                )}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};