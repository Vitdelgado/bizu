import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

interface Bizu {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  content: string;
  image_url?: string;
  author_id: string;
  created_at: string;
  updated_at?: string;
  views: number;
}

interface UseBizusReturn {
  bizus: Bizu[];
  loading: boolean;
  error: string | null;
  createBizu: (bizu: Omit<Bizu, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBizu: (id: string, updates: Partial<Bizu>) => Promise<void>;
  deleteBizu: (id: string) => Promise<void>;
  refreshBizus: () => Promise<void>;
  canEdit: (bizu: Bizu) => boolean;
  canDelete: (bizu: Bizu) => boolean;
}

export function useBizus(): UseBizusReturn {
  const [bizus, setBizus] = useState<Bizu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, isAdmin } = useAuth();

  const fetchBizus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase) {
        throw new Error('Cliente Supabase não inicializado');
      }

      console.log('🔍 Iniciando busca de bizus...');
      
      // Testar conexão básica primeiro
      const { data: testData, error: testError } = await supabase
        .from('bizus')
        .select('count')
        .limit(1);

      console.log('🧪 Teste de conexão:', { testData, testError });
      
      if (testError) {
        console.error('❌ Erro no teste de conexão:', testError);
        throw testError;
      }

      console.log('✅ Conexão testada com sucesso, buscando bizus...');
      
      const { data, error } = await supabase
        .from('bizus')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📋 Resultado da busca:', { 
        data: data?.length || 0, 
        error: error ? error.message : null,
        errorDetails: error
      });

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ Bizus carregados com sucesso:', data?.length || 0);
      setBizus(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('💥 Erro completo ao buscar bizus:', err);
      setError(`Erro ao carregar bizus: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const createBizu = async (bizuData: Omit<Bizu, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);

      if (!profile) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('bizus')
        .insert([{
          ...bizuData,
          author_id: profile.id,
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setBizus(prev => [data, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar bizu');
      console.error('Erro ao criar bizu:', err);
      throw err;
    }
  };

  const updateBizu = async (id: string, updates: Partial<Bizu>) => {
    try {
      setError(null);

      const bizu = bizus.find(b => b.id === id);
      if (!bizu) {
        throw new Error('Bizu não encontrado');
      }

      if (!canEdit(bizu)) {
        throw new Error('Sem permissão para editar este bizu');
      }

      const { data, error } = await supabase
        .from('bizus')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Registrar edição se não for o autor
      if (profile && bizu.author_id !== profile.id) {
        await supabase.rpc('log_bizu_edit', {
          p_bizu_id: id,
          p_editor_id: profile.id,
          p_changes: { updates }
        });
      }

      setBizus(prev => prev.map(b => b.id === id ? data : b));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar bizu');
      console.error('Erro ao atualizar bizu:', err);
      throw err;
    }
  };

  const deleteBizu = async (id: string) => {
    try {
      setError(null);

      const bizu = bizus.find(b => b.id === id);
      if (!bizu) {
        throw new Error('Bizu não encontrado');
      }

      if (!canDelete(bizu)) {
        throw new Error('Sem permissão para deletar este bizu');
      }

      const { error } = await supabase
        .from('bizus')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setBizus(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar bizu');
      console.error('Erro ao deletar bizu:', err);
      throw err;
    }
  };

  const canEdit = (bizu: Bizu): boolean => {
    if (!profile) return false;
    return isAdmin || bizu.author_id === profile.id;
  };

  const canDelete = (bizu: Bizu): boolean => {
    if (!profile) return false;
    return isAdmin || bizu.author_id === profile.id;
  };

  useEffect(() => {
    let mounted = true;

    const loadBizus = async () => {
      if (mounted) {
        await fetchBizus();
      }
    };

    loadBizus();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    bizus,
    loading,
    error,
    createBizu,
    updateBizu,
    deleteBizu,
    refreshBizus: fetchBizus,
    canEdit,
    canDelete,
  };
} 