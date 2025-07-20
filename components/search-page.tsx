import { useState, useEffect } from 'react';
import styles from './search-page.module.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Bizu, BizuCard } from './bizu-card';
import { BizuDetailModal } from './bizu-detail-modal';
import { EditBizuModal } from './edit-bizu-modal';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface SearchPageProps {
  onNovoBizuClick?: () => void;
}

function SearchPageContent({ onNovoBizuClick }: SearchPageProps) {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [selectedBizu, setSelectedBizu] = useState<Bizu | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingBizu, setEditingBizu] = useState<Bizu | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.trim().length > 2) {
      setShowResults(true);
    } else if (debouncedQuery.trim().length === 0) {
      setShowResults(false);
    }
  }, [debouncedQuery]);

  const { data: searchResults, isLoading: searchLoading, error: searchError } = useQuery<Bizu[]>({
    queryKey: ['/api/bizus', { q: debouncedQuery, limit: showMore ? 20 : 3 }],
    enabled: debouncedQuery.trim().length > 2,
  });

  const isLoading = searchLoading;
  const error = searchError;
  const displayResults = searchResults;

  // LOG para debug do erro #130
  console.log('displayResults:', displayResults);
  
  // Fallback defensivo para evitar erro React #130
  const safeDisplayResults = Array.isArray(displayResults) ? displayResults : [];
  
  // Garantir que todos os bizus tenham as propriedades necessárias
  const validatedResults = safeDisplayResults.map(bizu => ({
    id: bizu.id || '',
    title: bizu.title || '',
    category: bizu.category || '',
    keywords: Array.isArray(bizu.keywords) ? bizu.keywords : [],
    content: bizu.content || '',
    image_url: bizu.image_url || undefined, // Converter null para undefined
    views: typeof bizu.views === 'number' ? bizu.views : 0,
    likes: typeof bizu.likes === 'number' ? bizu.likes : 0,
    created_at: bizu.created_at || new Date().toISOString(),
    author_id: bizu.author_id || '',
    is_liked: typeof bizu.is_liked === 'boolean' ? bizu.is_liked : false,
  }));

  // Mutations para like/unlike
  const likeMutation = useMutation({
    mutationFn: async (bizuId: string) => {
      const response = await fetch(`/api/bizus/${bizuId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Erro ao curtir bizu');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bizus'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bizus/top'] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async (bizuId: string) => {
      const response = await fetch(`/api/bizus/${bizuId}/like`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Erro ao descurtir bizu');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bizus'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bizus/top'] });
    },
  });

  // Mutation para edição
  const editMutation = useMutation({
    mutationFn: async ({ bizuId, bizuData }: { bizuId: string; bizuData: Partial<Bizu> }) => {
      const response = await fetch(`/api/bizus/${bizuId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bizuData),
      });
      if (!response.ok) throw new Error('Erro ao editar bizu');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Bizu editado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/bizus'] });
      setShowEditModal(false);
      setEditingBizu(null);
    },
    onError: (error) => {
      toast({ 
        title: 'Erro', 
        description: error instanceof Error ? error.message : 'Erro ao editar bizu',
        variant: 'destructive'
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleLike = (bizuId: string) => {
    if (!profile) {
      toast({ 
        title: 'Ação necessária', 
        description: 'Faça login para curtir bizus',
        variant: 'destructive'
      });
      return;
    }

    const bizu = validatedResults.find(b => b.id === bizuId);
    if (bizu?.is_liked) {
      unlikeMutation.mutate(bizuId);
    } else {
      likeMutation.mutate(bizuId);
    }
  };

  const handleEdit = (bizu: Bizu) => {
    if (!profile) {
      toast({ 
        title: 'Ação necessária', 
        description: 'Faça login para editar bizus',
        variant: 'destructive'
      });
      return;
    }

    const canEdit = isAdmin || bizu.author_id === profile.id;
    if (!canEdit) {
      toast({ 
        title: 'Sem permissão', 
        description: 'Você só pode editar seus próprios bizus',
        variant: 'destructive'
      });
      return;
    }

    setEditingBizu(bizu);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (bizuId: string, bizuData: Partial<Bizu>) => {
    editMutation.mutate({ bizuId, bizuData });
  };

  // Componente de erro
  const ErrorMessage = () => (
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon}>⚠️</div>
      <h3 className={styles.errorTitle}>Erro de Conexão</h3>
      <p className={styles.errorMessage}>
        Não foi possível conectar ao banco de dados. Verifique se as configurações do Supabase estão corretas.
      </p>
      <div className={styles.errorDetails}>
        <p><strong>Para resolver:</strong></p>
        <ol>
          <li>Crie um arquivo <code>.env.local</code> na raiz do projeto</li>
          <li>Adicione as variáveis do Supabase:</li>
          <li><code>NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co</code></li>
          <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima</code></li>
          <li>Reinicie o servidor de desenvolvimento</li>
        </ol>
        <p><strong>Obtenha essas informações em:</strong> <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">https://supabase.com</a> → Seu Projeto → Settings → API</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Header e Barra de Pesquisa */}
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.bizuRed}>B</span>
            <span className={styles.bizuBlue}>i</span>
            <span className={styles.bizuYellow}>z</span>
            <span className={styles.bizuBlue}>u</span>
            <span className={styles.bizuGreen}> do</span>
            <span className={styles.bizuRed}> S</span>
            <span className={styles.bizuYellow}>u</span>
            <span className={styles.bizuBlue}>p</span>
            <span className={styles.bizuGreen}>o</span>
            <span className={styles.bizuRed}>r</span>
            <span className={styles.bizuYellow}>t</span>
            <span className={styles.bizuBlue}>e</span>
          </h1>
          <p className={styles.subtitle}>Encontre soluções rápidas para o dia a dia do suporte</p>
        </div>
        
        {/* Search Bar */}
        <div className={styles.searchBar}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Qual é o bizu?"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className={styles.searchBtn}
            >
              🔍
            </Button>
          </form>
        </div>
        
        {/* Botões de ação */}
        <div className={styles.actionButtons}>
          <button
            onClick={onNovoBizuClick}
            className={styles.novoBizuBtn}
          >
            + Novo Bizu
          </button>
          
          <Link href="/bizus" className={styles.verTodosBtn}>
            Ver Todos os Bizus
          </Link>
        </div>
        
        {/* Resultados de busca (apenas quando há busca ativa) */}
        {showResults && (
          <div style={{ width: '100%', maxWidth: 800, margin: '0 auto', marginTop: 32 }}>
            {error ? (
              <ErrorMessage />
            ) : isLoading ? (
              <div style={{ textAlign: 'center', color: '#888' }}>Carregando...</div>
            ) : validatedResults && validatedResults.length > 0 ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ color: '#666', fontSize: 14 }}>
                    {validatedResults.length} resultado{validatedResults.length !== 1 ? 's' : ''} encontrado{validatedResults.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {validatedResults.map((bizu) => (
                    <BizuCard
                      key={bizu.id}
                      bizu={bizu}
                      onClick={() => {
                        setSelectedBizu(bizu);
                        setShowDetailModal(true);
                      }}
                      onLike={handleLike}
                      onEdit={handleEdit}
                      canEdit={isAdmin || bizu.author_id === profile?.id}
                    />
                  ))}
                </div>
                {!showMore && validatedResults.length >= 3 && (
                  <div style={{ textAlign: 'center', marginTop: 32 }}>
                    <Button
                      variant="outline"
                      className={styles.novoBizuBtn}
                      onClick={() => setShowMore(true)}
                    >
                      Ver mais bizus
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <p style={{ color: '#888' }}>
                  Nenhum bizu encontrado para &quot;{debouncedQuery}&quot;.
                </p>
                <p style={{ color: '#bbb', fontSize: 13, marginTop: 8 }}>
                  Tente usar palavras-chave diferentes ou verifique a ortografia.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      {showDetailModal && (
        <BizuDetailModal
          bizu={selectedBizu}
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
        />
      )}

      {/* Modal de edição */}
      {showEditModal && (
        <EditBizuModal
          bizu={editingBizu}
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
}

export function SearchPage(props: SearchPageProps) {
  return <SearchPageContent {...props} />;
} 