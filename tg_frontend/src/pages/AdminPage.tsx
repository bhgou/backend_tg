import React from 'react';
import { 
  Users, DollarSign, Package, 
  Settings, Gamepad2
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const AdminPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Админ панель</h1>
        <p className="text-gray-400 mb-8">Управление приложением и пользователями</p>
        
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Добро пожаловать в админ панель</h2>
            <div className="text-right">
              <div className="text-sm text-gray-400">Режим:</div>
              <div className="font-bold text-green-400">Активен</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-800/30 rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-gray-400">Пользователей</div>
            </div>
            
            <div className="text-center p-4 bg-gray-800/30 rounded-lg">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <div className="text-2xl font-bold">0 ₽</div>
              <div className="text-sm text-gray-400">Доход</div>
            </div>
            
            <div className="text-center p-4 bg-gray-800/30 rounded-lg">
              <Package className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-gray-400">Кейсов открыто</div>
            </div>
            
            <div className="text-center p-4 bg-gray-800/30 rounded-lg">
              <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-gray-400">Игр сыграно</div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-bold mb-4">Быстрые действия</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="glass" fullWidth icon={<Users className="w-4 h-4" />}>
                Пользователи
              </Button>
              <Button variant="glass" fullWidth icon={<Package className="w-4 h-4" />}>
                Кейсы
              </Button>
              <Button variant="glass" fullWidth icon={<DollarSign className="w-4 h-4" />}>
                Платежи
              </Button>
              <Button variant="glass" fullWidth icon={<Settings className="w-4 h-4" />}>
                Настройки
              </Button>
            </div>
          </div>
        </Card>
        
        <div className="text-center text-gray-400 text-sm">
          <p>Админ панель находится в разработке</p>
          <p>Полная версия будет доступна в следующих обновлениях</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;