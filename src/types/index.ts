// Типы для пользователей
export interface User {
  id: number;
  telegram_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  balance: number;
  total_earned: number;
  daily_streak: number;
  last_daily_at: string | null;
  referral_code: string;
  referred_by: number | null;
  created_at: string;
  updated_at: string;
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
  skin_id: number;
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
  image_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  total_drops?: number;
}

// Типы для дропов кейсов
export interface CaseDrop {
  id: number;
  case_id: number;
  skin_id: number;
  probability: number;
  is_fragment: boolean;
  fragments: number;
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

// Типы для JWT
export interface JwtPayload {
  userId: number;
  telegramId: string;
}

// Типы для запросов
export interface AuthRequest {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  referralCode?: string;
}

// Типы для ответов
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
}