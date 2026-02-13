import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Clock, Trophy, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useUserStore } from '../store/user.store';

const GameMatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, addPremiumBalance } = useUserStore();
  const [match, setMatch] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [opponentFound, setOpponentFound] = useState(false);

  useEffect(() => {
    if (id === 'new') {
      startNewMatch();
    } else {
      loadMatch();
    }
  }, [id]);

  const startNewMatch = async () => {
    try {
      setSearching(true);
      setTimeLeft(30);

      // Имитация поиска соперника
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            findOpponent();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Start match error:', error);
      setSearching(false);
    }
  };

  const findOpponent = () => {
    // Имитация найденного соперника
    setTimeout(() => {
      setOpponentFound(true);
      setSearching(false);
      
      const mockMatch = {
        id: Math.random().toString(36).substr(2, 9),
        gameName: 'Кости',
        bet: 100,
        player1Username: user?.username,
        player2Username: 'opponent_' + Math.random().toString(36).substr(2, 5),
        status: 'playing'
      };
      
      setMatch(mockMatch);
    }, 2000);
  };

  const loadMatch = async () => {
    // Загрузка существующего матча
  };

  const playGame = async () => {
    if (!match) return;

    try {
      const playerRoll = Math.floor(Math.random() * 6) + 1;
      const opponentRoll = Math.floor(Math.random() * 6) + 1;
      
      const win = playerRoll > opponentRoll;
      const winAmount = win ? match.bet * 2 : 0;

      if (win) {
        addPremiumBalance(winAmount);
      }

      setMatch({
        ...match,
        result: {
          playerRoll,
          opponentRoll,
          win,
          winAmount
        },
        status: 'finished'
      });

    } catch (error) {
      console.error('Play game error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="glass"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/games')}
          className="mb-6"
        >
          Назад
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🎮 Игровой матч</h1>
          <p className="text-gray-400">Соревнуйтесь с другими игроками</p>
        </div>

        {searching ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-32 h-32 border-4 border-blue-500/30 rounded-full animate-ping absolute inset-0"></div>
                <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center">
                  <Users className="w-16 h-16 text-white" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2">Ищем соперника...</h2>
                <p className="text-gray-400 mb-4">
                  Ожидание других игроков для начала матча
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className="text-xl font-bold">{timeLeft} сек</span>
                </div>
              </div>

              <div className="w-full max-w-md">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Ожидание</span>
                  <span>3/10 игроков онлайн</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all"
                    style={{ width: `${((30 - timeLeft) / 30) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        ) : opponentFound && match ? (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">{match.gameName}</h2>
                  <p className="text-gray-400">Ставка: {match.bet} GC</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">{match.bet * 2} GC</div>
                  <div className="text-sm text-gray-400">Возможный выигрыш</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold">Вы</span>
                  </div>
                  <div className="font-bold">{match.player1Username}</div>
                  <div className="text-sm text-gray-400">Рейтинг: 1250</div>
                </div>

                <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold">VS</span>
                  </div>
                  <div className="font-bold">{match.player2Username}</div>
                  <div className="text-sm text-gray-400">Рейтинг: 1280</div>
                </div>
              </div>

              {match.status === 'playing' && !match.result ? (
                <Button
                  variant="primary"
                  size="xl"
                  fullWidth
                  onClick={playGame}
                  className="py-4"
                >
                  Сделать ход
                </Button>
              ) : match.result ? (
                <div className={`p-6 rounded-xl text-center ${
                  match.result.win 
                    ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30'
                    : 'bg-gradient-to-br from-red-900/30 to-pink-900/30 border border-red-500/30'
                }`}>
                  <div className="text-6xl mb-4">
                    {match.result.win ? '🎉' : '😔'}
                  </div>
                  <div className="text-2xl font-bold mb-2">
                    {match.result.win ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
                  </div>
                  <div className="text-gray-300 mb-4">
                    {match.result.playerRoll} vs {match.result.opponentRoll}
                  </div>
                  {match.result.win && (
                    <div className="text-3xl font-bold text-yellow-400 mb-4">
                      +{match.result.winAmount} GC
                    </div>
                  )}
                  <div className="flex gap-3 justify-center">
                    <Button variant="glass" onClick={() => navigate('/games')}>
                      К играм
                    </Button>
                    <Button variant="primary" onClick={() => navigate('/game/match/new')}>
                      Играть снова
                    </Button>
                  </div>
                </div>
              ) : null}
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Статистика матча
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-800/30 rounded">
                  <div className="text-lg font-bold text-blue-400">1</div>
                  <div className="text-sm text-gray-400">Матчей сыграно</div>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded">
                  <div className="text-lg font-bold text-green-400">50%</div>
                  <div className="text-sm text-gray-400">Винрейт</div>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded">
                  <div className="text-lg font-bold text-yellow-400">100</div>
                  <div className="text-sm text-gray-400">GC заработано</div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
            <h2 className="text-xl font-bold mb-2">Матч не найден</h2>
            <p className="text-gray-400 mb-6">
              Не удалось найти информацию о матче
            </p>
            <Button variant="primary" onClick={() => navigate('/games')}>
              Вернуться к играм
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GameMatchPage;