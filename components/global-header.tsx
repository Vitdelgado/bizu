'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAdmin } from '@/context/admin-context';
import { AuthModal } from './auth-modal';
import Link from 'next/link';
import styles from './global-header.module.css';

export function GlobalHeader() {
  const { profile, loading, isAdmin, signOut } = useAuth();
  const { showAdmin, toggleAdmin } = useAdmin();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading) {
    return null; // Não mostrar cabeçalho durante carregamento
  }

  // Função para obter classe de role de forma segura
  const getRoleClass = (role?: string) => {
    if (!role || !styles[role]) {
      return styles.suporte; // Fallback para suporte
    }
    return styles[role];
  };

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
            {profile && profile.id ? (
              <div className={styles.userInfo}>
                <span className={styles.welcome}>
                  Olá, {profile.name || profile.email || 'Usuário'}
                </span>
                <span className={`${styles.role} ${getRoleClass(profile?.role)}`}>
                  {profile?.role === 'admin' ? 'Administrador' : 'Suporte'}
                </span>
                {isAdmin && (
                  <button
                    onClick={toggleAdmin}
                    className={styles.adminButton}
                  >
                    {showAdmin ? 'Voltar' : 'Painel Admin'}
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className={styles.logoutButton}
                  title="Sair"
                >
                  <span className={styles.logoutIcon}>🚪</span>
                  <span className={styles.logoutText}>Sair</span>
                </button>
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