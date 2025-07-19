'use client';

import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

export function Toaster() {
  const { toasts } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Não renderizar nada até o componente estar montado no cliente
  if (!mounted) {
    return null;
  }

  return (
    <div className="toaster-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item bg-white border border-gray-200 rounded-lg shadow-xl p-4 
            transform transition-all duration-300 ease-in-out
            hover:shadow-2xl hover:scale-105
            ${toast.variant === 'destructive' 
              ? 'border-red-200 bg-red-50 shadow-red-100' 
              : 'border-green-200 bg-green-50 shadow-green-100'
            }
          `}
          style={{
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {toast.title && (
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                  {toast.title}
                </h4>
              )}
              {toast.description && (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => toast.onOpenChange?.(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 
                         p-1 rounded-full hover:bg-gray-100 flex-shrink-0"
              title="Fechar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 