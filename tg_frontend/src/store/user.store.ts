import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocalUserStats {
  totalCasesOpened: number;
  totalSkinsCollected: number;
  totalReferrals: number;
  tradeAccuracy: number;
  totalGamesPlayed: number;
  totalGamesWon: number;
  winRate: number;
}

interface UserStoreState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  balance: number;
  premiumBalance: number;
  
  fragments: number;
  inventoryCount: number;
  
  stats: LocalUserStats | null;
  
  setUser: (user: any | null) => void;
  setToken: (token: string | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  initUser: (userData: any) => Promise<void>;
  updateUserData: (data: Partial<any>) => void;
  
  updateBalance: (newBalance: number) => void;
  updatePremiumBalance: (newPremiumBalance: number) => void;
  addBalance: (amount: number) => void;
  addPremiumBalance: (amount: number) => void;
  deductBalance: (amount: number) => void;
  deductPremiumBalance: (amount: number) => void;
  
  updateFragments: (fragments: number) => void;
  addFragments: (amount: number) => void;
  updateInventoryCount: (count: number) => void;
  
  updateStats: (stats: LocalUserStats) => void;
  
  logout: () => void;
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      balance: 0,
      premiumBalance: 0,
      fragments: 0,
      inventoryCount: 0,
      stats: null,

      initUser: async (userData) => {
        try {
          set({ isLoading: true, error: null });
          
          const user = {
            id: userData.id,
            telegram_id: userData.telegramId,
            username: userData.username,
            first_name: userData.firstName,
            last_name: userData.lastName,
            avatar_url: userData.avatarUrl,
            balance: userData.balance || 0,
            premium_balance: userData.premiumBalance || 0,
            total_earned: userData.totalEarned || 0,
            total_spent_rub: userData.totalSpentRub || 0,
            daily_streak: userData.dailyStreak || 0,
            referral_code: userData.referralCode,
            is_admin: userData.isAdmin || false,
            created_at: userData.createdAt,
            updated_at: userData.updatedAt
          };

          set({
            user,
            balance: user.balance,
            premiumBalance: user.premium_balance,
            isAuthenticated: true,
            isLoading: false,
            stats: userData.stats || null
          });
          
          if (userData.token) {
            localStorage.setItem('token', userData.token);
            set({ token: userData.token });
          }
          
        } catch (error: any) {
          set({ 
            error: error.message || 'Ошибка инициализации пользователя',
            isLoading: false 
          });
          throw error;
        }
      },

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        balance: user?.balance || 0,
        premiumBalance: user?.premium_balance || 0
      }),
      
      setToken: (token) => set({ token }),
      
      setError: (error) => set({ error }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      updateUserData: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null,
        ...(data.balance !== undefined && { balance: data.balance }),
        ...(data.premium_balance !== undefined && { premiumBalance: data.premium_balance }),
        ...(data.stats && { stats: data.stats })
      })),
      
      updateBalance: (newBalance) => set({ 
        balance: newBalance,
        user: get().user ? { ...get().user!, balance: newBalance } : null
      }),
      
      updatePremiumBalance: (newPremiumBalance) => set({ 
        premiumBalance: newPremiumBalance,
        user: get().user ? { ...get().user!, premium_balance: newPremiumBalance } : null
      }),
      
      addBalance: (amount) => set((state) => ({ 
        balance: state.balance + amount,
        user: state.user ? { 
          ...state.user, 
          balance: state.user.balance + amount,
          total_earned: state.user.total_earned + Math.max(0, amount)
        } : null
      })),
      
      addPremiumBalance: (amount) => set((state) => ({ 
        premiumBalance: state.premiumBalance + amount,
        user: state.user ? { 
          ...state.user, 
          premium_balance: state.user.premium_balance + amount 
        } : null
      })),
      
      deductBalance: (amount) => set((state) => {
        const newBalance = Math.max(0, state.balance - amount);
        return {
          balance: newBalance,
          user: state.user ? { 
            ...state.user, 
            balance: newBalance 
          } : null
        };
      }),
      
      deductPremiumBalance: (amount) => set((state) => {
        const newPremiumBalance = Math.max(0, state.premiumBalance - amount);
        return {
          premiumBalance: newPremiumBalance,
          user: state.user ? { 
            ...state.user, 
            premium_balance: newPremiumBalance 
          } : null
        };
      }),
      
      updateFragments: (fragments) => set({ fragments }),
      
      addFragments: (amount) => set((state) => ({ 
        fragments: state.fragments + amount 
      })),
      
      updateInventoryCount: (count) => set({ inventoryCount: count }),
      
      updateStats: (stats) => set({ stats }),
      
      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          balance: 0,
          premiumBalance: 0,
          fragments: 0,
          inventoryCount: 0,
          stats: null,
          error: null
        });
      },
    }),
    {
      name: 'skin-factory-user-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user ? {
          id: state.user.id,
          telegram_id: state.user.telegram_id,
          username: state.user.username
        } : null
      })
    }
  )
);