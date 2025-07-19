import { useState, useEffect } from 'react';
import styles from './search-page.module.css';
import { useQuery } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Bizu, BizuCard } from './bizu-card';
import { BizuDetailModal } from './bizu-detail-modal';
import { useSafeProps } from './safe-render';

interface SearchPageProps {
  onNovoBizuClick?: () => void;
}

function SearchPageContent({ onNovoBizuClick }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [selectedBizu, setSelectedBizu] = useState<Bizu | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
    queryKey: ['/api/bizus/search', { q: debouncedQuery, limit: showMore ? 20 : 3 }],
    enabled: debouncedQuery.trim().length > 2,
  });

  const { data: recentBizus, isLoading: recentLoading, error: recentError } = useQuery<Bizu[]>({
    queryKey: ['/api/bizus', { limit: 3 }],
    enabled: !showResults,
  });

  const isLoading = searchLoading || recentLoading;
  const error = searchError || recentError;
  const displayResults = showResults ? searchResults : recentBizus;

  // LOG para debug do erro #130
  console.log('displayResults:', displayResults);
  
  // Fallback defensivo para evitar erro React #130
  const safeDisplayResults = Array.isArray(displayResults) ? displayResults : [];

  // Usar props seguras para evitar erro React #130
  const safeProps = useSafeProps({ displayResults: safeDisplayResults }, 'SearchPage');

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
      
      {/* Botão Novo Bizu - Centralizado abaixo da busca */}
      <div className={styles.novoBizuContainer}>
        <button
          onClick={onNovoBizuClick}
          className={styles.novoBizuBtn}
        >
          + Novo Bizu
        </button>
      </div>
      
      {/* Resultados ou Erro */}
      <div style={{ width: '100%', maxWidth: 800, margin: '0 auto', marginTop: 32 }}>
        {error ? (
          <ErrorMessage />
        ) : isLoading ? (
          <div style={{ textAlign: 'center', color: '#888' }}>Carregando...</div>
        ) : safeDisplayResults && safeDisplayResults.length > 0 ? (
          <>
            {showResults && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: '#666', fontSize: 14 }}>
                  {safeDisplayResults.length} resultado{safeDisplayResults.length !== 1 ? 's' : ''} encontrado{safeDisplayResults.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {safeDisplayResults.map((bizu) => (
                <BizuCard
                  key={bizu.id}
                  bizu={bizu}
                  onClick={() => {
                    setSelectedBizu(bizu);
                    setShowDetailModal(true);
                  }}
                />
              ))}
            </div>
            {showResults && !showMore && safeDisplayResults.length >= 3 && (
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
        ) : showResults ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ color: '#888' }}>
              Nenhum bizu encontrado para &quot;{debouncedQuery}&quot;.
            </p>
            <p style={{ color: '#bbb', fontSize: 13, marginTop: 8 }}>
              Tente usar palavras-chave diferentes ou verifique a ortografia.
            </p>
          </div>
        ) : null}
      </div>
      
      {/* Links de rodapé */}
      <div className={styles.footerLinks}>
        <a
          href="https://help.curseduca.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerLink}
        >
          Help Curseduca
        </a>
        <span className={styles.footerSeparator}>•</span>
        <a
          href="https://education.curseduca.pro/login"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerLink}
        >
          Treinamento de Suporte
        </a>
      </div>
      
      {/* Modal de detalhe do bizu */}
      <BizuDetailModal
        bizu={selectedBizu}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
      />
    </div>
  );
}

export function SearchPage(props: SearchPageProps) {
  return <SearchPageContent {...props} />;
} 