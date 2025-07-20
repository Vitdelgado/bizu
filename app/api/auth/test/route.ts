import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    console.log('🍪 Cookies disponíveis:', cookieStore.getAll().map(c => c.name));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Verificar sessão
    console.log('🔐 Verificando sessão...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError);
      return NextResponse.json({ 
        error: 'Erro ao obter sessão',
        details: sessionError.message 
      }, { status: 500 });
    }
    
    // Verificar usuário
    console.log('👤 Verificando usuário...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Erro ao obter usuário:', userError);
      return NextResponse.json({ 
        error: 'Erro ao obter usuário',
        details: userError.message 
      }, { status: 500 });
    }
    
    if (!session || !user) {
      console.log('❌ Nenhuma sessão ou usuário encontrado');
      return NextResponse.json({ 
        authenticated: false,
        message: 'Nenhuma sessão ativa encontrada',
        cookies: cookieStore.getAll().map(c => c.name)
      });
    }
    
    console.log('✅ Usuário autenticado:', user.id);
    
    // Verificar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
    }
    
    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: profile,
      session: {
        expires_at: session.expires_at,
        refresh_token: !!session.refresh_token
      },
      cookies: cookieStore.getAll().map(c => c.name)
    });
  } catch (error) {
    console.error('❌ Erro geral no teste de autenticação:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 