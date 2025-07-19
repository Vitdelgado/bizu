'use client';

import React, { ReactNode, useMemo } from 'react';

interface SafeRenderProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

// Função para sanitizar props recursivamente
function sanitizeProps(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeProps).filter(item => item !== undefined);
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Remover propriedades que podem causar erro React #130
      if (key.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        const sanitizedValue = sanitizeProps(value);
        if (sanitizedValue !== undefined) {
          sanitized[key] = sanitizedValue;
        }
      }
    }
    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  return obj;
}

export function SafeRender({ children, fallback, componentName = 'SafeRender' }: SafeRenderProps) {
  const sanitizedChildren = useMemo(() => {
    try {
      // Se children é um objeto, sanitizar
      if (typeof children === 'object' && children !== null) {
        return sanitizeProps(children);
      }
      return children;
    } catch (error) {
      console.warn(`SafeRender error in ${componentName}:`, error);
      return fallback || <div>Erro de renderização</div>;
    }
  }, [children, fallback, componentName]);

  try {
    return <>{sanitizedChildren}</>;
  } catch (error) {
    console.warn(`SafeRender render error in ${componentName}:`, error);
    return fallback || <div>Erro de renderização</div>;
  }
}

// Hook para validação de props
export function useSafeProps<T extends Record<string, unknown>>(
  props: T,
  componentName: string
): T {
  return useMemo(() => {
    try {
      const sanitized = sanitizeProps(props);
      return sanitized || {} as T;
    } catch (error) {
      console.warn(`useSafeProps error in ${componentName}:`, error);
      return {} as T;
    }
  }, [props, componentName]);
} 