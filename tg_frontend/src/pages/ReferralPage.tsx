import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Share2, Copy, Gift, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useUserStore } from '../store/user.store';

const ReferralPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = () => {
    // Тестовые данные
    const demoReferrals = [
      { id: 1, username: 'user1', joined: '2 дня назад', status: 'active', earned: 200 },
      { id: 2, username: 'user2', joined: '5 дней назад', status: 'active', earned: 200 },
      { id: 3, username: 'user3', joined: '1 неделю назад', status: 'pending', earned: 0 },
      { id: 4, username: 'user4', joined: '2 недели назад', status: 'active', earned: 200 },
      { id: 5, username: 'user5', joined: '3 недели назад', status: 'active', earned: 200 },
    ];
    setReferrals(demoReferrals);
  };

  const copyReferralLink = () => {
    const link = `https://t.me/YOUR_BOT_USERNAME?start=${user?.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    const text = `🎮 Присоединяйся к Skin Factory!\n\nОткрывай кейсы, играй в игры и получай реальные скины CS:GO!\n\nИспользуй мой реферальный код: ${user?.referralCode}\n\n🔗 Ссылка: https://t.me/YOUR_BOT_USERNAME?start=${user?.referralCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Skin Factory',
        text: text,
        url: `https://t.me/YOUR_BOT_USERNAME?start=${user?.referralCode}`
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('Текст скопирован в буфер обмена!');
    }
  };

  const totalEarned = referrals.reduce((sum, ref) => sum + ref.earned, 0);
  const activeReferrals = referrals.filter(ref => ref.status === 'active').length;

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
        <h1 className="text-3xl font-bold mb-2 text-center">Реферальная программа</h1>
        <p className="text-gray-400 text-center mb-8">Приглашай друзей и получай награды!</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{activeReferrals}</div>
            <div className="text-sm text-gray-400">Активных рефералов</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{totalEarned} CR</div>
            <div className="text-sm text-gray-400">Всего заработано</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">200 CR</div>
            <div className="text-sm text-gray-400">За каждого реферала</div>
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold">Ваша реферальная ссылка</h2>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-400">Код:</span>
              <span className="font-bold text-lg">{user?.referralCode || 'XXXXXX'}</span>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg break-all mb-4">
              https://t.me/YOUR_BOT_USERNAME?start={user?.referralCode || 'XXXXXX'}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant={copied ? 'success' : 'primary'}
              icon={<Copy className="w-4 h-4" />}
              onClick={copyReferralLink}
              fullWidth
            >
              {copied ? 'Скопировано!' : 'Копировать ссылку'}
            </Button>
            <Button
              variant="glass"
              icon={<Share2 className="w-4 h-4" />}
              onClick={shareReferral}
              fullWidth
            >
              Поделиться
            </Button>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold">Уровни реферальной программы</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="font-bold">1</span>
                </div>
                <div>
                  <div className="font-bold">Начальный</div>
                  <div className="text-sm text-gray-400">1-5 рефералов</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-yellow-400">200 CR</div>
                <div className="text-sm text-gray-400">за каждого</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="font-bold">5</span>
                </div>
                <div>
                  <div className="font-bold">Продвинутый</div>
                  <div className="text-sm text-gray-400">6-10 рефералов</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-yellow-400">300 CR</div>
                <div className="text-sm text-gray-400">за каждого</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="font-bold">10</span>
                </div>
                <div>
                  <div className="font-bold">Эксперт</div>
                  <div className="text-sm text-gray-400">11+ рефералов</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-yellow-400">500 CR</div>
                <div className="text-sm text-gray-400">за каждого</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold">Ваши рефералы</h2>
          </div>

          {referrals.length > 0 ? (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded">
                  <div>
                    <div className="font-bold">@{referral.username}</div>
                    <div className="text-sm text-gray-400">Присоединился {referral.joined}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      referral.status === 'active' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {referral.earned} CR
                    </div>
                    <div className="text-sm text-gray-400">
                      {referral.status === 'active' ? 'Активен' : 'В ожидании'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              У вас еще нет рефералов
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ReferralPage;