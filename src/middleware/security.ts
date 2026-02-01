import { Request, Response, NextFunction } from 'express';

// Заменяем express-rate-limit на простую реализацию
export const apiLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Простая реализация rate limiting
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 минут
  const maxRequests = 100;
  
  // В реальном приложении здесь был бы Redis или другая база данных
  // Для демо просто пропускаем
  next();
};

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Базовые заголовки безопасности
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  const cleanInput = (input: any): any => {
    if (typeof input === 'string') {
      return input.replace(/[<>]/g, '');
    }
    if (Array.isArray(input)) {
      return input.map(cleanInput);
    }
    if (typeof input === 'object' && input !== null) {
      const cleaned: any = {};
      for (const key in input) {
        cleaned[key] = cleanInput(input[key]);
      }
      return cleaned;
    }
    return input;
  };

  req.body = cleanInput(req.body);
  req.query = cleanInput(req.query);
  req.params = cleanInput(req.params);
  
  next();
};

export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const checkForSQLInjection = (value: any): boolean => {
    if (typeof value !== 'string') return false;
    
    const sqlInjectionPatterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
      /w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
      /((\%27)|(\'))union/gi,
      /exec(\s|\+)+(s|x)p\w+/gi,
      /insert(\s|\+)+into.+/gi,
      /select(\s|\+)+from.+/gi,
      /delete(\s|\+)+from.+/gi,
      /drop(\s|\+)+table.+/gi
    ];
    
    return sqlInjectionPatterns.some(pattern => pattern.test(value));
  };

  const checkObject = (obj: any): boolean => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        if (checkForSQLInjection(obj[key])) {
          return true;
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkObject(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    return res.status(400).json({
      success: false,
      error: 'Недопустимые символы в запросе'
    });
  }

  next();
};