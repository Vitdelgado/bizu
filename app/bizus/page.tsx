'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBizus } from '@/hooks/use-bizus';
import { BizuCard } from '@/components/bizu-card';
import { BizuDetailModal } from '@/components/bizu-detail-modal';
import { CreateBizuModal } from '@/components/create-bizu-modal';
import { AuthModal } from '@/components/auth-modal';
import { Bizu } from '@/components/bizu-card';
import Link from 'next/link';
import styles from './page.module.css';

export default function BizusPage() {
  const { profile, loading } = useAuth();
  const { bizus, loading: bizusLoading } = useBizus();
  const [selectedBizu, setSelectedBizu] = useState<Bizu | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateBizuModal, setShowCreateBizuModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar bizus baseado na busca
  const filteredBizus = bizus.filter(bizu =>
    bizu.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bizu.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bizu.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bizu.keywords.some(keyword => 
      keyword.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleNovoBizuClick = () => {
    if (profile) {
      setShowCreateBizuModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header da página */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>
              Home
            </Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent}>Todos os Bizus</span>
          </div>
          
          <h1 className={styles.title}>Todos os Bizus</h1>
          <p className={styles.subtitle}>
            Encontre soluções rápidas para o dia a dia do suporte
          </p>
        </div>
      </div>

      {/* Barra de busca e ações */}
      <div className={styles.actionsBar}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar bizus..."
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>
        
        <button
          onClick={handleNovoBizuClick}
          className={styles.novoBizuBtn}
        >
          + Novo Bizu
        </button>
      </div>

      {/* Estatísticas */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{filteredBizus.length}</span>
          <span className={styles.statLabel}>Bizus encontrados</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{bizus.length}</span>
          <span className={styles.statLabel}>Total de bizus</span>
        </div>
      </div>

      {/* Lista de bizus */}
      <div className={styles.content}>
        {bizusLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Carregando bizus...</p>
          </div>
        ) : filteredBizus.length > 0 ? (
          <div className={styles.bizusGrid}>
            {filteredBizus.map((bizu) => (
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
        ) : searchQuery ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h3 className={styles.emptyTitle}>Nenhum bizu encontrado</h3>
            <p className={styles.emptyMessage}>
              Não encontramos bizus para &quot;{searchQuery}&quot;. Tente usar palavras-chave diferentes.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className={styles.clearSearchBtn}
            >
              Limpar busca
            </button>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <h3 className={styles.emptyTitle}>Nenhum bizu cadastrado</h3>
            <p className={styles.emptyMessage}>
              Seja o primeiro a criar um bizu e ajudar outros membros da equipe!
            </p>
            <button
              onClick={handleNovoBizuClick}
              className={styles.novoBizuBtn}
            >
              Criar primeiro bizu
            </button>
          </div>
        )}
      </div>

      {/* Modais */}
      {showDetailModal && selectedBizu && (
        <BizuDetailModal
          bizu={selectedBizu}
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
        />
      )}

      {showCreateBizuModal && (
        <CreateBizuModal
          open={showCreateBizuModal}
          onOpenChange={setShowCreateBizuModal}
        />
      )}

      {showAuthModal && (
        <AuthModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
        />
      )}
    </div>
  );
} 