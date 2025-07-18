'use client';

import { useState } from 'react';
import { useUsers } from '@/hooks/use-users';
import { useAuth } from '@/hooks/use-auth';
import styles from './user-management.module.css';

export function UserManagement() {
  const { users, loading, error, promoteUser, deleteUser } = useUsers();
  const { profile } = useAuth();
  const [promoting, setPromoting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handlePromote = async (userId: string, newRole: 'admin' | 'suporte') => {
    try {
      setPromoting(userId);
      await promoteUser(userId, newRole);
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
    } finally {
      setPromoting(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) {
      return;
    }

    try {
      setDeleting(userId);
      await deleteUser(userId);
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h2>Gestão de Usuários</h2>
        <div className={styles.loading}>Carregando usuários...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h2>Gestão de Usuários</h2>
        <div className={styles.error}>Erro: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Gestão de Usuários</h2>
      <p className={styles.subtitle}>
        Gerencie os usuários do sistema. Apenas administradores podem ver esta área.
      </p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{users.length}</span>
          <span className={styles.statLabel}>Total de Usuários</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>
            {users.filter(u => u.role === 'admin').length}
          </span>
          <span className={styles.statLabel}>Administradores</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>
            {users.filter(u => u.role === 'suporte').length}
          </span>
          <span className={styles.statLabel}>Suporte</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome/Email</th>
              <th>Telefone</th>
              <th>Role</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={styles.tableRow}>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>
                      {user.name || 'Nome não informado'}
                    </div>
                    <div className={styles.userEmail}>{user.email}</div>
                  </div>
                </td>
                <td>{user.phone || 'Não informado'}</td>
                <td>
                  <span className={`${styles.role} ${styles[user.role]}`}>
                    {user.role === 'admin' ? 'Administrador' : 'Suporte'}
                  </span>
                </td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                  <div className={styles.actions}>
                    {user.id !== profile?.id && (
                      <>
                        {user.role === 'suporte' ? (
                          <button
                            className={`${styles.button} ${styles.promoteButton}`}
                            onClick={() => handlePromote(user.id, 'admin')}
                            disabled={promoting === user.id}
                          >
                            {promoting === user.id ? 'Promovendo...' : 'Promover a Admin'}
                          </button>
                        ) : (
                          <button
                            className={`${styles.button} ${styles.demoteButton}`}
                            onClick={() => handlePromote(user.id, 'suporte')}
                            disabled={promoting === user.id}
                          >
                            {promoting === user.id ? 'Rebaixando...' : 'Rebaixar a Suporte'}
                          </button>
                        )}
                        <button
                          className={`${styles.button} ${styles.deleteButton}`}
                          onClick={() => handleDelete(user.id)}
                          disabled={deleting === user.id}
                        >
                          {deleting === user.id ? 'Deletando...' : 'Deletar'}
                        </button>
                      </>
                    )}
                    {user.id === profile?.id && (
                      <span className={styles.currentUser}>Você</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className={styles.empty}>
          <p>Nenhum usuário encontrado.</p>
        </div>
      )}
    </div>
  );
} 