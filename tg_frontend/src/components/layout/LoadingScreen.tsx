import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Загрузка...' 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-500/30 rounded-full animate-ping absolute inset-0"></div>
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 relative"></div>
        </div>
        <p className="text-xl font-medium mb-2">{message}</p>
        <p className="text-sm text-gray-400">Пожалуйста, подождите</p>
      </div>
    </div>
  );
};