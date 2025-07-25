'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBizus } from '@/hooks/use-bizus';
import { useLikes } from '@/hooks/use-likes';
import { BizuCard } from '@/components/bizu-card';
import { BizuDetailModal } from '@/components/bizu-detail-modal';
import { CreateBizuModal } from '@/components/create-bizu-modal';
import { EditBizuModal } from '@/components/edit-bizu-modal';
import { AuthModal } from '@/components/auth-modal';
import { Bizu } from '@/components/bizu-card';
import Link from 'next/link';
import styles from './page.module.css';

export default function BizusPage() {
  const { profile, loading } = useAuth();
  const { bizus, loading: bizusLoading, updateBizu, deleteBizu, canEdit, canDelete } = useBizus();
  const { likeBizu, isLiked, getLikeCount, setInitialLikeState } = useLikes();
  const [selectedBizu, setSelectedBizu] = useState<Bizu | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateBizuModal, setShowCreateBizuModal] = useState(false);
  const [showEditBizuModal, setShowEditBizuModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Inicializar estado de likes quando bizus carregam
  useEffect(() => {
    bizus.forEach(bizu => {
      setInitialLikeState(bizu.id, bizu.is_liked || false, bizu.likes);
    });
  }, [bizus, setInitialLikeState]);

  // Filtrar bizus baseado na busca
  const filteredBizus = bizus.filter(bizu =>
    bizu.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bizu.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bizu.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bizu.keywords.some(keyword => 
      keyword.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Bizus com estado de like atualizado
  const bizusWithLikes = filteredBizus.map(bizu => ({
    ...bizu,
    is_liked: isLiked(bizu.id),
    likes: getLikeCount(bizu.id) || bizu.likes
  }));

  const handleNovoBizuClick = () => {
    if (profile) {
      setShowCreateBizuModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleEditBizu = (bizu: Bizu) => {
    if (canEdit(bizu)) {
      setSelectedBizu(bizu);
      setShowEditBizuModal(true);
    }
  };

  const handleSaveBizu = async (bizuId: string, bizuData: Partial<Bizu>) => {
    await updateBizu(bizuId, bizuData);
    setShowEditBizuModal(false);
    setSelectedBizu(null);
  };

  const handleDeleteBizu = async (bizuId: string) => {
    try {
      await deleteBizu(bizuId);
      // Se o bizu deletado era o selecionado, fechar o modal
      if (selectedBizu?.id === bizuId) {
        setShowDetailModal(false);
        setShowEditBizuModal(false);
        setSelectedBizu(null);
      }
    } catch (error) {
      console.error('Erro ao deletar bizu:', error);
    }
  };

  const handleLike = async (bizuId: string) => {
    await likeBizu(bizuId);
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
          <span className={styles.statNumber}>{bizusWithLikes.length}</span>
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
        ) : bizusWithLikes.length > 0 ? (
          <div className={styles.bizusGrid}>
            {bizusWithLikes.map((bizu) => (
              <BizuCard
                key={bizu.id}
                bizu={bizu}
                onClick={() => {
                  setSelectedBizu(bizu);
                  setShowDetailModal(true);
                }}
                onLike={handleLike}
                onEdit={handleEditBizu}
                onDelete={handleDeleteBizu}
                canEdit={canEdit(bizu)}
                canDelete={canDelete(bizu)}
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
          onEdit={handleEditBizu}
          onDelete={handleDeleteBizu}
          onLike={handleLike}
          canEdit={canEdit(selectedBizu)}
          canDelete={canDelete(selectedBizu)}
        />
      )}

      {showCreateBizuModal && (
        <CreateBizuModal
          open={showCreateBizuModal}
          onOpenChange={setShowCreateBizuModal}
        />
      )}

      {showEditBizuModal && selectedBizu && (
        <EditBizuModal
          bizu={selectedBizu}
          open={showEditBizuModal}
          onOpenChange={setShowEditBizuModal}
          onSave={handleSaveBizu}
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