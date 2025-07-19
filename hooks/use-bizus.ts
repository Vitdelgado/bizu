import { useState, useEffect, useCallback, useRef } from 'react';
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

// Cache local para evitar refetches desnecessários
const cache = new Map<string, { data: Bizu[]; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const getCacheKey = (params?: { q?: string; limit?: number }) => {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  return searchParams.toString() || 'all';
};

const isCacheValid = (timestamp: number, ttl: number) => {
  return Date.now() - timestamp < ttl;
};

export function useBizus(): UseBizusReturn {
  const [bizus, setBizus] = useState<Bizu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, isAdmin } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBizus = useCallback(async (params?: { q?: string; limit?: number }) => {
    try {
      setLoading(true);
      setError(null);

      // Cancelar request anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Criar novo AbortController
      abortControllerRef.current = new AbortController();

      // Verificar cache primeiro
      const cacheKey = getCacheKey(params);
      const cached = cache.get(cacheKey);
      
      if (cached && isCacheValid(cached.timestamp, cached.ttl)) {
        console.log('📦 Usando dados do cache:', cached.data.length);
        setBizus(cached.data);
        setLoading(false);
        return;
      }

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
      
      let query = supabase
        .from('bizus')
        .select('*')
        .order('created_at', { ascending: false });

      if (params?.q) {
        query = query.or(`title.ilike.%${params.q}%,category.ilike.%${params.q}%,keywords.cs.{${params.q}},content.ilike.%${params.q}%`);
      }

      if (params?.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;

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
      
      const bizusData = data || [];
      setBizus(bizusData);

      // Salvar no cache
      cache.set(cacheKey, {
        data: bizusData,
        timestamp: Date.now(),
        ttl: CACHE_TTL
      });

    } catch (err) {
      // Ignorar erros de abort
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('💥 Erro completo ao buscar bizus:', err);
      setError(`Erro ao carregar bizus: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBizu = async (bizuData: Omit<Bizu, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);

      console.log('🔍 Iniciando criação de bizu...');
      console.log('👤 Profile:', profile?.id);

      if (!profile) {
        throw new Error('Usuário não autenticado');
      }

      console.log('📤 Enviando requisição para API...');
      
      // Fazer requisição para a API (cookies são enviados automaticamente)
      const response = await fetch('/api/bizus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bizuData),
      });

      console.log('📥 Resposta da API:', { 
        status: response.status, 
        ok: response.ok 
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro da API:', errorData);
        throw new Error(errorData.error || 'Erro ao criar bizu');
      }

      const data = await response.json();
      console.log('✅ Bizu criado com sucesso:', data);

      // Atualizar estado local
      setBizus(prev => [data, ...prev]);
      
      // Invalidar cache
      cache.clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar bizu');
      console.error('💥 Erro completo ao criar bizu:', err);
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

      // Atualizar estado local
      setBizus(prev => prev.map(b => b.id === id ? data : b));
      
      // Invalidar cache
      cache.clear();
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

      // Atualizar estado local
      setBizus(prev => prev.filter(b => b.id !== id));
      
      // Invalidar cache
      cache.clear();
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
      // Cancelar request em andamento
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchBizus]);

  return {
    bizus,
    loading,
    error,
    createBizu,
    updateBizu,
    deleteBizu,
    refreshBizus: () => fetchBizus(),
    canEdit,
    canDelete,
  };
} 