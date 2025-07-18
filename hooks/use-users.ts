import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'admin' | 'suporte';
  created_at: string;
  updated_at?: string;
}

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  promoteUser: (userId: string, newRole: 'admin' | 'suporte') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  const promoteUser = async (userId: string, newRole: 'admin' | 'suporte') => {
    try {
      setError(null);

      const { error } = await supabase.rpc('promote_demote_user', {
        p_user_id: userId,
        p_new_role: newRole,
        p_performed_by: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) {
        throw error;
      }

      // Atualizar lista local
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole, updated_at: new Date().toISOString() } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar role do usuário');
      console.error('Erro ao promover usuário:', err);
      throw err;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Remover da lista local
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar usuário');
      console.error('Erro ao deletar usuário:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    promoteUser,
    deleteUser,
    refreshUsers: fetchUsers,
  };
} 