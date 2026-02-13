import axios from 'axios';
import config from '../config/config';
import { useUserStore } from '../store/user.store';
import telegramService from '../config/telegram';

// Типы ответов API
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
  [key: string]: any;
}

export interface AdminStatsResponse extends ApiResponse {
  stats?: {
    total_users: number;
    new_users_today: number;
    total_revenue: number;
    total_payments: number;
    pending_withdrawals: number;
    completed_withdrawals: number;
    transactions_today: number;
    games_today: number;
  };
}

export interface OpenCaseResponse extends ApiResponse {
  item?: any;
  case?: any;
  newBalance?: number;
}

export interface CasesResponse extends ApiResponse {
  cases?: any[];
}

export interface InventoryResponse extends ApiResponse {
  items?: any[];
}

export interface MarketResponse extends ApiResponse {
  listings?: any[];
  stats?: {
    totalListings: number;
    totalVolume: number;
  };
}

export interface PaymentCreateResponse extends ApiResponse {
  payment?: {
    id: string;
    amount: number;
    status: string;
    paymentUrl?: string;
    payment_url?: string;
  };
  demo?: boolean;
}

export interface UserStatsResponse extends ApiResponse {
  stats?: any;
}

// Создание экземпляра axios с базовой конфигурацией
const api = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
    'X-App-Version': config.app.version,
    'X-Platform': telegramService.isTelegram() ? 'telegram' : 'web',
  },
});

// Интерцептор запросов
api.interceptors.request.use((requestConfig) => {
  const token = useUserStore.getState().token;
  const telegramData = telegramService.getInitData();
  
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  
  if (telegramData && telegramService.isTelegram()) {
    requestConfig.headers['X-Telegram-Init-Data'] = telegramData;
  }
  
  // Добавляем timestamp для предотвращения кеширования
  if (requestConfig.method === 'get') {
    requestConfig.params = {
      ...requestConfig.params,
      _t: Date.now(),
    };
  }
  
  return requestConfig;
}, (error) => {
  return Promise.reject(error);
});

// Интерцептор ответов
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data || {
      success: false,
      error: error.message || 'Ошибка сети',
    };
    
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: errorData,
    });
    
    // Обработка различных ошибок
    if (error.response?.status === 401) {
      useUserStore.getState().logout();
      window.location.href = '/auth';
    }
    
    if (error.response?.status === 403) {
      telegramService.showAlert('Доступ запрещен');
    }
    
    if (error.response?.status === 429) {
      telegramService.showAlert('Слишком много запросов. Подождите немного.');
    }
    
    if (error.response?.status === 503 && config.app.maintenance) {
      window.location.href = '/maintenance';
    }
    
    return Promise.reject(errorData);
  }
);

// Auth API
export const authAPI = {
  login: (data: any): Promise<ApiResponse> => api.post('/auth/login', data),
  verify: (token: string): Promise<ApiResponse> => api.post('/auth/verify', { token }),
  logout: (): Promise<ApiResponse> => api.post('/auth/logout'),
};

// User API
export const userAPI = {
  getProfile: (): Promise<ApiResponse> => api.get('/user/profile'),
  getStats: (): Promise<UserStatsResponse> => api.get('/user/stats'),
  claimDaily: (): Promise<ApiResponse> => api.post('/user/daily'),
  getReferrals: (): Promise<ApiResponse> => api.get('/user/referrals'),
  getTransactions: (params?: any): Promise<ApiResponse> => api.get('/user/transactions', { params }),
  updateProfile: (data: any): Promise<ApiResponse> => api.put('/user/profile', data),
};

// Case API
export const caseAPI = {
  getCases: (): Promise<CasesResponse> => api.get('/cases'),
  getCase: (id: number): Promise<ApiResponse> => api.get(`/cases/${id}`),
  getCaseDrops: (caseId: number): Promise<ApiResponse> => api.get(`/cases/${caseId}/drops`),
  openCase: (caseId: number): Promise<OpenCaseResponse> => api.post('/cases/open', { caseId }),  getCaseHistory: (params?: any): Promise<ApiResponse> => api.get('/cases/history', { params }),
};

// Inventory API
export const inventoryAPI = {
  getInventory: (params?: any): Promise<InventoryResponse> => api.get('/inventory', { params }),
  combineSkin: (skinId: number): Promise<ApiResponse> => api.post('/inventory/combine', { skinId }),
  sellItem: (data: any): Promise<ApiResponse> => api.post('/inventory/sell', data),
  cancelSale: (listingId: number): Promise<ApiResponse> => api.post('/inventory/cancel-sale', { listingId }),
};

// Market API
export const marketAPI = {
  getListings: (params?: any): Promise<MarketResponse> => api.get('/market', { params }),
  createListing: (data: any): Promise<ApiResponse> => api.post('/market/listings', data),
  buyItem: (listingId: number): Promise<ApiResponse> => api.post('/market/buy', { listingId }),
  searchItems: (params: any): Promise<ApiResponse> => api.get('/market/search', { params }),
};

// Game API
export const gameAPI = {
  getGames: (): Promise<ApiResponse> => api.get('/games'),
  playGame: (gameType: string, data: any): Promise<ApiResponse> => api.post(`/games/${gameType}/play`, data),
  getGameHistory: (params?: any): Promise<ApiResponse> => api.get('/games/history', { params }),
};

// Payment API
export const paymentAPI = {
  getPackages: (): Promise<ApiResponse> => api.get('/payments/packages'),
  createPayment: (data: any): Promise<PaymentCreateResponse> => api.post('/payments/create', data),
  getPaymentStatus: (paymentId: string): Promise<ApiResponse> => api.get(`/payments/status/${paymentId}`),
  getPaymentHistory: (params?: any): Promise<ApiResponse> => api.get('/payments/history', { params }),
};

// Channels API
export const channelsAPI = {
  getChannels: () => api.get('/channels'),
  checkSubscriptions: (channelIds: number[]) => 
    api.post('/channels/check-subscriptions', { channelIds }),
  claimReward: (channelId: number) => 
    api.post('/channels/claim-reward', { channelId }),
  getChannelsStats: () => api.get('/channels/stats'),
};

// Real Skins API
export const realSkinsAPI = {
  getRealSkins: (params?: any) => api.get('/real-skins', { params }),
  getRealSkin: (id: number) => api.get(`/real-skins/${id}`),
  createWithdrawal: (data: any) => api.post('/real-skins/withdraw', data),
  getWithdrawals: () => api.get('/real-skins/withdrawals/history'),
  getFragmentsProgress: () => api.get('/real-skins/fragments/progress'),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  updateUser: (userId: number, data: any) => api.put(`/admin/users/${userId}`, data),
  getWithdrawals: (params?: any) => api.get('/admin/withdrawals', { params }),
  updateWithdrawal: (id: number, data: any) => api.put(`/admin/withdrawals/${id}`, data),
};

// System API
export const systemAPI = {
  health: () => api.get('/health'),
  dbHealth: () => api.get('/health/db'),
  getAppInfo: () => api.get('/api'),
};

// Проверка подключения
export const checkApiConnection = async () => {
  try {
    const response = await systemAPI.health();
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error };
  }
};

export default api;