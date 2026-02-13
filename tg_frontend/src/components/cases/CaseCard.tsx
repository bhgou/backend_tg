import React from 'react';
import { Gift, Coins, Tv } from 'lucide-react';
import { Card } from '../ui/Card';

interface CaseCardProps {
  caseItem: {
    id: number;
    name: string;
    type: 'ad' | 'standard' | 'premium';
    price: number | null;
    imageUrl: string | null;
    description: string | null;
  };
  onClick: () => void;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseItem, onClick }) => {
  const getCaseTypeColor = () => {
    switch (caseItem.type) {
      case 'ad': return 'from-green-500 to-emerald-600';
      case 'standard': return 'from-blue-500 to-cyan-600';
      case 'premium': return 'from-purple-500 to-pink-600';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getCaseIcon = () => {
    switch (caseItem.type) {
      case 'ad': return <Tv className="w-5 h-5" />;
      case 'standard': return <Gift className="w-5 h-5" />;
      case 'premium': return <Gift className="w-5 h-5 text-yellow-400" />;
      default: return <Gift className="w-5 h-5" />;
    }
  };

  return (
    <Card
      hoverable
      glow={caseItem.type === 'premium'}
      onClick={onClick}
      className="relative overflow-hidden"
    >
      {/* Градиентный фон */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getCaseTypeColor()} opacity-20`} />
      
      <div className="relative z-10">
        <div className="absolute top-2 right-2">
          {getCaseIcon()}
        </div>
        
        <div className="text-center mb-3">
          <h3 className="font-bold text-lg mb-1">{caseItem.name}</h3>
          <p className="text-sm opacity-90 line-clamp-2">{caseItem.description}</p>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4">
          {caseItem.price ? (
            <>
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="font-bold">{caseItem.price} CR</span>
            </>
          ) : (
            <>
              <Tv className="w-4 h-4 text-green-400" />
              <span className="font-bold text-green-400">БЕСПЛАТНО</span>
            </>
          )}
        </div>

        <div className="mt-3 text-xs text-center opacity-70">
          {caseItem.type === 'ad' && 'За просмотр рекламы'}
          {caseItem.type === 'standard' && 'Стандартный кейс'}
          {caseItem.type === 'premium' && 'Премиум кейс'}
        </div>
      </div>
    </Card>
  );
};