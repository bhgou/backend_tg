import React from 'react';
import { motion } from 'framer-motion';
import type { MotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Создаем тип, который исключает конфликтующие пропсы
type ButtonMotionProps = Omit<
  MotionProps & React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'
>;

interface ButtonProps extends ButtonMotionProps {
  variant?: 'primary' | 'secondary' | 'glass' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary': return 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90';
      case 'secondary': return 'bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700';
      case 'glass': return 'backdrop-blur-lg bg-white/10 border border-white/20 text-white hover:bg-white/20';
      case 'danger': return 'bg-gradient-to-r from-red-600 to-pink-500 text-white hover:opacity-90';
      case 'success': return 'bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:opacity-90';
      default: return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-3 py-1.5 text-sm rounded-lg';
      case 'md': return 'px-6 py-2.5 rounded-xl';
      case 'lg': return 'px-8 py-3.5 text-lg rounded-xl';
      case 'xl': return 'px-10 py-4 text-lg rounded-2xl';
      default: return 'px-6 py-2.5 rounded-xl';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        relative overflow-hidden group
        ${fullWidth ? 'w-full' : ''}
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${className}
      `}
      disabled={loading || disabled}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="flex items-center justify-center gap-2 relative z-10">
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : icon ? (
          <>
            <span>{icon}</span>
            {children}
          </>
        ) : (
          children
        )}
      </div>
    </motion.button>
  );
};