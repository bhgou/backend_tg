import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { caseAPI } from '../services/api';
import type { Case as ApiCase } from '../types/cases';

// Локальный тип для Case (без конфликта с ApiCase)
interface LocalCase {
  id: number;
  name: string;
  type: 'ad' | 'standard' | 'premium';
  price: number | null;
  imageUrl: string | null;
  description: string | null;
}

// Компонент CasesGrid
export const CasesGrid: React.FC<{ cases: LocalCase[], onSelectCase: (id: number) => void }> = ({ cases, onSelectCase }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {cases.map((caseItem) => (
        <div
          key={caseItem.id}
          className="bg-gray-800 rounded-xl p-4 cursor-pointer transition-transform hover:scale-105 hover:shadow-lg"
          onClick={() => onSelectCase(caseItem.id)}
        >
          <div className="aspect-square bg-gradient-to-br from-gray-900 to-black rounded-lg mb-3 flex items-center justify-center">
            {caseItem.type === 'ad' && (
              <div className="text-center">
                <div className="text-4xl">📺</div>
                <div className="text-xs text-gray-400 mt-1">Реклама</div>
              </div>
            )}
            {caseItem.type === 'standard' && (
              <div className="text-center">
                <div className="text-4xl">🎁</div>
                <div className="text-xs text-gray-400 mt-1">Стандарт</div>
              </div>
            )}
            {caseItem.type === 'premium' && (
              <div className="text-center">
                <div className="text-4xl">💎</div>
                <div className="text-xs text-gray-400 mt-1">Премиум</div>
              </div>
            )}
          </div>
          <h3 className="font-bold text-lg mb-1">{caseItem.name}</h3>
          <p className="text-sm text-gray-400 mb-2 line-clamp-2">{caseItem.description}</p>
          <div className="flex justify-between items-center">
            <span className="font-bold text-yellow-400">
              {caseItem.price ? `${caseItem.price} CR` : 'БЕСПЛАТНО'}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              caseItem.type === 'ad' ? 'bg-green-500/20 text-green-400' :
              caseItem.type === 'standard' ? 'bg-blue-500/20 text-blue-400' :
              'bg-purple-500/20 text-purple-400'
            }`}>
              {caseItem.type === 'ad' ? 'Бесплатный' :
               caseItem.type === 'standard' ? 'Стандартный' : 'Премиум'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Основной компонент страницы
export const CasesPage: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<LocalCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const response = await caseAPI.getCases();
      
      // Исправляем обработку ответа API
      const responseData = response as any;
      const apiCases = responseData.cases || responseData.data?.cases || [];
      
      const localCases: LocalCase[] = apiCases.map((apiCase: ApiCase) => ({
        id: Number(apiCase.id),
        name: apiCase.name,
        type: apiCase.type as 'ad' | 'standard' | 'premium',
        price: apiCase.price,
        imageUrl: apiCase.imageUrl || null,
        description: apiCase.description || null
      }));
      
      setCases(localCases);
    } catch (error) {
      console.error('Failed to load cases:', error);
      // Демо данные для тестирования
      setCases([
        {
          id: 1,
          name: 'Бесплатный кейс',
          type: 'ad',
          price: null,
          imageUrl: null,
          description: 'Смотрите рекламу и получайте награды'
        },
        {
          id: 2,
          name: 'Стандартный кейс',
          type: 'standard',
          price: 100,
          imageUrl: null,
          description: 'Обычные скины и фрагменты'
        },
        {
          id: 3,
          name: 'Премиум кейс',
          type: 'premium',
          price: 500,
          imageUrl: null,
          description: 'Редкие и легендарные скины'
        },
        {
          id: 4,
          name: 'Новичковый кейс',
          type: 'ad',
          price: null,
          imageUrl: null,
          description: 'Бесплатный кейс для новичков'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseSelect = (id: number) => {
    navigate(`/cases/${id}`);
  };

  const filteredCases = cases.filter(c => 
    ['ad', 'standard', 'premium'].includes(c.type)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="glass"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/')}
          />
          <h1 className="text-2xl font-bold">Кейсы</h1>
          <span className="text-gray-400">({filteredCases.length})</span>
        </div>
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Загрузка кейсов...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold">Кейсы</h1>
          <span className="text-gray-400">({filteredCases.length})</span>
        </div>
        <Button
          variant="glass"
          size="sm"
          icon={<Filter className="w-4 h-4" />}
        />
      </div>

      {/* Cases grid */}
      {filteredCases.length > 0 ? (
        <CasesGrid cases={filteredCases} onSelectCase={handleCaseSelect} />
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-bold mb-2">Кейсы не найдены</h2>
          <p className="text-gray-400 mb-6">Попробуйте обновить страницу</p>
          <Button onClick={loadCases}>Обновить</Button>
        </div>
      )}

      {/* Categories */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Категории</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { 
              type: 'ad', 
              label: 'Бесплатные', 
              color: 'from-green-500 to-emerald-600',
              count: filteredCases.filter(c => c.type === 'ad').length
            },
            { 
              type: 'standard', 
              label: 'Стандартные', 
              color: 'from-blue-500 to-cyan-600',
              count: filteredCases.filter(c => c.type === 'standard').length
            },
            { 
              type: 'premium', 
              label: 'Премиум', 
              color: 'from-purple-500 to-pink-600',
              count: filteredCases.filter(c => c.type === 'premium').length
            },
            { 
              type: 'all', 
              label: 'Все кейсы', 
              color: 'from-yellow-500 to-orange-600',
              count: filteredCases.length
            },
          ].map((item) => (
            <div 
              key={item.type}
              className={`bg-gradient-to-r ${item.color} p-4 rounded-xl relative overflow-hidden`}
            >
              <div className="absolute top-2 right-2 bg-white/10 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center">
                {item.count}
              </div>
              <div className="text-lg font-semibold text-white mb-1">{item.label}</div>
              <div className="text-sm text-white/80">
                {item.type === 'ad' && 'За просмотр рекламы'}
                {item.type === 'standard' && 'За основную валюту'}
                {item.type === 'premium' && 'За премиум валюту'}
                {item.type === 'all' && 'Все доступные кейсы'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info card */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl">
        <h3 className="font-bold mb-2">ℹ️ Как открывать кейсы?</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• <span className="text-green-400">Бесплатные кейсы</span> - смотрите рекламу и получайте награды</li>
          <li>• <span className="text-blue-400">Стандартные кейсы</span> - открывайте за основную валюту (CR)</li>
          <li>• <span className="text-purple-400">Премиум кейсы</span> - открывайте за премиум валюту (GC)</li>
          <li>• Нажмите на любой кейс, чтобы посмотреть его содержимое</li>
        </ul>
      </div>
    </div>
  );
};

export default CasesPage;