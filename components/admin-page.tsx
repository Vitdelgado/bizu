'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBizus } from '@/hooks/use-bizus';
import { UserManagement } from './user-management';
import { BizuCard } from './bizu-card';
import styles from './admin-page.module.css';

type AdminSection = 'usuarios' | 'bizus' | 'auditoria';

export function AdminPage() {
  const { profile, isAdmin, loading } = useAuth();
  const { bizus, loading: bizusLoading } = useBizus();
  const [activeSection, setActiveSection] = useState<AdminSection>('bizus');

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
            ) : bizus.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Nenhum bizu cadastrado ainda.</p>
              </div>
            ) : (
              <div className={styles.bizusGrid}>
                {bizus.map((bizu) => (
                  <BizuCard key={bizu.id} bizu={bizu} />
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
    </div>
  );
} 