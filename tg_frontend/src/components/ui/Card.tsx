import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  glow = false,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={hoverable ? { y: -4 } : {}}
      onClick={onClick}
      className={cn(
        'card-gradient rounded-2xl p-4 shadow-xl',
        glow && 'animate-pulse-glow',
        hoverable && 'cursor-pointer hover:shadow-2xl transition-shadow',
        className
      )}
    >
      {children}
    </motion.div>
  );
};