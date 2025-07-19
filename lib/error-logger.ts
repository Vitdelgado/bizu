interface ErrorLog {
  id: string;
  timestamp: number;
  error: string;
  stack?: string;
  component?: string;
  props?: any;
  userAgent: string;
  url: string;
  userId?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;

  logError(error: Error, component?: string, props?: any) {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack,
      component,
      props: this.sanitizeProps(props),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userId: this.getCurrentUserId(),
    };

    this.logs.push(errorLog);
    
    // Manter apenas os últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log no console para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Logger');
      console.error('Error:', error);
      console.log('Component:', component);
      console.log('Props:', props);
      console.log('User Agent:', errorLog.userAgent);
      console.log('URL:', errorLog.url);
      console.groupEnd();
    }

    // Enviar para serviço de monitoramento em produção
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(errorLog);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private sanitizeProps(props: any): any {
    if (!props) return null;
    
    try {
      // Remover propriedades sensíveis
      const sanitized = { ...props };
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.secret;
      
      // Limitar profundidade para evitar loops infinitos
      return JSON.parse(JSON.stringify(sanitized, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            return value.slice(0, 10); // Limitar arrays
          }
          const keys = Object.keys(value);
          if (keys.length > 20) {
            return { ...value, _truncated: true };
          }
        }
        return value;
      }));
    } catch (error) {
      return { _error: 'Failed to sanitize props' };
    }
  }

  private getCurrentUserId(): string | undefined {
    // Implementar lógica para obter ID do usuário atual
    // Pode ser do contexto de autenticação
    return undefined;
  }

  private async sendToMonitoring(errorLog: ErrorLog) {
    try {
      // Enviar para serviço de monitoramento (ex: Sentry, LogRocket, etc.)
      await fetch('/api/error-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog),
      });
    } catch (error) {
      console.error('Failed to send error to monitoring:', error);
    }
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  // Detectar erros React #130 especificamente
  detectReactError130(error: Error): boolean {
    return error.message.includes('React error #130') || 
           error.message.includes('Minified React error #130');
  }
}

export const errorLogger = new ErrorLogger();

// Hook para capturar erros em componentes
export function useErrorLogger(componentName: string) {
  return {
    logError: (error: Error, props?: any) => {
      errorLogger.logError(error, componentName, props);
    },
    logReactError130: (error: Error, props?: any) => {
      if (errorLogger.detectReactError130(error)) {
        errorLogger.logError(error, componentName, props);
      }
    },
  };
} 