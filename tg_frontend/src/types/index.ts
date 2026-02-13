// Типы для пользователей
export interface User {
  id: number;
  telegram_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  balance: number;
  premium_balance: number;
  total_earned: number;
  total_spent_rub: number;
  daily_streak: number;
  last_daily_at: string | null;
  referral_code: string;
  referred_by: number | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}
export interface UserStats {
  totalCasesOpened: number;
  totalSkinsCollected: number;
  totalReferrals: number;
  tradeAccuracy: number;
  totalGamesPlayed: number;
  totalGamesWon: number;
  winRate: number;
}
// Типы для скинов
export interface Skin {
  id: number;
  name: string;
  weapon: string;
  rarity: string;
  price: number;
  image_url: string | null;
  fragments_required: number;
  is_tradable: boolean;
  created_at: string;
}

// Типы для инвентаря
export interface InventoryItem {
  id: number;
  user_id: number;
  skin_id: number | null;
  name: string;
  rarity: string;
  image_url: string | null;
  is_fragment: boolean;
  fragments: number;
  price: number | null;
  created_at: string;
  weapon?: string;
  fragments_required?: number;
}

// Типы для кейсов
export interface Case {
  id: number;
  name: string;
  type: string;
  price: number | null;
  premium_price?: number;
  image_url: string | null;
  description: string | null;
  min_reward?: number;
  max_reward?: number;
  is_active: boolean;
  created_at: string;
  total_drops?: number;
}

// Типы для дропов кейсов
export interface CaseDrop {
  id: number;
  case_id: number;
  skin_id: number | null;
  probability: number;
  is_fragment: boolean;
  fragments: number;
  drop_type: string;
  skin_name?: string;
  rarity?: string;
  weapon?: string;
  price?: number;
  image_url?: string | null;
  fragments_required?: number;
}

// Типы для транзакций
export interface Transaction {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  metadata: any;
  created_at: string;
}

// Типы для рынка
export interface MarketListing {
  id: number;
  seller_id: number;
  item_id: number;
  price: number;
  is_active: boolean;
  created_at: string;
  sold_at: string | null;
  name?: string;
  rarity?: string;
  weapon?: string;
  image_url?: string | null;
  is_fragment?: boolean;
  fragments?: number;
  seller_name?: string;
}

// Типы для спонсоров
export interface Sponsor {
  id: number;
  name: string;
  username: string | null;
  invite_link: string;
  reward_type: string;
  reward_value: number;
  premium_reward: number;
  is_active: boolean;
  priority: number;
  created_at: string;
}

// Типы для подписок
export interface SponsorSubscription {
  id: number;
  user_id: number;
  sponsor_id: number;
  telegram_username: string | null;
  subscribed_at: string;
  verified: boolean;
  reward_claimed: boolean;
}

// Типы для реальных скинов
export interface RealSkin {
  id: number;
  steam_market_id: string | null;
  name: string;
  weapon: string;
  rarity: string;
  exterior: string | null;
  float_value: number | null;
  steam_price: number;
  image_url: string;
  fragments_required: number;
  premium_fee: number;
  tradeable: boolean;
  is_stattrak: boolean;
  is_souvenir: boolean;
  created_at: string;
}

// Типы для заявок на вывод
export interface WithdrawalRequest {
  id: number;
  user_id: number;
  real_skin_id: number;
  steam_trade_link: string;
  status: string;
  fragments_used: number;
  premium_paid: number;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
}

// Типы для JWT
export interface JwtPayload {
  userId: number;
  telegramId: string;
  iat?: number;
  exp?: number;
}

// Типы для запросов аутентификации
export interface AuthRequest {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  referralCode?: string;
}

// Типы для ответов API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  // Динамические поля для разных эндпоинтов
  [key: string]: any;
}