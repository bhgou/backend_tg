declare global {
  interface Window {
    Telegram: {
      WebApp: {
        // Основные свойства
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
        close(): void;
        enableClosingConfirmation?(): void;
        showAlert?(message: string): void;
        showConfirm?(message: string, callback: (confirmed: boolean) => void): void;
        sendData?(data: string): void;
        share?(text: string): void;
        
        // Дополнительные методы, которые могут быть
        onEvent?(eventType: string, callback: Function): void;
        offEvent?(eventType: string, callback: Function): void;
      }
    };
  }
}

export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  language_code?: string;
}

export {};