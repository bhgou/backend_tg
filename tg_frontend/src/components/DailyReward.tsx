// components/DailyReward.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Calendar, Clock, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

// Удалите или закомментируйте конфликтующие объявления:
// export interface CaseItem { ... }
// export interface Case { ... }

// Вместо этого используйте импорт, если нужно:
// import type { Case, CaseItem } from '../types/cases';

interface DailyRewardProps {
  onClaim: (reward: number) => void;
}

export const DailyReward: React.FC<DailyRewardProps> = ({ onClaim }) => {
  const [claimed, setClaimed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [streak, setStreak] = useState(3);

  useEffect(() => {
    // Симуляция времени до следующей награды
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClaim = () => {
    if (!claimed) {
      const reward = 100 + (streak * 50);
      onClaim(reward);
      setClaimed(true);
      setStreak(prev => prev + 1);
      
      // Сброс через 24 часа
      setTimeout(() => {
        setClaimed(false);
        setTimeLeft(24 * 60 * 60);
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-bold">Ежедневная награда</h2>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {[...Array(7)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`aspect-square rounded-lg flex flex-col items-center justify-center ${
              index < streak
                ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            <div className="text-xs">День</div>
            <div className="font-bold">{index + 1}</div>
            {index < streak && (
              <Check className="w-3 h-3 mt-1" />
            )}
          </motion.div>
        ))}
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-400" />
            <span>Сегодняшняя награда:</span>
          </div>
          <div className="text-xl font-bold text-yellow-400">
            {100 + (streak * 50)} CR
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Стрик: {streak} дней</span>
          <span className="mx-2">•</span>
          <span>Завтра: {100 + ((streak + 1) * 50)} CR</span>
        </div>
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={handleClaim}
        disabled={claimed}
        className={claimed ? 'bg-green-600 hover:bg-green-700' : ''}
      >
        {claimed ? (
          <>
            <Check className="w-5 h-5 mr-2" />
            Получено! (+{100 + (streak * 50)} CR)
          </>
        ) : timeLeft > 0 ? (
          `Следующая награда через: ${formatTime(timeLeft)}`
        ) : (
          'Получить награду'
        )}
      </Button>
    </Card>
  );
};