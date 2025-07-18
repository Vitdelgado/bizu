'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBizus } from '@/hooks/use-bizus';
import { AuthModal } from '@/components/auth-modal';
import { BizuCard } from '@/components/bizu-card';
import { SearchPage } from '@/components/search-page';
import { AdminPage } from '@/components/admin-page';
import styles from './page.module.css';

export default function Home() {
  const { profile, loading, isAdmin } = useAuth();
  const { bizus, loading: bizusLoading } = useBizus();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (showAdmin && isAdmin) {
    return <AdminPage />;
  }

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>Bizu Desk</h1>
        <p className={styles.subtitle}>Sistema de Conhecimento para o Time de Suporte</p>
        
        <div className={styles.authSection}>
          {profile ? (
            <div className={styles.userInfo}>
              <span className={styles.welcome}>
                Olá, {profile.name || profile.email}
              </span>
              <span className={`${styles.role} ${styles[profile.role]}`}>
                {profile.role === 'admin' ? 'Administrador' : 'Suporte'}
              </span>
              {isAdmin && (
                <button
                  onClick={() => setShowAdmin(true)}
                  className={styles.adminButton}
                >
                  Painel Admin
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className={styles.loginButton}
            >
              Entrar
            </button>
          )}
        </div>
      </div>

      <SearchPage />

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

      {showAuthModal && (
        <AuthModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
        />
      )}
    </main>
  );
}
