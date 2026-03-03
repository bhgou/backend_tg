/**
 * Seed файл для заполнения базы данных тестовыми данными
 * Используйте: npx prisma db seed
 * 
 * ИЛИ используйте SQL версию в database.ts для прямого pg подключения
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Очищаем существующие данные (опционально)
  await prisma.gameSession.deleteMany();
  await prisma.marketListing.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.caseDrop.deleteMany();
  await prisma.case.deleteMany();
  await prisma.skin.deleteMany();
  await prisma.user.deleteMany();

  // Создаем скины
  console.log('📦 Создаем скины...');
  const skins = await prisma.skin.createManyAndReturn({
    data: [
      {
        name: 'AK-47 | Redline',
        weapon: 'AK-47',
        rarity: 'classified',
        price: 4550,
        fragmentsRequired: 5,
        imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/ak47_redline',
        isTradable: true
      },
      {
        name: 'AWP | Asiimov',
        weapon: 'AWP',
        rarity: 'covert',
        price: 12000,
        fragmentsRequired: 10,
        imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/awp_asiimov',
        isTradable: true
      },
      {
        name: 'Glock-18 | Water Elemental',
        weapon: 'Glock-18',
        rarity: 'mil-spec',
        price: 550,
        fragmentsRequired: 5,
        imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/glock_water',
        isTradable: true
      },
      {
        name: 'M4A1-S | Guardian',
        weapon: 'M4A1-S',
        rarity: 'restricted',
        price: 1200,
        fragmentsRequired: 5,
        imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/m4a1_guardian',
        isTradable: true
      },
      {
        name: 'Desert Eagle | Blaze',
        weapon: 'Desert Eagle',
        rarity: 'classified',
        price: 8500,
        fragmentsRequired: 8,
        imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/de_blaze',
        isTradable: true
      },
      {
        name: 'M4A4 | Howl',
        weapon: 'M4A4',
        rarity: 'contraband',
        price: 250000,
        fragmentsRequired: 20,
        imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/m4a4_howl',
        isTradable: true
      },
      {
        name: 'Karambit | Fade',
        weapon: 'Karambit',
        rarity: 'covert',
        price: 320000,
        fragmentsRequired: 25,
        imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/karambit_fade',
        isTradable: true
      },
      {
        name: 'AWP | Dragon Lore',
        weapon: 'AWP',
        rarity: 'covert',
        price: 500000,
        fragmentsRequired: 30,
        imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/awp_dlore',
        isTradable: true
      }
    ]
  });

  console.log(`✅ Создано ${skins.length} скинов`);

  // Создаем кейсы
  console.log('🎁 Создаем кейсы...');
  
  const adCase = await prisma.case.create({
    data: {
      name: 'Бесплатный кейс',
      type: 'free',
      description: 'Открывается после просмотра рекламы',
      isActive: true
    }
  });

  const standardCase = await prisma.case.create({
    data: {
      name: 'Стандартный кейс',
      type: 'standard',
      price: 500,
      premiumPrice: 50,
      description: 'Обычные и редкие скины',
      isActive: true
    }
  });

  const premiumCase = await prisma.case.create({
    data: {
      name: 'Премиум кейс',
      type: 'premium',
      price: 1500,
      premiumPrice: 100,
      description: 'Редкие и легендарные скины',
      isActive: true
    }
  });

  const fragmentCase = await prisma.case.create({
    data: {
      name: 'Фрагментный кейс',
      type: 'fragment',
      price: 1000,
      premiumPrice: 80,
      description: 'Фрагменты реальных скинов',
      isActive: true
    }
  });

  // Создаем дропы для кейсов
  console.log('🎲 Создаем дропы для кейсов...');
  
  // Дропы для стандартного кейса
  const standardDrops = [
    { skinId: skins[2].id, probability: 0.50 }, // Glock-18 (50%)
    { skinId: skins[3].id, probability: 0.30 }, // M4A1-S (30%)
    { skinId: skins[0].id, probability: 0.15 }, // AK-47 (15%)
    { skinId: skins[4].id, probability: 0.05 }  // Desert Eagle (5%)
  ];

  for (const drop of standardDrops) {
    await prisma.caseDrop.create({
      data: {
        caseId: standardCase.id,
        skinId: drop.skinId,
        probability: drop.probability,
        isFragment: false,
        fragments: 1,
        dropType: 'regular',
        rewardType: 'skin'
      }
    });
  }

  // Дропы для премиум кейса
  const premiumDrops = [
    { skinId: skins[0].id, probability: 0.40 }, // AK-47 (40%)
    { skinId: skins[1].id, probability: 0.25 }, // AWP (25%)
    { skinId: skins[4].id, probability: 0.20 }, // Desert Eagle (20%)
    { skinId: skins[0].id, probability: 0.10, isFragment: true, fragments: 5 },
    { skinId: skins[1].id, probability: 0.05, isFragment: true, fragments: 3 }
  ];

  for (const drop of premiumDrops) {
    await prisma.caseDrop.create({
      data: {
        caseId: premiumCase.id,
        skinId: drop.skinId,
        probability: drop.probability,
        isFragment: drop.isFragment || false,
        fragments: drop.fragments || 1,
        dropType: drop.isFragment ? 'fragment' : 'regular',
        rewardType: drop.isFragment ? 'fragment' : 'skin'
      }
    });
  }

  // Фрагменты для фрагментного кейса
  for (const skin of skins) {
    await prisma.caseDrop.create({
      data: {
        caseId: fragmentCase.id,
        skinId: skin.id,
        probability: 0.25,
        isFragment: true,
        fragments: Math.floor(Math.random() * 3) + 1,
        dropType: 'fragment',
        rewardType: 'fragment'
      }
    });
  }

  // Создаем тестового пользователя
  console.log('👤 Создаем тестового пользователя...');
  
  const testUser = await prisma.user.create({
    data: {
      telegramId: BigInt('123456789'),
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      balance: 5000,
      premiumBalance: 1000,
      totalEarned: 10000,
      dailyStreak: 5,
      referralCode: 'test_referral'
    }
  });

  // Создаем админа
  const adminUser = await prisma.user.create({
    data: {
      telegramId: BigInt('777777777'),
      username: 'admin',
      firstName: 'Администратор',
      lastName: 'Системы',
      balance: 100000,
      premiumBalance: 50000,
      isAdmin: true,
      referralCode: 'admin_referral'
    }
  });

  // Добавляем скины в инвентарь тестового пользователя
  await prisma.inventoryItem.createMany({
    data: [
      {
        userId: testUser.id,
        skinId: skins[2].id, // Glock-18
        name: skins[2].name,
        rarity: skins[2].rarity,
        imageUrl: skins[2].imageUrl,
        isFragment: false,
        fragments: 1,
        price: skins[2].price,
        isMarketable: true
      },
      {
        userId: testUser.id,
        skinId: skins[0].id, // AK-47 (фрагменты)
        name: skins[0].name,
        rarity: skins[0].rarity,
        imageUrl: skins[0].imageUrl,
        isFragment: true,
        fragments: 8, // 8 из 15 нужных
        price: skins[0].price,
        isMarketable: false
      }
    ]
  });

  // Создаем тестовые транзакции
  await prisma.transaction.createMany({
    data: [
      {
        userId: testUser.id,
        type: 'daily_reward',
        amount: 500,
        metadata: { streak: 5, bonus: 200 }
      },
      {
        userId: testUser.id,
        type: 'case_open',
        amount: -500,
        metadata: { caseId: standardCase.id, caseName: 'Стандартный кейс' }
      },
      {
        userId: testUser.id,
        type: 'referral',
        amount: 200,
        metadata: { referredUserId: 'friend123' }
      },
      {
        userId: testUser.id,
        type: 'welcome_bonus',
        amount: 500,
        metadata: { source: 'registration' }
      }
    ]
  });

  // Создаем каналы для подписки
  console.log('📢 Создаем каналы...');
  await prisma.channel.createMany({
    data: [
      {
        name: 'Skin Factory News',
        username: 'skinfactorynews',
        inviteLink: 'https://t.me/skinfactorynews',
        rewardType: 'balance',
        rewardValue: 500,
        isActive: true,
        isRequired: true
      },
      {
        name: 'CS:GO Deals',
        username: 'csgodeals',
        inviteLink: 'https://t.me/csgodeals',
        rewardType: 'fragment',
        rewardValue: 3,
        isActive: true,
        isRequired: false
      },
      {
        name: 'Skin Factory Chat',
        username: 'skinfactorychat',
        inviteLink: 'https://t.me/skinfactorychat',
        rewardType: 'premium',
        rewardValue: 100,
        isActive: true,
        isRequired: false
      }
    ]
  });

  // Создаем мини-игры
  console.log('🎮 Создаем мини-игры...');
  await prisma.minigame.createMany({
    data: [
      { name: 'Кости', type: 'dice', minBet: 10, maxBet: 1000, winMultiplier: 2.0, isActive: true },
      { name: 'Рулетка', type: 'roulette', minBet: 50, maxBet: 5000, winMultiplier: 3.0, isActive: true },
      { name: 'Слоты', type: 'slots', minBet: 20, maxBet: 2000, winMultiplier: 5.0, isActive: true },
      { name: 'Орёл и решка', type: 'coinflip', minBet: 10, maxBet: 1000, winMultiplier: 1.95, isActive: true }
    ]
  });

  // Создаем настройки приложения
  console.log('⚙️ Создаем настройки...');
  await prisma.appSetting.createMany({
    data: [
      { key: 'premium_currency_name', value: 'GC', type: 'string', description: 'Название премиум валюты' },
      { key: 'withdrawal_fee_percent', value: '5', type: 'number', description: 'Комиссия за вывод (%)' },
      { key: 'referral_bonus', value: '200', type: 'number', description: 'Бонус за реферала' },
      { key: 'daily_reward_base', value: '100', type: 'number', description: 'Базовая ежедневная награда' },
      { key: 'min_withdrawal_amount', value: '1000', type: 'number', description: 'Минимальная сумма вывода' }
    ]
  });

  console.log('\n✅ База данных успешно заполнена!');
  console.log(`\n📊 Итоги:`);
  console.log(`  👤 Пользователей: 2 (admin + testuser)`);
  console.log(`  🎁 Кейсов: 4`);
  console.log(`  🔫 Скинов: ${skins.length}`);
  console.log(`  📢 Каналов: 3`);
  console.log(`  🎮 Мини-игр: 4`);
}

main()
  .catch((error) => {
    console.error('❌ Ошибка при заполнении базы данных:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
