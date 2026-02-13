import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

interface CaseOpeningProps {
  isOpen: boolean;
  onComplete: (item: any) => void;
  caseType: 'ad' | 'standard' | 'premium';
}

export const CaseOpeningAnimation: React.FC<CaseOpeningProps> = ({
  isOpen,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'idle' | 'opening' | 'reveal' | 'complete'>('idle');
  const [reward, setReward] = useState<any>(null);

  const openCase = async () => {
    setPhase('opening');
    
    // Симуляция открытия кейса
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Моковая награда
    const mockReward = {
      id: Math.random().toString(36),
      name: 'AK-47 | Redline',
      rarity: 'classified',
      price: 45.50,
      imageUrl: '/skins/ak47_redline.png'
    };
    
    setReward(mockReward);
    setPhase('reveal');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setPhase('complete');
    onComplete(mockReward);
  };

  useEffect(() => {
    if (isOpen && phase === 'idle') {
      openCase();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <AnimatePresence mode="wait">
        {phase === 'opening' && (
          <motion.div
            initial={{ scale: 0.5, rotate: -180 }}
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: 0,
              transition: {
                duration: 2,
                times: [0, 0.5, 1]
              }
            }}
            className="relative"
          >
            <div className="w-64 h-64 bg-gradient-to-br from-yellow-500 to-red-600 rounded-2xl shadow-2xl shadow-yellow-500/50">
              <div className="absolute inset-4 bg-gradient-to-tr from-gray-900 to-black rounded-xl border-2 border-yellow-400/30" />
              
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                  initial={{ 
                    x: '50%', 
                    y: '50%',
                    scale: 0 
                  }}
                  animate={{ 
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.05
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {phase === 'reveal' && reward && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center"
          >
            <div className="glass-effect rounded-3xl p-8 max-w-md">
              <div className="text-2xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                ПОЗДРАВЛЯЕМ!
              </div>
              
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <div className="w-48 h-48 mx-auto bg-gradient-to-br from-gray-900 to-black rounded-2xl border-2 border-yellow-500/30 p-4">
                  <div className="w-full h-full bg-gray-800 rounded-lg" />
                </div>
                <div className="mt-4 text-xl font-semibold">{reward.name}</div>
                <div className="text-yellow-400">{reward.rarity.toUpperCase()}</div>
              </motion.div>

              <div className="flex gap-4 justify-center">
                <Button variant="glass">Добавить в инвентарь</Button>
                <Button variant="primary">Открыть ещё кейс</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};