import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cache headers para diferentes tipos de resposta
const getCacheHeaders = (maxAge: number = 300) => ({
  'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge * 2}`,
  'ETag': `"${Date.now()}"`, // ETag simples baseado no timestamp
});

// GET: Listar ou buscar bizus
export async function GET(req: NextRequest) {
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
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const q = searchParams.get('q');
  const limit = Number(searchParams.get('limit')) || 20;

  try {
    if (id) {
      // Buscar bizu por ID - cache mais longo para dados específicos
      const { data, error } = await supabase
        .from('bizus')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json(data, {
        headers: getCacheHeaders(600), // 10 minutos para bizus específicos
      });
    }

    let query = supabase
      .from('bizus')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (q) {
      query = query.or(`title.ilike.%${q}%,category.ilike.%${q}%,keywords.cs.{${q}},content.ilike.%${q}%`);
    }

    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Cache mais curto para listas que podem mudar frequentemente
    const cacheTime = q ? 60 : 300; // 1 min para buscas, 5 min para listas
    
    return NextResponse.json(data, {
      headers: getCacheHeaders(cacheTime),
    });
  } catch (error) {
    console.error('Erro na API GET bizus:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// POST: Criar novo bizu
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Verificar se o usuário está autenticado via header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Token não fornecido');
      return NextResponse.json({ error: 'Token não fornecido.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Criar cliente Supabase com token e cookies
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
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('🔍 Verificando autenticação:', { user: user?.id, error: authError });
    
    if (authError || !user) {
      console.log('❌ Usuário não autenticado');
      return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }
    const { title, category, keywords, content, image_url } = body;
    
    // Validação dos campos obrigatórios
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Título é obrigatório.' }, { status: 400 });
    }
    if (!category?.trim()) {
      return NextResponse.json({ error: 'Categoria é obrigatória.' }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Conteúdo é obrigatório.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const bizuData = {
      title: title.trim(),
      category: category.trim(),
      keywords: Array.isArray(keywords) ? keywords : [],
      content: content.trim(),
      image_url: image_url?.trim() || null,
      author_id: user.id, // Usar o ID do usuário autenticado
      created_at: now,
      updated_at: now
    };

    const { data, error } = await supabase
      .from('bizus')
      .insert([bizuData])
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao criar bizu:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Headers para invalidar cache
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Erro na API POST bizus:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// PATCH: Editar bizu
export async function PATCH(req: NextRequest) {
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
  
  try {
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...fields } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 });
    }

    const updateData = {
      ...fields,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('bizus')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao atualizar bizu:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Headers para invalidar cache
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Erro na API PATCH bizus:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// DELETE: Remover bizu
export async function DELETE(req: NextRequest) {
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
  
  try {
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('bizus')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar bizu:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Headers para invalidar cache
    return NextResponse.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Erro na API DELETE bizus:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
} 