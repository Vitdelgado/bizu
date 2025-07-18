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
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[300px]
            ${toast.variant === 'destructive' ? 'border-red-200 bg-red-50' : ''}
          `}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {toast.title && (
                <h4 className="font-medium text-gray-900 mb-1">
                  {toast.title}
                </h4>
              )}
              {toast.description && (
                <p className="text-sm text-gray-600">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => toast.onOpenChange?.(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 