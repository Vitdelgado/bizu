'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBizus } from '@/hooks/use-bizus';
import { useLikes } from '@/hooks/use-likes';
import { UserManagement } from './user-management';
import { BizuCard } from './bizu-card';
import { EditBizuModal } from './edit-bizu-modal';
import { Bizu } from './bizu-card';
import styles from './admin-page.module.css';

type AdminSection = 'usuarios' | 'bizus' | 'auditoria';

export function AdminPage() {
  const { profile, isAdmin, loading } = useAuth();
  const { bizus, loading: bizusLoading, updateBizu, deleteBizu, canEdit, canDelete } = useBizus();
  const { likeBizu, isLiked, getLikeCount, setInitialLikeState } = useLikes();
  const [activeSection, setActiveSection] = useState<AdminSection>('bizus');
  const [selectedBizu, setSelectedBizu] = useState<Bizu | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Inicializar estado de likes quando bizus carregam
  useEffect(() => {
    if (bizus.length > 0) {
      bizus.forEach(bizu => {
        setInitialLikeState(bizu.id, bizu.is_liked || false, bizu.likes);
      });
    }
  }, [bizus, setInitialLikeState]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Acesso Negado</h2>
          <p>Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Acesso Negado</h2>
          <p>Você precisa ser administrador para acessar esta página.</p>
          <p>Seu role atual: <strong>{profile.role}</strong></p>
        </div>
      </div>
    );
  }

  // Bizus com estado de like atualizado
  const bizusWithLikes = bizus.map(bizu => ({
    ...bizu,
    is_liked: isLiked(bizu.id),
    likes: getLikeCount(bizu.id) || bizu.likes
  }));

  const handleEditBizu = (bizu: Bizu) => {
    setSelectedBizu(bizu);
    setShowEditModal(true);
  };

  const handleDeleteBizu = async (bizuId: string) => {
    try {
      await deleteBizu(bizuId);
    } catch (error) {
      console.error('Erro ao deletar bizu:', error);
    }
  };

  const handleSaveBizu = async (bizuId: string, bizuData: Partial<Bizu>) => {
    await updateBizu(bizuId, bizuData);
    setShowEditModal(false);
    setSelectedBizu(null);
  };

  const handleLike = async (bizuId: string) => {
    await likeBizu(bizuId);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'usuarios':
        return <UserManagement />;
      
      case 'bizus':
        return (
          <div className={styles.bizusSection}>
            <h2>Bizus Cadastrados</h2>
            {bizusLoading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Carregando bizus...</p>
              </div>
            ) : bizusWithLikes.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Nenhum bizu cadastrado ainda.</p>
              </div>
            ) : (
              <div className={styles.bizusGrid}>
                {bizusWithLikes.map((bizu) => (
                  <BizuCard 
                    key={bizu.id} 
                    bizu={bizu}
                    onLike={handleLike}
                    onEdit={handleEditBizu}
                    onDelete={handleDeleteBizu}
                    canEdit={canEdit(bizu)}
                    canDelete={canDelete(bizu)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      
      case 'auditoria':
        return (
          <div className={styles.auditSection}>
            <h2>Logs de Auditoria</h2>
            <div className={styles.auditPlaceholder}>
              <p>Funcionalidade de auditoria em desenvolvimento</p>
              <p>Em breve você poderá visualizar logs de atividades do sistema.</p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Painel Admin</h1>
        
        <div className={styles.navigation}>
          <button
            className={`${styles.navButton} ${activeSection === 'usuarios' ? styles.active : ''}`}
            onClick={() => setActiveSection('usuarios')}
          >
            Usuários
          </button>
          <button
            className={`${styles.navButton} ${activeSection === 'bizus' ? styles.active : ''}`}
            onClick={() => setActiveSection('bizus')}
          >
            Bizus
          </button>
          <button
            className={`${styles.navButton} ${activeSection === 'auditoria' ? styles.active : ''}`}
            onClick={() => setActiveSection('auditoria')}
          >
            Auditoria
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {renderContent()}
      </div>

      {/* Modal de edição */}
      {showEditModal && selectedBizu && (
        <EditBizuModal
          bizu={selectedBizu}
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSave={handleSaveBizu}
        />
      )}
    </div>
  );
} 