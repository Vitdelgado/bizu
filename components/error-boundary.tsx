'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorLogger } from '@/lib/error-logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro
    errorLogger.logError(error, 'ErrorBoundary', {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Callback personalizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Atualizar estado
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Fallback personalizado
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão
      return <DefaultErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Fallback padrão para erros
function DefaultErrorFallback({ error }: { error?: Error }) {
  const isReactError130 = error?.message.includes('React error #130') || 
                         error?.message.includes('Minified React error #130');

  return (
    <div className="error-fallback">
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2 className="error-title">
          {isReactError130 ? 'Erro de Props Detectado' : 'Algo deu errado'}
        </h2>
        <p className="error-message">
          {isReactError130 
            ? 'Detectamos um problema com as propriedades de um componente. Isso pode ser causado por dados inválidos sendo passados como props.'
            : 'Ocorreu um erro inesperado. Nossa equipe foi notificada.'
          }
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="error-details">
            <summary>Detalhes do Erro (Desenvolvimento)</summary>
            <pre className="error-stack">{error.stack}</pre>
          </details>
        )}

        <div className="error-actions">
          <button 
            onClick={() => window.location.reload()} 
            className="error-button primary"
          >
            Recarregar Página
          </button>
          <button 
            onClick={() => window.history.back()} 
            className="error-button secondary"
          >
            Voltar
          </button>
        </div>

        <div className="error-help">
          <p>
            Se o problema persistir, entre em contato com o suporte técnico.
          </p>
        </div>
      </div>

      <style jsx>{`
        .error-fallback {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: #f8fafc;
        }

        .error-container {
          max-width: 600px;
          text-align: center;
          background: white;
          padding: 3rem 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .error-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .error-message {
          color: #6b7280;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .error-details {
          margin: 2rem 0;
          text-align: left;
        }

        .error-details summary {
          cursor: pointer;
          color: #3b82f6;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .error-stack {
          background: #f3f4f6;
          padding: 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          color: #374151;
          overflow-x: auto;
          white-space: pre-wrap;
        }

        .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .error-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .error-button.primary {
          background: #3b82f6;
          color: white;
        }

        .error-button.primary:hover {
          background: #2563eb;
        }

        .error-button.secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .error-button.secondary:hover {
          background: #e5e7eb;
        }

        .error-help {
          color: #9ca3af;
          font-size: 0.875rem;
        }

        @media (max-width: 640px) {
          .error-container {
            padding: 2rem 1rem;
          }

          .error-actions {
            flex-direction: column;
          }

          .error-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

// Hook para usar Error Boundary em componentes funcionais
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    errorLogger.logError(error, 'useErrorBoundary');
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, resetError };
} 