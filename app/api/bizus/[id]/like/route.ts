import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bizuId } = await params;
    console.log('🔍 API Like - Iniciando requisição para bizu:', bizuId);
    
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
    
    // Verificar autenticação
    console.log('🔐 Verificando autenticação...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erro de autenticação:', authError);
      return NextResponse.json({ 
        error: 'Erro de autenticação', 
        details: authError.message 
      }, { status: 401 });
    }
    
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return NextResponse.json({ 
        error: 'Não autorizado - Usuário não autenticado' 
      }, { status: 401 });
    }
    
    console.log('✅ Usuário autenticado:', user.id);
    
    // Verificar se o bizu existe
    const { data: bizu, error: bizuError } = await supabase
      .from('bizus')
      .select('id')
      .eq('id', bizuId)
      .single();

    if (bizuError || !bizu) {
      console.error('❌ Bizu não encontrado:', bizuError);
      return NextResponse.json({ error: 'Bizu não encontrado' }, { status: 404 });
    }

    // Verificar se já curtiu
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('bizu_likes')
      .select('id')
      .eq('bizu_id', bizuId)
      .eq('user_id', user.id)
      .single();

    if (likeCheckError && likeCheckError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar like existente:', likeCheckError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    if (existingLike) {
      console.log('⚠️ Usuário já curtiu este bizu');
      return NextResponse.json({ error: 'Você já curtiu este bizu' }, { status: 400 });
    }

    // Adicionar like
    console.log('👍 Adicionando like...');
    const { error: likeError } = await supabase
      .from('bizu_likes')
      .insert({
        bizu_id: bizuId,
        user_id: user.id
      });

    if (likeError) {
      console.error('❌ Erro ao adicionar like:', likeError);
      return NextResponse.json({ 
        error: 'Erro interno do servidor',
        details: likeError.message 
      }, { status: 500 });
    }

    // Buscar contador atualizado
    const { data: updatedBizu, error: countError } = await supabase
      .from('bizus')
      .select('likes')
      .eq('id', bizuId)
      .single();

    if (countError) {
      console.error('❌ Erro ao buscar contador atualizado:', countError);
    }

    console.log('✅ Like adicionado com sucesso. Total de likes:', updatedBizu?.likes || 0);

    return NextResponse.json({ 
      success: true, 
      likes: updatedBizu?.likes || 0 
    });
  } catch (error) {
    console.error('❌ Erro geral na API de like:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bizuId } = await params;
    console.log('🔍 API Unlike - Iniciando requisição para bizu:', bizuId);
    
    const cookieStore = await cookies();
    
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
    
    // Verificar autenticação
    console.log('🔐 Verificando autenticação...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Erro de autenticação:', authError);
      return NextResponse.json({ 
        error: 'Não autorizado - Usuário não autenticado' 
      }, { status: 401 });
    }
    
    console.log('✅ Usuário autenticado:', user.id);
    
    // Verificar se o bizu existe
    const { data: bizu, error: bizuError } = await supabase
      .from('bizus')
      .select('id')
      .eq('id', bizuId)
      .single();

    if (bizuError || !bizu) {
      console.error('❌ Bizu não encontrado:', bizuError);
      return NextResponse.json({ error: 'Bizu não encontrado' }, { status: 404 });
    }

    // Remover like
    console.log('👎 Removendo like...');
    const { error: unlikeError } = await supabase
      .from('bizu_likes')
      .delete()
      .eq('bizu_id', bizuId)
      .eq('user_id', user.id);

    if (unlikeError) {
      console.error('❌ Erro ao remover like:', unlikeError);
      return NextResponse.json({ 
        error: 'Erro interno do servidor',
        details: unlikeError.message 
      }, { status: 500 });
    }

    // Buscar contador atualizado
    const { data: updatedBizu, error: countError } = await supabase
      .from('bizus')
      .select('likes')
      .eq('id', bizuId)
      .single();

    if (countError) {
      console.error('❌ Erro ao buscar contador atualizado:', countError);
    }

    console.log('✅ Like removido com sucesso. Total de likes:', updatedBizu?.likes || 0);

    return NextResponse.json({ 
      success: true, 
      likes: updatedBizu?.likes || 0 
    });
  } catch (error) {
    console.error('❌ Erro geral na API de unlike:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 