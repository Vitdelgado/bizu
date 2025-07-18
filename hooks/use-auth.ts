import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'admin' | 'suporte';
  created_at: string;
  updated_at?: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuporte: boolean;
}

interface SignUpData {
  name?: string;
  phone?: string;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isAdmin: false,
    isSuporte: false,
  });

  useEffect(() => {
    // Verificar sessão inicial
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    checkSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            isAdmin: false,
            isSuporte: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
        return;
      }

      setAuthState({
        user: authState.user,
        profile: data,
        loading: false,
        isAdmin: data.role === 'admin',
        isSuporte: data.role === 'suporte',
      });
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, userData?: SignUpData) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          name: userData?.name,
          phone: userData?.phone,
        }
      }
    });
    
    if (error) throw error;
    
    // Se o usuário foi criado com sucesso, criar o perfil na tabela users
    if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email!,
            name: userData?.name || null,
            phone: userData?.phone || null,
            role: 'suporte',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (profileError) {
          console.error('Erro ao criar perfil do usuário:', profileError);
          // Não vamos lançar erro aqui, pois o usuário já foi criado no auth
        }
      } catch (profileError) {
        console.error('Erro ao criar perfil do usuário:', profileError);
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
  };
} 