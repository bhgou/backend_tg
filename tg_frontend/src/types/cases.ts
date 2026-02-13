// types/cases.ts
export interface Case {
  id: number;
  name: string;
  type: "standard" | "premium" | "gold" | "free" | "fragment" | "ad";
  price: number | null;
  premiumPrice?: number | null;
  imageUrl?: string | null;
  description?: string;
  minReward?: number;
  maxReward?: number;
  isActive?: boolean;
  coolDownMinutes?: number;
  totalOpened?: number;
  createdAt?: string;
}

export interface CaseItem extends Case {
  // Можно добавить дополнительные свойства, если нужно
  fragments?: number;
  rarity?: string;
  weapon?: string;
}