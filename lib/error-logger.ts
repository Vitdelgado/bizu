interface ErrorLog {
  error: string;
  stack?: string;
  component?: string;
  props?: unknown;
  userAgent?: string;
  url?: string;
  userId?: string;
  timestamp: string;
  environment: string;
}

interface ErrorLoggerConfig {
  enabled: boolean;
  endpoint: string;
  maxRetries: number;
  retryDelay: number;
}

class ErrorLogger {
  private config: ErrorLoggerConfig;
  private retryCount: number = 0;
  private queue: ErrorLog[] = [];

  constructor(config: Partial<ErrorLoggerConfig> = {}) {
    this.config = {
      enabled: true,
      endpoint: '/api/error-log',
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  private async sendError(log: ErrorLog): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(log),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Reset retry count on success
      this.retryCount = 0;
    } catch {
      this.retryCount++;
      
      if (this.retryCount < this.config.maxRetries) {
        // Add to queue for retry
        this.queue.push(log);
        
        setTimeout(() => {
          this.processQueue();
        }, this.config.retryDelay * this.retryCount);
      } else {
        console.error('Error logger failed after max retries');
      }
    }
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    const log = this.queue.shift();
    if (log) {
      await this.sendError(log);
    }
  }

  log(
    error: string | Error,
    component?: string,
    props?: unknown,
    additionalInfo?: Record<string, unknown>
  ): void {
    try {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const errorStack = error instanceof Error ? error.stack : undefined;

      const log: ErrorLog = {
        error: errorMessage,
        stack: errorStack,
        component: component || 'Unknown',
        props: props ? JSON.stringify(props) : undefined,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userId: additionalInfo?.userId as string,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      };

      this.sendError(log);
    } catch {
      console.error('Failed to log error:', error);
    }
  }

  logReactError(
    error: Error,
    errorInfo: { componentStack: string },
    componentName?: string,
    props?: unknown
  ): void {
    this.log(
      error,
      componentName || 'React Component',
      props,
      { componentStack: errorInfo.componentStack }
    );
  }

  logApiError(
    error: string | Error,
    endpoint: string,
    method: string,
    status?: number,
    response?: unknown
  ): void {
    this.log(
      error,
      'API',
      { endpoint, method, status, response }
    );
  }

  logValidationError(
    error: string,
    field: string,
    value: unknown,
    component?: string
  ): void {
    this.log(
      error,
      component || 'Validation',
      { field, value }
    );
  }

  // Método para limpar a fila de erros
  clearQueue(): void {
    this.queue = [];
  }

  // Método para obter estatísticas
  getStats(): { queueLength: number; retryCount: number } {
    return {
      queueLength: this.queue.length,
      retryCount: this.retryCount,
    };
  }
}

// Instância global do logger
export const errorLogger = new ErrorLogger();

// Hook para usar em componentes React
export function useErrorLogger() {
  return {
    log: (error: string | Error, component?: string, props?: unknown) => {
      errorLogger.log(error, component, props);
    },
    logReactError: (error: Error, errorInfo: { componentStack: string }, componentName?: string, props?: unknown) => {
      errorLogger.logReactError(error, errorInfo, componentName, props);
    },
  };
} 