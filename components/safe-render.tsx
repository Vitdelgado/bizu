'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { errorLogger } from '@/lib/error-logger';

interface SafeRenderProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

export function SafeRender({ children, fallback, componentName = 'SafeRender' }: SafeRenderProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('React error #130')) {
        setError(event.error);
        setHasError(true);
        errorLogger.logError(event.error, componentName);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [componentName]);

  if (hasError) {
    return fallback || (
      <div className="safe-render-fallback">
        <p>Erro de renderização detectado. Recarregando...</p>
        <button onClick={() => window.location.reload()}>
          Recarregar Página
        </button>
      </div>
    );
  }

  try {
    return <>{children}</>;
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Erro desconhecido');
    setError(error);
    setHasError(true);
    errorLogger.logError(error, componentName);
    
    return fallback || (
      <div className="safe-render-fallback">
        <p>Erro de renderização detectado. Recarregando...</p>
        <button onClick={() => window.location.reload()}>
          Recarregar Página
        </button>
      </div>
    );
  }
}

// Hook para validação de props
export function useSafeProps<T extends Record<string, any>>(
  props: T,
  componentName: string
): T {
  const [safeProps, setSafeProps] = useState<T>(() => {
    try {
      // Sanitizar props para evitar erro React #130
      const sanitized = JSON.parse(JSON.stringify(props, (key, value) => {
        // Remover propriedades que podem causar problemas
        if (typeof value === 'object' && value !== null) {
          // Verificar se tem propriedades inválidas
          const keys = Object.keys(value);
          if (keys.some(k => /^\d/.test(k) || /[^a-zA-Z0-9_]/.test(k))) {
            return undefined; // Remover objeto com propriedades inválidas
          }
        }
        return value;
      }));
      return sanitized;
    } catch (error) {
      errorLogger.logError(error as Error, componentName, props);
      return {} as T;
    }
  });

  useEffect(() => {
    try {
      const sanitized = JSON.parse(JSON.stringify(props, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          const keys = Object.keys(value);
          if (keys.some(k => /^\d/.test(k) || /[^a-zA-Z0-9_]/.test(k))) {
            return undefined;
          }
        }
        return value;
      }));
      setSafeProps(sanitized);
    } catch (error) {
      errorLogger.logError(error as Error, componentName, props);
    }
  }, [props, componentName]);

  return safeProps;
} 