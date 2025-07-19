'use client';

import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('Toaster montado, toasts atuais:', toasts.length);
  }, []);

  // Log quando toasts mudam
  useEffect(() => {
    console.log('Toasts atualizados:', toasts.map(t => ({ id: t.id, open: t.open })));
  }, [toasts]);

  // Não renderizar nada até o componente estar montado no cliente
  if (!mounted) {
    return null;
  }

  const handleClose = (toastId: string) => {
    console.log('=== DEBUG FECHAR TOAST ===');
    console.log('Toast ID:', toastId);
    console.log('Função dismiss disponível:', typeof dismiss);
    console.log('Toasts antes de fechar:', toasts.map(t => ({ id: t.id, open: t.open })));
    
    try {
      dismiss(toastId);
      console.log('Função dismiss chamada com sucesso');
    } catch (error) {
      console.error('Erro ao chamar dismiss:', error);
    }
  };

  // Teste direto - remover toast imediatamente
  const handleTestClose = (toastId: string) => {
    console.log('=== TESTE DIRETO ===');
    console.log('Removendo toast diretamente:', toastId);
    
    // Forçar remoção imediata
    const updatedToasts = toasts.filter(t => t.id !== toastId);
    console.log('Toasts após filtro:', updatedToasts);
    
    // Chamar dismiss também
    dismiss(toastId);
  };

  console.log('Renderizando Toaster com', toasts.length, 'toasts');

  return (
    <div className="toaster-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item bg-white border border-gray-200 rounded-xl shadow-xl 
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
          {/* Botão de fechar no canto superior direito */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Botão clicado para toast:', toast.id);
              handleClose(toast.id);
            }}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 
                       transition-colors duration-200 p-1 rounded-full 
                       hover:bg-gray-100 focus:outline-none focus:ring-2 
                       focus:ring-gray-300 focus:ring-offset-2 z-10"
            title="Fechar"
            data-toast-id={toast.id}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Botão de teste adicional */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Botão de teste clicado para toast:', toast.id);
              handleTestClose(toast.id);
            }}
            className="absolute top-2 right-8 text-red-500 hover:text-red-700 
                       transition-colors duration-200 p-1 rounded-full 
                       hover:bg-red-100 focus:outline-none focus:ring-2 
                       focus:ring-red-300 focus:ring-offset-2 z-10"
            title="Teste Fechar"
            data-toast-id={toast.id}
          >
            <span className="text-xs">T</span>
          </button>

          {/* Conteúdo do toast */}
          <div className="pr-6"> {/* Padding direito reduzido */}
            {toast.title && (
              <h4 className="font-semibold text-gray-900 mb-1 text-base leading-tight">
                {toast.title}
              </h4>
            )}
            {toast.description && (
              <p className="text-sm text-gray-700 leading-relaxed">
                {toast.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 