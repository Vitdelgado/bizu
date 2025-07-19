'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { UserManagement } from './user-management';
import styles from './admin-page.module.css';

export function AdminPage() {
  const { profile, isAdmin, loading } = useAuth();
  const [showUserManagement, setShowUserManagement] = useState(false);

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

  return (
    <div className={styles.container}>
      <div className={styles.navigation}>
        <button
          className={`${styles.navButton} ${!showUserManagement ? styles.active : ''}`}
          onClick={() => setShowUserManagement(false)}
        >
          Dashboard
        </button>
        <button
          className={`${styles.navButton} ${showUserManagement ? styles.active : ''}`}
          onClick={() => setShowUserManagement(true)}
        >
          Gestão de Usuários
        </button>
      </div>

      <div className={styles.content}>
        {!showUserManagement ? (
          <div className={styles.dashboard}>
            <h2>Dashboard</h2>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <h3>Usuários</h3>
                <p>Gerencie usuários do sistema</p>
                <button
                  className={styles.actionButton}
                  onClick={() => setShowUserManagement(true)}
                >
                  Ver Usuários
                </button>
              </div>
              <div className={styles.stat}>
                <h3>Bizus</h3>
                <p>Visualize e gerencie bizus</p>
                <button
                  className={styles.actionButton}
                  onClick={() => window.location.href = '/'}
                >
                  Ver Bizus
                </button>
              </div>
              <div className={styles.stat}>
                <h3>Auditoria</h3>
                <p>Logs de atividades do sistema</p>
                <button
                  className={styles.actionButton}
                  onClick={() => alert('Funcionalidade de auditoria em desenvolvimento')}
                >
                  Ver Logs
                </button>
              </div>
            </div>
          </div>
        ) : (
          <UserManagement />
        )}
      </div>
    </div>
  );
} 