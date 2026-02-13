import config from './config';

interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  language_code?: string;
}

interface WebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    query_id?: string;
    auth_date?: string;
    hash?: string;
    start_param?: string;
  };
  platform: string;
  version: string;
  colorScheme: string;
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  isClosingConfirmationEnabled: boolean;
  
  // Методы
  ready(): void;
  expand(): void;
  close?(): void;
  enableClosingConfirmation?(): void;
  showAlert?(message: string): void;
  showConfirm?(message: string, callback: (confirmed: boolean) => void): void;
  sendData?(data: string): void;
  share?(text: string): void;
}

class TelegramService {
  private static instance: TelegramService;
  private webApp: WebApp | null = null;
  private initialized = false;

  private constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp;
      
      try {
        this.webApp.ready();
        this.webApp.expand();
        
        if (this.webApp.enableClosingConfirmation) {
          this.webApp.enableClosingConfirmation();
        }
        
        // Устанавливаем тему
        if (this.webApp.colorScheme === 'dark') {
          document.documentElement.classList.add('dark');
        }
        
        this.initialized = true;
        console.log('📱 Telegram WebApp инициализирован');
      } catch (error) {
        console.error('Ошибка инициализации Telegram WebApp:', error);
      }
    } else {
      console.log('ℹ️ Telegram WebApp не обнаружен, работаем в браузерном режиме');
    }
  }

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  public isTelegram(): boolean {
    return this.initialized && this.webApp !== null;
  }

  public getUser(): TelegramUser | null {
    const user = this.webApp?.initDataUnsafe?.user || null;
    console.log('👤 Telegram.getUser():', {
      hasWebApp: !!this.webApp,
      hasInitDataUnsafe: !!this.webApp?.initDataUnsafe,
      user: user,
      initDataUnsafe: this.webApp?.initDataUnsafe,
    });
    return user;
  }

  public getStartParam(): string | null {
    return this.webApp?.initDataUnsafe?.start_param || null;
  }

  public getInitData(): string {
    return this.webApp?.initData || '';
  }

  public closeApp(): void {
    if (this.webApp?.close) {
      this.webApp.close();
    }
  }

  public showAlert(message: string): void {
    if (this.webApp?.showAlert) {
      this.webApp.showAlert(message);
    } else {
      alert(message);
    }
  }

  public showConfirm(message: string, callback: (confirmed: boolean) => void): void {
    if (this.webApp?.showConfirm) {
      this.webApp.showConfirm(message, callback);
    } else {
      const confirmed = window.confirm(message);
      callback(confirmed);
    }
  }

  public sendData(data: any): void {
    if (this.webApp?.sendData) {
      this.webApp.sendData(JSON.stringify(data));
    }
  }

  public getTheme(): 'dark' | 'light' {
    return this.webApp?.colorScheme === 'dark' ? 'dark' : 'light';
  }

  public getViewportHeight(): number {
    return this.webApp?.viewportHeight || window.innerHeight;
  }

  public async getAuthData(): Promise<{
    user: TelegramUser | null;
    initData: string;
    startParam: string | null;
  }> {
    return {
      user: this.getUser(),
      initData: this.getInitData(),
      startParam: this.getStartParam(),
    };
  }

  public openTelegramLink(path: string): void {
    const url = `https://t.me/${config.telegram.botUsername}/${path}`;
    window.open(url, '_blank');
  }

  public openTelegramApp(): void {
    window.location.href = config.telegram.webAppUrl;
  }

  public shareInviteLink(referralCode: string): void {
    const shareText = `🎮 Присоединяйся к Skin Factory!\n\n` +
                     `Открывай кейсы, играй в игры и получай реальные скины CS:GO!\n\n` +
                     `Мой реферальный код: ${referralCode}\n\n` +
                     `🔗 Ссылка: https://t.me/${config.telegram.botUsername}?start=${referralCode}`;
    
    if (this.isTelegram() && this.webApp?.share) {
      this.webApp.share(shareText);
    } else if (navigator.share) {
      navigator.share({
        title: 'Skin Factory',
        text: shareText,
        url: `https://t.me/${config.telegram.botUsername}?start=${referralCode}`,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      this.showAlert('Ссылка скопирована в буфер обмена!');
    }
  }

  public checkSubscription(_channelUsername: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isTelegram()) {
        resolve(false);
        return;
      }

      const user = this.getUser();
      if (!user?.id) {
        resolve(false);
        return;
      }

      // Имитация проверки подписки
      setTimeout(() => {
        resolve(Math.random() > 0.5);
      }, 1000);
    });
  }

  // Метод для инициализации пользователя (используется в App.tsx)
  public async initUser(): Promise<any> {
    if (this.isTelegram()) {
      const user = this.getUser();
      if (user) {
        return {
          ...user,
          telegramId: user.id.toString(),
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          avatarUrl: user.photo_url,
          initData: this.getInitData(),
        };
      }
    }
    
    // Возвращаем тестового пользователя для браузерного режима
    return {
      id: Date.now(),
      telegramId: 'test_user_' + Date.now(),
      username: 'test_user',
      firstName: 'Тест',
      lastName: 'Пользователь',
      balance: 1000,
      premiumBalance: 100,
      dailyStreak: 1,
      referralCode: 'TEST' + Date.now().toString().slice(-6),
      isAdmin: false,
      stats: {
        totalCasesOpened: 0,
        totalSkinsCollected: 0,
        totalReferrals: 0,
        tradeAccuracy: 0,
      }
    };
  }
}

export const telegramService = TelegramService.getInstance();
export default telegramService;