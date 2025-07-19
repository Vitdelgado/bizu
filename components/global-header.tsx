'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AuthModal } from './auth-modal';
import Link from 'next/link';
import styles from './global-header.module.css';

export function GlobalHeader() {
  const { profile, loading, isAdmin } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  if (loading) {
    return null; // Não mostrar cabeçalho durante carregamento
  }

  return (
    <>
      {/* Cabeçalho Fixo */}
      <header className={styles.fixedHeader}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.homeButton}>
            <span className={styles.homeIcon}>🏠</span>
            <span>Home</span>
          </Link>
          
          <div className={styles.headerRight}>
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
                    onClick={() => setShowAdmin(!showAdmin)}
                    className={styles.adminButton}
                  >
                    {showAdmin ? 'Voltar' : 'Painel Admin'}
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.authSection}>
                <Link href="/login" className={styles.loginLink}>
                  Página de Login
                </Link>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className={styles.loginButton}
                >
                  Entrar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showAuthModal && (
        <AuthModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
        />
      )}
    </>
  );
} 