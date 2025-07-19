'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AuthModal } from '@/components/auth-modal';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function LoginPage() {
  const { profile, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  // Se o usuário já está logado, redireciona para a página principal
  useEffect(() => {
    if (!loading && profile) {
      router.push('/');
    }
  }, [profile, loading, router]);

  // Mostra o modal de autenticação automaticamente
  useEffect(() => {
    if (!loading && !profile) {
      setShowAuthModal(true);
    }
  }, [loading, profile]);



  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (profile) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginContent}>
        <div className={styles.loginCard}>
          <h1 className={styles.title}>Entrar no Bizu Desk</h1>
          <p className={styles.subtitle}>
            Faça login para acessar o sistema de conhecimento
          </p>
          
          <button
            onClick={() => setShowAuthModal(true)}
            className={styles.loginButton}
          >
            Fazer Login
          </button>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          open={showAuthModal}
          onOpenChange={(open) => {
            setShowAuthModal(open);
            if (!open) {
              // Se o modal foi fechado sem login, redireciona para a página principal
              router.push('/');
            }
          }}
        />
      )}
    </div>
  );
} 