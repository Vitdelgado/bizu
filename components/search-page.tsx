import { useState, useEffect } from 'react';
import styles from './search-page.module.css';
import { useQuery } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Bizu, BizuCard } from './bizu-card';
import { BizuDetailModal } from './bizu-detail-modal';

interface SearchPageProps {
  onGoToAdmin?: () => void;
}

export function SearchPage({ onGoToAdmin }: SearchPageProps) {
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

  const { data: searchResults, isLoading: searchLoading } = useQuery<Bizu[]>({
    queryKey: ['/api/bizus/search', { q: debouncedQuery, limit: showMore ? 20 : 3 }],
    enabled: debouncedQuery.trim().length > 2,
  });

  const { data: recentBizus, isLoading: recentLoading } = useQuery<Bizu[]>({
    queryKey: ['/api/bizus', { limit: 3 }],
    enabled: !showResults,
  });

  const isLoading = searchLoading || recentLoading;
  const displayResults = showResults ? searchResults : recentBizus;

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
      
      {/* Quick Links */}
      <div className={styles.quickLinks}>
        <button
          onClick={onGoToAdmin}
          className={styles.novoBizuBtn}
        >
          + Novo Bizu
        </button>
        <a
          href="https://help.curseduca.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkBtn}
        >
          Help Curseduca
        </a>
        <a
          href="https://education.curseduca.pro/login"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkBtn}
        >
          Treinamento de Suporte
        </a>
      </div>
      
      {/* Resultados */}
      <div style={{ width: '100%', maxWidth: 800, margin: '0 auto', marginTop: 32 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', color: '#888' }}>Carregando...</div>
        ) : displayResults && displayResults.length > 0 ? (
          <>
            {showResults && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: '#666', fontSize: 14 }}>
                  {displayResults.length} resultado{displayResults.length !== 1 ? 's' : ''} encontrado{displayResults.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {displayResults.map((bizu) => (
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
            {showResults && !showMore && displayResults.length >= 3 && (
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
      
      {/* Modal de detalhe do bizu */}
      <BizuDetailModal
        bizu={selectedBizu}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
      />
    </div>
  );
} 