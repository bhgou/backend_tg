import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Users, Tv, Share2 } from 'lucide-react';
import { Button } from './ui/Button';

interface QuickActionsProps {
  onWatchAd: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onWatchAd }) => {
  const actions = [
    {
      icon: <Tv className="w-5 h-5" />,
      label: 'Смотреть рекламу',
      onClick: onWatchAd,
      color: 'from-purple-600 to-pink-500',
    },
    {
      icon: <Gift className="w-5 h-5" />,
      label: 'Рефералы',
      onClick: () => {},
      color: 'from-blue-600 to-cyan-500',
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Пригласить',
      onClick: () => {},
      color: 'from-green-600 to-emerald-500',
    },
    {
      icon: <Share2 className="w-5 h-5" />,
      label: 'Поделиться',
      onClick: () => {},
      color: 'from-orange-600 to-red-500',
    },
  ];

  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-4">Быстрые действия</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant="glass"
              className={`w-full h-20 flex flex-col items-center justify-center gap-2
                bg-gradient-to-br ${action.color}`}
              onClick={action.onClick}
            >
              {action.icon}
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};