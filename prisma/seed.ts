import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Очищаем существующие данные (опционально)
  await prisma.marketListing.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.caseDrop.deleteMany();
  await prisma.case.deleteMany();
  await prisma.skin.deleteMany();
  await prisma.user.deleteMany();

  // Создаем скины
  console.log('Создаем скины...');
  const skins = await prisma.skin.createManyAndReturn({
    data: [
      {
        name: 'AK-47 | Redline',
        weapon: 'AK-47',
        rarity: 'classified',
        price: 45.50,
        fragmentsRequired: 15,
        imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FA957PHDfz9H_IVJmI21h_KkYb3QhG5U18lwmOv--oX8iQa3r0Q5ZzzwJI-CJw9tYw6G8lbqk-y-gJG-6Z6bmXMyvXNw5XvVyka2hkQdPYo'
      },
      {
        name: 'AWP | Asiimov',
        weapon: 'AWP',
        rarity: 'covert',
        price: 120.00,
        fragmentsRequired: 20,
        imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJK_8W4m5a0mvLwOq7cqWdQ-sJ0xL-Rrd2gjQHhqkI4Z2j1cI-ScldoaVjV-lO9xrrugsC-6sjLwHJl6XQh-z-DyULn10YdP7I9gI2A'
      },
      {
        name: 'Glock-18 | Water Elemental',
        weapon: 'Glock-18',
        rarity: 'mil-spec',
        price: 5.50,
        fragmentsRequired: 5,
        imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposbaqKAxf0vL3djFN_IVJmI21h_KnZ7rVh29U19d0teXE8IWs2w3s_0o-Yzv1LNeLelc2YViG-1nqkuzvh8e7vZzNmCBh6HYl4n7DgVXp10RIfIs4hUw'
      },
      {
        name: 'M4A1-S | Guardian',
        weapon: 'M4A1-S',
        rarity: 'restricted',
        price: 12.00,
        fragmentsRequired: 8,
        imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposem2LhNw1fz3Yi5F09q_m4S0m_7zO6-fqWdQ-sJ0xO2Y99Wg3wGx_0U5YjrzLYTEI1c9M1CB-1m7xO28hse-vJ_JnXth7HZ35yvVn0TmmBpJaJh80tSO_g'
      },
      {
        name: 'Desert Eagle | Blaze',
        weapon: 'Desert Eagle',
        rarity: 'classified',
        price: 85.00,
        fragmentsRequired: 12,
        imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpopujwezhjxszYI2gS09-5lpW0nuPxDLfYkW5F18l4teTE9oX4igPt_Uc6ZGj3I9WXIQY4YgyG-QK8w-3q0JW8vJrKnXU3vXQq5SrD30vgzE5JaeI92LeTtw'
      }
    ]
  });

  console.log(`Создано ${skins.length} скинов`);

  // Создаем кейсы
  console.log('Создаем кейсы...');
  
  const adCase = await prisma.case.create({
    data: {
      name: 'Бесплатный кейс',
      type: 'ad',
      description: 'Открывается после просмотра рекламы. Шанс получить фрагмент легендарного скина!',
      imageUrl: 'https://via.placeholder.com/300x300/1e40af/ffffff?text=Free+Case'
    }
  });

  const standardCase = await prisma.case.create({
    data: {
      name: 'Стандартный кейс',
      type: 'standard',
      price: 500,
      description: 'Обычные и редкие скины. Отличный способ начать коллекцию!',
      imageUrl: 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=Standard+Case'
    }
  });

  const premiumCase = await prisma.case.create({
    data: {
      name: 'Премиум кейс',
      type: 'premium',
      price: 1500,
      description: 'Редкие и легендарные скины с увеличенным шансом на выпадение!',
      imageUrl: 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=Premium+Case'
    }
  });

  // Создаем дропы для кейсов
  console.log('Создаем дропы для кейсов...');
  
  // Дропы для бесплатного кейса (только фрагменты)
  for (const skin of skins) {
    await prisma.caseDrop.create({
      data: {
        caseId: adCase.id,
        skinId: skin.id,
        probability: 0.20, // 20% шанс на каждый фрагмент
        isFragment: true,
        fragments: Math.ceil(skin.fragmentsRequired / 3) // 1/3 от нужного количества
      }
    });
  }

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
        fragments: 1
      }
    });
  }

  // Дропы для премиум кейса
  const premiumDrops = [
    { skinId: skins[0].id, probability: 0.40 }, // AK-47 (40%)
    { skinId: skins[1].id, probability: 0.25 }, // AWP (25%)
    { skinId: skins[4].id, probability: 0.20 }, // Desert Eagle (20%)
    { skinId: skins[0].id, probability: 0.10, isFragment: true, fragments: 5 }, // Фрагменты AK-47
    { skinId: skins[1].id, probability: 0.05, isFragment: true, fragments: 3 }  // Фрагменты AWP
  ];

  for (const drop of premiumDrops) {
    await prisma.caseDrop.create({
      data: {
        caseId: premiumCase.id,
        skinId: drop.skinId,
        probability: drop.probability,
        isFragment: drop.isFragment || false,
        fragments: drop.fragments || 1
      }
    });
  }

  // Создаем тестового пользователя
  console.log('Создаем тестового пользователя...');
  
  const testUser = await prisma.user.create({
    data: {
      telegramId: 123456789,
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      balance: 5000,
      totalEarned: 10000,
      dailyStreak: 5
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
        price: skins[2].price
      },
      {
        userId: testUser.id,
        skinId: skins[0].id, // AK-47 (фрагменты)
        name: skins[0].name,
        rarity: skins[0].rarity,
        imageUrl: skins[0].imageUrl,
        isFragment: true,
        fragments: 8, // 8 из 15 нужных
        price: skins[0].price
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
      }
    ]
  });

  console.log('✅ База данных успешно заполнена!');
  console.log(`👤 Тестовый пользователь: ${testUser.username} (ID: ${testUser.id})`);
  console.log(`💰 Баланс: ${testUser.balance} CR`);
  console.log(`📦 Скинов в инвентаре: 2`);
  console.log(`🎮 Кейсов доступно: 3`);
}

main()
  .catch((error) => {
    console.error('❌ Ошибка при заполнении базы данных:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });