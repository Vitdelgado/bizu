'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAdmin } from '@/context/admin-context';
import { useBizus } from '@/hooks/use-bizus';
import { AuthModal } from '@/components/auth-modal';
import { BizuCard } from '@/components/bizu-card';
import { SearchPage } from '@/components/search-page';
import { AdminPage } from '@/components/admin-page';
import { CreateBizuModal } from '@/components/create-bizu-modal';
import { ClientOnly } from '@/components/client-only';
import styles from './page.module.css';

function HomeContent() {
  const { profile, loading, isAdmin } = useAuth();
  const { showAdmin } = useAdmin();
  const { bizus, loading: bizusLoading } = useBizus();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateBizuModal, setShowCreateBizuModal] = useState(false);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando...</p>
      </div>
    );
  }

  // Função para lidar com o clique no botão "+ Novo Bizu"
  const handleNovoBizuClick = () => {
    if (profile) {
      // Se o usuário está logado, abre o modal de criação de bizu
      setShowCreateBizuModal(true);
    } else {
      // Se o usuário não está logado, abre o modal de autenticação
      setShowAuthModal(true);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Conteúdo Principal */}
      <main className={styles.mainContent}>
        {showAdmin && isAdmin ? (
          <AdminPage />
        ) : (
          <>
            <SearchPage onNovoBizuClick={handleNovoBizuClick} />

            {bizusLoading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Carregando bizus...</p>
              </div>
            ) : (
              <div className={styles.bizusGrid}>
                {bizus.map((bizu) => (
                  <BizuCard key={bizu.id} bizu={{...bizu, views: 0}} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showAuthModal && (
        <AuthModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
        />
      )}

      {showCreateBizuModal && (
        <CreateBizuModal
          open={showCreateBizuModal}
          onOpenChange={setShowCreateBizuModal}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <ClientOnly fallback={
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando...</p>
      </div>
    }>
      <HomeContent />
    </ClientOnly>
  );
}
