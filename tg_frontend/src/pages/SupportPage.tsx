import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Mail, Clock, HelpCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const SupportPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const faqItems = [
    {
      question: 'Как пополнить баланс?',
      answer: 'Перейдите в раздел "Пополнить", выберите сумму и способ оплаты. После успешной оплаты баланс пополнится автоматически.'
    },
    {
      question: 'Как вывести реальные скины?',
      answer: 'Соберите необходимое количество фрагментов для скина, перейдите в раздел "Реальные скины", выберите скин и укажите Steam Trade Link.'
    },
    {
      question: 'Что такое фрагменты?',
      answer: 'Фрагменты - это части скина. Собрав необходимое количество фрагментов, вы можете получить целый скин.'
    },
    {
      question: 'Как работает реферальная программа?',
      answer: 'Приглашайте друзей по своей реферальной ссылке. За каждого активного реферала вы получаете 200 CR.'
    },
    {
      question: 'Сколько времени занимает обработка вывода?',
      answer: 'Вывод скинов обрабатывается в течение 24 часов после подтверждения заявки.'
    },
    {
      question: 'Есть ли комиссия за вывод?',
      answer: 'Да, за каждый вывод взимается комиссия в премиум валюте (GC). Размер комиссии зависит от редкости скина.'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      setSubject('');
      setMessage('');
      
      setTimeout(() => {
        setSent(false);
      }, 3000);
    }, 1500);
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
        <h1 className="text-3xl font-bold mb-2 text-center">Поддержка</h1>
        <p className="text-gray-400 text-center mb-8">Помощь и ответы на вопросы</p>

        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'faq' ? 'primary' : 'glass'}
            icon={<HelpCircle className="w-4 h-4" />}
            onClick={() => setActiveTab('faq')}
          >
            FAQ
          </Button>
          <Button
            variant={activeTab === 'contact' ? 'primary' : 'glass'}
            icon={<MessageCircle className="w-4 h-4" />}
            onClick={() => setActiveTab('contact')}
          >
            Написать в поддержку
          </Button>
        </div>

        {activeTab === 'faq' ? (
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{item.question}</h3>
                    <p className="text-gray-300">{item.answer}</p>
                  </div>
                </div>
              </Card>
            ))}

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-bold">Время работы поддержки</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Понедельник - Пятница:</span>
                  <span className="font-bold">10:00 - 22:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Суббота - Воскресенье:</span>
                  <span className="font-bold">12:00 - 20:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Среднее время ответа:</span>
                  <span className="font-bold text-green-400">15-30 минут</span>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-6">
            {sent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Сообщение отправлено!</h2>
                <p className="text-gray-400">
                  Мы ответим вам в ближайшее время. Среднее время ответа: 15-30 минут.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <Mail className="w-6 h-6 text-blue-400" />
                  <div>
                    <h2 className="text-xl font-bold">Написать в поддержку</h2>
                    <p className="text-gray-400">Ответим в течение 30 минут</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Тема обращения
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                      required
                    >
                      <option value="">Выберите тему</option>
                      <option value="payment">Проблема с оплатой</option>
                      <option value="withdrawal">Вывод скинов</option>
                      <option value="bug">Техническая проблема</option>
                      <option value="account">Аккаунт</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      Подробное описание проблемы
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                      placeholder="Опишите вашу проблему подробно..."
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <div className="text-sm text-gray-400 mb-2">
                      Прикрепите скриншоты (макс. 3 файла)
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer">
                        <div className="p-4 border-2 border-dashed border-gray-700 rounded-lg text-center hover:border-gray-600 transition-colors">
                          <div className="text-gray-400">+ Добавить файл</div>
                          <div className="text-xs text-gray-500">PNG, JPG до 5MB</div>
                        </div>
                        <input type="file" className="hidden" multiple accept="image/*" />
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    size="lg"
                    loading={loading}
                  >
                    Отправить сообщение
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-bold mb-1">Полезная информация:</div>
                      <ul className="space-y-1 text-gray-300">
                        <li>• Укажите ваш Telegram ID для быстрого ответа</li>
                        <li>• При проблемах с оплатой укажите номер платежа</li>
                        <li>• Для вывода скинов укажите Steam Trade Link</li>
                        <li>• Прикрепите скриншоты для быстрого решения проблемы</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>
        )}

        <Card className="p-6 mt-6">
          <h3 className="text-xl font-bold mb-4">📞 Контакты</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="text-3xl mb-2">💬</div>
              <div className="font-bold mb-1">Telegram</div>
              <div className="text-sm text-gray-400">@skin_factory_support</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">📧</div>
              <div className="font-bold mb-1">Email</div>
              <div className="text-sm text-gray-400">support@skinfactory.com</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">🌐</div>
              <div className="font-bold mb-1">Сайт</div>
              <div className="text-sm text-gray-400">skinfactory.com</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SupportPage;