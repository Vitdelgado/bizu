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
    let mounted = true;

    // Timeout de segurança para evitar loading infinito
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('⚠️ Timeout de segurança: forçando loading = false');
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    }, 10000); // 10 segundos

    // Verificar sessão inicial
    const checkSession = async (retryCount = 0) => {
      try {
        console.log(`🔐 Verificando sessão inicial... (tentativa ${retryCount + 1})`);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao obter sessão:', error);
          if (mounted) {
            setAuthState(prev => ({ ...prev, loading: false }));
          }
          return;
        }

        console.log('📋 Sessão encontrada:', session ? 'Sim' : 'Não');
        
        if (mounted && session?.user) {
          console.log('👤 Usuário na sessão:', session.user.id);
          setAuthState(prev => ({ ...prev, user: session.user }));
          await fetchUserProfile(session.user.id);
        } else if (mounted) {
          console.log('❌ Nenhum usuário na sessão');
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('❌ Erro ao verificar sessão:', error);
        
        // Retry até 3 vezes em caso de erro de rede
        if (retryCount < 3 && mounted) {
          console.log(`🔄 Tentando novamente em 1 segundo... (${retryCount + 1}/3)`);
          setTimeout(() => checkSession(retryCount + 1), 1000);
        } else if (mounted) {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      }
    };

    checkSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Mudança de autenticação:', event, session?.user?.id);
        
        if (!mounted) return;
        
        if (session?.user) {
          console.log('✅ Usuário autenticado:', session.user.id);
          setAuthState(prev => ({ ...prev, user: session.user }));
          await fetchUserProfile(session.user.id);
        } else {
          console.log('❌ Usuário desautenticado');
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

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('👤 Buscando perfil do usuário:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        setAuthState(prev => ({ 
          ...prev, 
          profile: null,
          loading: false,
          isAdmin: false,
          isSuporte: false
        }));
        return;
      }

      console.log('✅ Perfil carregado:', data);
      setAuthState(prev => ({
        ...prev,
        profile: data,
        loading: false,
        isAdmin: data.role === 'admin',
        isSuporte: data.role === 'suporte',
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar perfil:', error);
      setAuthState(prev => ({ 
        ...prev, 
        profile: null,
        loading: false,
        isAdmin: false,
        isSuporte: false
      }));
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Tentando fazer login:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
    console.log('✅ Login realizado com sucesso');
  };

  const signUp = async (email: string, password: string, userData?: SignUpData) => {
    console.log('📝 Tentando criar conta:', email);
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
    
    if (error) {
      console.error('❌ Erro no cadastro:', error);
      throw error;
    }
    
    console.log('✅ Cadastro realizado com sucesso');
    
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
          console.error('❌ Erro ao criar perfil do usuário:', profileError);
          // Não vamos lançar erro aqui, pois o usuário já foi criado no auth
        } else {
          console.log('✅ Perfil do usuário criado com sucesso');
        }
      } catch (profileError) {
        console.error('❌ Erro ao criar perfil do usuário:', profileError);
      }
    }
  };

  const signOut = async () => {
    console.log('🚪 Tentando fazer logout');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Erro no logout:', error);
      throw error;
    }
    console.log('✅ Logout realizado com sucesso');
  };

  // Garantir que não retornamos objetos inválidos
  const safeAuthState = {
    user: authState.user,
    profile: authState.profile,
    loading: authState.loading,
    isAdmin: Boolean(authState.isAdmin),
    isSuporte: Boolean(authState.isSuporte),
    signIn,
    signUp,
    signOut,
  };

  return safeAuthState;
} 