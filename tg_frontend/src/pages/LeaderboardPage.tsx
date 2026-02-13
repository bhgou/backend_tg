import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Crown, TrendingUp, Award, Star } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [leaderboardType, setLeaderboardType] = useState<'daily' | 'weekly' | 'alltime'>('daily');
  const [players, setPlayers] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [leaderboardType]);

  const loadLeaderboard = () => {
    // Тестовые данные
    const demoPlayers = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      username: `player${i + 1}`,
      rank: i + 1,
      earned: 10000 - (i * 200),
      casesOpened: 100 - (i * 2),
      level: Math.floor(Math.random() * 50) + 1,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=player${i + 1}`
    }));

    setPlayers(demoPlayers);
    setUserRank(15); // Пример: пользователь на 15 месте
    setUserStats({
      earned: 7500,
      casesOpened: 85,
      level: 25,
      dailyChange: '+2'
    });
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank <= 3) return 'text-orange-400';
    if (rank <= 10) return 'text-purple-400';
    return 'text-gray-400';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank <= 3) return <Star className="w-5 h-5 text-orange-400" />;
    return <span className="text-gray-400">{rank}</span>;
  };

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

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Таблица лидеров</h1>
          <p className="text-gray-400">Топ игроков по заработанным CR</p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={leaderboardType === 'daily' ? 'primary' : 'glass'}
            onClick={() => setLeaderboardType('daily')}
          >
            За день
          </Button>
          <Button
            variant={leaderboardType === 'weekly' ? 'primary' : 'glass'}
            onClick={() => setLeaderboardType('weekly')}
          >
            За неделю
          </Button>
          <Button
            variant={leaderboardType === 'alltime' ? 'primary' : 'glass'}
            onClick={() => setLeaderboardType('alltime')}
          >
            Все время
          </Button>
        </div>

        {/* Топ 3 игрока */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {players.slice(0, 3).map((player, index) => (
            <Card key={player.id} className="p-4 text-center relative">
              {index === 0 && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <div className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    🥇 ПЕРВОЕ МЕСТО
                  </div>
                </div>
              )}
              {index === 1 && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gray-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                    🥈 ВТОРОЕ МЕСТО
                  </div>
                </div>
              )}
              {index === 2 && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <div className="bg-orange-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                    🥉 ТРЕТЬЕ МЕСТО
                  </div>
                </div>
              )}

              <div className="mb-4">
                <div className={`text-5xl font-bold ${getRankColor(player.rank)}`}>
                  {player.rank}
                </div>
                <div className="w-20 h-20 mx-auto mt-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full border-2 border-yellow-500/50" />
              </div>

              <h3 className="font-bold text-lg mb-1">@{player.username}</h3>
              <div className="text-yellow-400 font-bold text-xl mb-2">
                {player.earned.toLocaleString()} CR
              </div>
              <div className="text-sm text-gray-400">
                {player.casesOpened} кейсов • Уровень {player.level}
              </div>
            </Card>
          ))}
        </div>

        {/* Таблица лидеров */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4 text-left">Место</th>
                  <th className="py-3 px-4 text-left">Игрок</th>
                  <th className="py-3 px-4 text-left">Заработано</th>
                  <th className="py-3 px-4 text-left">Кейсы</th>
                  <th className="py-3 px-4 text-left">Уровень</th>
                </tr>
              </thead>
              <tbody>
                {players.slice(3, 20).map((player) => (
                  <tr 
                    key={player.id}
                    className={`border-b border-gray-800 hover:bg-gray-800/50 ${
                      userRank === player.rank ? 'bg-blue-500/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(player.rank)}
                        <span className={getRankColor(player.rank)}>
                          #{player.rank}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full" />
                        <span className="font-medium">@{player.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-yellow-400">
                        {player.earned.toLocaleString()} CR
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-300">{player.casesOpened}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold">{player.level}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Статистика пользователя */}
        {userRank && userStats && (
          <Card className="p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-bold">Ваше место</h2>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getRankColor(userRank)}`}>
                  #{userRank}
                </div>
                <div className="text-sm text-gray-400">
                  {userStats.dailyChange} за день
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-800/30 rounded">
                <div className="text-2xl font-bold text-yellow-400">
                  {userStats.earned.toLocaleString()} CR
                </div>
                <div className="text-sm text-gray-400">Заработано</div>
              </div>
              <div className="text-center p-3 bg-gray-800/30 rounded">
                <div className="text-2xl font-bold text-blue-400">
                  {userStats.casesOpened}
                </div>
                <div className="text-sm text-gray-400">Кейсов открыто</div>
              </div>
              <div className="text-center p-3 bg-gray-800/30 rounded">
                <div className="text-2xl font-bold text-purple-400">
                  {userStats.level}
                </div>
                <div className="text-sm text-gray-400">Уровень</div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Button variant="glass" onClick={() => window.scrollTo(0, 0)}>
                <Award className="w-4 h-4 mr-2" />
                Посмотреть топ игроков
              </Button>
            </div>
          </Card>
        )}

        {/* Награды за места */}
        <Card className="p-6 mt-6">
          <h3 className="text-xl font-bold mb-4">🏆 Награды за места</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-yellow-900/30 to-yellow-500/10 rounded-xl">
              <div className="text-4xl mb-2">🥇</div>
              <div className="font-bold mb-1">1 место</div>
              <div className="text-yellow-400 font-bold">10,000 CR</div>
              <div className="text-sm text-gray-400">+ легендарный кейс</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-gray-700/30 to-gray-500/10 rounded-xl">
              <div className="text-4xl mb-2">🥈</div>
              <div className="font-bold mb-1">2 место</div>
              <div className="text-yellow-400 font-bold">5,000 CR</div>
              <div className="text-sm text-gray-400">+ премиум кейс</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-900/30 to-orange-500/10 rounded-xl">
              <div className="text-4xl mb-2">🥉</div>
              <div className="font-bold mb-1">3 место</div>
              <div className="text-yellow-400 font-bold">2,500 CR</div>
              <div className="text-sm text-gray-400">+ стандартный кейс</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-900/30 to-blue-500/10 rounded-xl">
              <div className="text-4xl mb-2">🏅</div>
              <div className="font-bold mb-1">Топ 10</div>
              <div className="text-yellow-400 font-bold">1,000 CR</div>
              <div className="text-sm text-gray-400">каждому</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LeaderboardPage;