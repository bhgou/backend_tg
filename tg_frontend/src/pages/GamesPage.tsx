import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Dice5, CircleDollarSign, SlidersHorizontal, Coins } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useUserStore } from '../store/user.store';

const GamesPage: React.FC = () => {
  const navigate = useNavigate();
  const { premiumBalance } = useUserStore();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [gameResult, setGameResult] = useState<any>(null);

  const games = [
    {
      id: 'dice',
      name: 'Кости',
      icon: <Dice5 className="w-8 h-8" />,
      description: 'Угадайте, выпадет число выше или ниже',
      minBet: 10,
      maxBet: 1000,
      multiplier: 2.0,
      color: 'from-blue-600 to-cyan-500'
    },
    {
      id: 'roulette',
      name: 'Рулетка',
      icon: <CircleDollarSign className="w-8 h-8" />,
      description: 'Ставьте на цвет, число или диапазон',
      minBet: 50,
      maxBet: 5000,
      multiplier: 36.0,
      color: 'from-red-600 to-pink-500'
    },
    {
      id: 'slots',
      name: 'Слоты',
      icon: <SlidersHorizontal className="w-8 h-8" />,
      description: 'Крутите барабаны и собирайте комбинации',
      minBet: 20,
      maxBet: 2000,
      multiplier: 10.0,
      color: 'from-green-600 to-emerald-500'
    },
    {
      id: 'coinflip',
      name: 'Орёл и решка',
      icon: <Coins className="w-8 h-8" />,
      description: 'Простая игра на удачу',
      minBet: 10,
      maxBet: 1000,
      multiplier: 1.95,
      color: 'from-yellow-600 to-orange-500'
    }
  ];

  const handlePlayGame = (gameId: string) => {
    if (betAmount > premiumBalance) {
      alert('Недостаточно GC для ставки');
      return;
    }
    
    if (betAmount < games.find(g => g.id === gameId)?.minBet!) {
      alert(`Минимальная ставка: ${games.find(g => g.id === gameId)?.minBet} GC`);
      return;
    }

    // Здесь будет логика игры
    setSelectedGame(gameId);
    
    // Демо результат
    setTimeout(() => {
      const win = Math.random() > 0.4; // 60% шанс проигрыша
      const multiplier = games.find(g => g.id === gameId)?.multiplier || 2;
      const winAmount = win ? Math.floor(betAmount * multiplier) : 0;
      
      setGameResult({
        win,
        amount: winAmount,
        message: win ? `🎉 Вы выиграли ${winAmount} GC!` : '😔 Вы проиграли'
      });
    }, 2000);
  };

  const quickBets = [50, 100, 500, 1000];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <Button
        variant="glass"
        size="sm"
        icon={<ArrowLeft className="w-4 h-4" />}
        onClick={() => navigate('/')}
        className="mb-6"
      >
        Назад
      </Button>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Мини-игры</h1>
        <p className="text-gray-400 mb-8">Играйте и выигрывайте премиум валюту!</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {games.map((game) => (
            <Card
              key={game.id}
              className={`p-6 text-center cursor-pointer transition-transform hover:scale-105 ${
                selectedGame === game.id ? 'border-2 border-blue-500' : ''
              }`}
              onClick={() => setSelectedGame(game.id)}
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center`}>
                {game.icon}
              </div>
              <h3 className="font-bold text-lg mb-2">{game.name}</h3>
              <p className="text-sm text-gray-400 mb-3">{game.description}</p>
              <div className="text-xs text-gray-500">
                Множитель: {game.multiplier}x • Ставка: {game.minBet}-{game.maxBet} GC
              </div>
            </Card>
          ))}
        </div>

        {/* Панель управления игрой */}
        {selectedGame && (
          <Card className="p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Левая часть - настройки */}
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-4">Настройки игры</h3>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-400">Сумма ставки</label>
                    <span className="font-bold text-yellow-400">{betAmount} GC</span>
                  </div>
                  <input
                    type="range"
                    min={games.find(g => g.id === selectedGame)?.minBet}
                    max={games.find(g => g.id === selectedGame)?.maxBet}
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>{games.find(g => g.id === selectedGame)?.minBet} GC</span>
                    <span>{games.find(g => g.id === selectedGame)?.maxBet} GC</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-6">
                  {quickBets.map((bet) => (
                    <Button
                      key={bet}
                      variant="glass"
                      size="sm"
                      onClick={() => setBetAmount(bet)}
                      className={betAmount === bet ? 'bg-blue-600' : ''}
                    >
                      {bet} GC
                    </Button>
                  ))}
                </div>

                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Ваш баланс:</span>
                    <span className="font-bold text-purple-400">{premiumBalance} GC</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Возможный выигрыш:</span>
                    <span className="font-bold text-green-400">
                      {Math.floor(betAmount * (games.find(g => g.id === selectedGame)?.multiplier || 2))} GC
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="xl"
                  onClick={() => handlePlayGame(selectedGame)}
                  disabled={gameResult !== null}
                  className="w-full py-4"
                >
                  {gameResult !== null ? 'Игра идет...' : `Играть в ${games.find(g => g.id === selectedGame)?.name}`}
                </Button>
              </div>

              {/* Правая часть - результат */}
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-4">Результат</h3>
                
                {gameResult ? (
                  <div className={`p-6 rounded-xl text-center ${
                    gameResult.win 
                      ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30'
                      : 'bg-gradient-to-br from-red-900/30 to-pink-900/30 border border-red-500/30'
                  }`}>
                    <div className="text-6xl mb-4">
                      {gameResult.win ? '🎉' : '😔'}
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      {gameResult.message}
                    </div>
                    <div className="text-gray-300 mb-4">
                      {gameResult.win 
                        ? `Вы выиграли ${gameResult.amount} GC!` 
                        : 'Попробуйте еще раз!'}
                    </div>
                    <Button
                      variant="glass"
                      onClick={() => {
                        setGameResult(null);
                        setSelectedGame(null);
                      }}
                    >
                      Играть снова
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700 text-center">
                    <div className="text-6xl mb-4">🎮</div>
                    <div className="text-xl font-bold mb-2">Готовы играть?</div>
                    <div className="text-gray-300">
                      Сделайте ставку и нажмите кнопку "Играть"
                    </div>
                  </div>
                )}

                {/* Инструкция */}
                <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
                  <h4 className="font-bold mb-2">Как играть:</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Выберите сумму ставки</li>
                    <li>• Нажмите "Играть"</li>
                    <li>• Дождитесь результата</li>
                    <li>• Выигрыш зачисляется сразу</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Статистика игр */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Статистика игр</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Всего игр', value: '0', color: 'text-blue-400' },
              { label: 'Выиграно', value: '0', color: 'text-green-400' },
              { label: 'Проиграно', value: '0', color: 'text-red-400' },
              { label: 'Общий выигрыш', value: '0 GC', color: 'text-yellow-400' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 bg-gray-800/30 rounded-lg">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GamesPage;