import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Coins } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  title?: string;
  currency?: string;
  icon?: React.ReactNode;
  color?: 'yellow' | 'purple' | 'blue' | 'green';
  className?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ 
  balance, 
  title = 'Баланс',
  currency = 'CR',
  icon,
  color = 'yellow',
  className 
}) => {
  const colorClasses = {
    yellow: 'from-yellow-500 to-orange-500',
    purple: 'from-purple-500 to-pink-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`glass-effect rounded-2xl p-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-gradient-to-br ${colorClasses[color]} rounded-lg`}>
            {icon || <Coins className="w-6 h-6 text-white" />}
          </div>
          <div>
            <div className="text-sm text-gray-400">{title}</div>
            <div className="text-2xl font-bold text-white">
              {balance.toLocaleString()} {currency}
            </div>
          </div>
        </div>
        <Wallet className="w-6 h-6 text-gray-400" />
      </div>
    </motion.div>
  );
};