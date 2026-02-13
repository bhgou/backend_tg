import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ExternalLink, Award, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useUserStore } from '../store/user.store';

const SponsorsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addBalance, addPremiumBalance, addFragments } = useUserStore();
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [subscribed, setSubscribed] = useState<Record<number, boolean>>({});
  const [claimed, setClaimed] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = () => {
    const demoSponsors = [
      {
        id: 1,
        name: 'CS:GO Empire',
        username: 'csgoempire',
        invite_link: 'https://t.me/csgoempire',
        reward_type: 'premium',
        reward_value: 100,
        premium_reward: 200,
        description: 'Крупнейшая площадка для торговли скинами',
        subscribers: 1234,
        priority: 1
      },
      {
        id: 2,
        name: 'CSGORoll',
        username: 'csgoroll',
        invite_link: 'https://t.me/csgoroll',
        reward_type: 'balance',
        reward_value: 500,
        premium_reward: 100,
        description: 'Открывай кейсы и выигрывай скины',
        subscribers: 987,
        priority: 2
      },
      {
        id: 3,
        name: 'HellCase',
        username: 'hellcase',
        invite_link: 'https://t.me/hellcase',
        reward_type: 'fragment',
        reward_value: 3,
        premium_reward: 5,
        description: 'Лучшие кейсы и акции каждый день',
        subscribers: 654,
        priority: 3
      },
      {
        id: 4,
        name: 'CSGOFast',
        username: 'csgofast',
        invite_link: 'https://t.me/csgofast',
        reward_type: 'premium',
        reward_value: 50,
        premium_reward: 100,
        description: 'Быстрая торговля скинами',
        subscribers: 432,
        priority: 4
      }
    ];
    setSponsors(demoSponsors);
  };

  const handleSubscribe = (sponsorId: number) => {
    const sponsor = sponsors.find(s => s.id === sponsorId);
    if (sponsor?.invite_link) {
      window.open(sponsor.invite_link, '_blank');
    }
    
    setTimeout(() => {
      setSubscribed(prev => ({ ...prev, [sponsorId]: true }));
    }, 1000);
  };

  const handleClaimReward = (sponsor: any) => {
    if (!subscribed[sponsor.id]) {
      alert('Сначала подпишитесь на канал!');
      return;
    }
    
    if (claimed[sponsor.id]) {
      alert('Вы уже получали награду за этот канал!');
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      switch (sponsor.reward_type) {
        case 'balance':
          addBalance(sponsor.reward_value);
          break;
        case 'premium':
          addPremiumBalance(sponsor.premium_reward);
          break;
        case 'fragment':
          addFragments(sponsor.reward_value);
          break;
      }
      
      setClaimed(prev => ({ ...prev, [sponsor.id]: true }));
      setLoading(false);
      
      const rewardText = sponsor.reward_type === 'balance' ? `${sponsor.reward_value} CR` :
                       sponsor.reward_type === 'premium' ? `${sponsor.premium_reward} GC` :
                       `${sponsor.reward_value} фрагментов`;
      alert(`🎉 Награда получена! +${rewardText}`);
    }, 1500);
  };

  const getRewardText = (sponsor: any) => {
    switch (sponsor.reward_type) {
      case 'balance':
        return `${sponsor.reward_value} CR`;
      case 'premium':
        return `${sponsor.premium_reward} GC`;
      case 'fragment':
        return `${sponsor.reward_value} фрагментов`;
      default:
        return 'Награда';
    }
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
        <h1 className="text-3xl font-bold mb-2 text-center">Спонсоры</h1>
        <p className="text-gray-400 text-center mb-8">
          Подпишитесь на спонсоров и получайте награды!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {sponsors.map((sponsor) => (
            <Card key={sponsor.id} className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{sponsor.name}</h3>
                  <p className="text-gray-400 text-sm mb-2">@{sponsor.username}</p>
                  <p className="text-sm text-gray-300">{sponsor.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{sponsor.subscribers} подписчиков</span>
                  </div>
                </div>
              </div>

              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-lg">Награда за подписку</div>
                    <div className="text-sm text-gray-400">
                      {sponsor.reward_type === 'balance' && 'Основной баланс'}
                      {sponsor.reward_type === 'premium' && 'Премиум валюта'}
                      {sponsor.reward_type === 'fragment' && 'Фрагменты скинов'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">
                      {getRewardText(sponsor)}
                    </div>
                    {sponsor.premium_reward > 0 && sponsor.reward_type === 'premium' && (
                      <div className="text-sm text-green-400">
                        +{sponsor.premium_reward} GC
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant={subscribed[sponsor.id] ? 'success' : 'primary'}
                  fullWidth
                  onClick={() => handleSubscribe(sponsor.id)}
                  icon={subscribed[sponsor.id] ? <Check className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                >
                  {subscribed[sponsor.id] ? 'Подписан' : 'Подписаться'}
                </Button>
                
                <Button
                  variant="glass"
                  fullWidth
                  loading={loading}
                  onClick={() => handleClaimReward(sponsor)}
                  disabled={!subscribed[sponsor.id] || claimed[sponsor.id]}
                >
                  {claimed[sponsor.id] ? 'Получено' : 'Получить награду'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Как получить награды?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="text-3xl mb-2">1️⃣</div>
              <div className="font-bold mb-2">Подпишитесь</div>
              <div className="text-sm text-gray-400">
                Нажмите кнопку "Подписаться" и присоединитесь к каналу
              </div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">2️⃣</div>
              <div className="font-bold mb-2">Вернитесь</div>
              <div className="text-sm text-gray-400">
                Вернитесь в приложение и нажмите "Получить награду"
              </div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">3️⃣</div>
              <div className="font-bold mb-2">Получите награду</div>
              <div className="text-sm text-gray-400">
                Награда автоматически зачислится на ваш баланс
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold text-green-400">
                {Object.values(claimed).filter(Boolean).length}/{sponsors.length}
              </div>
              <div className="text-gray-400">Получено наград</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">
                {Object.values(claimed).filter(Boolean).length * 100} CR
              </div>
              <div className="text-gray-400">Всего заработано</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SponsorsPage;