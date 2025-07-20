import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');

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

    // Buscar top bizus por likes
    const query = supabase
      .from('bizus')
      .select(`
        id,
        title,
        category,
        keywords,
        content,
        image_url,
        author_id,
        likes,
        views,
        created_at,
        updated_at
      `)
      .order('likes', { ascending: false })
      .order('views', { ascending: false })
      .limit(limit);

    const { data: bizus, error } = await query;

    if (error) {
      console.error('Erro ao buscar top bizus:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Se não há bizus, retornar array vazio
    if (!bizus || bizus.length === 0) {
      return NextResponse.json([]);
    }

    // Se há um usuário logado, verificar quais bizus ele curtiu
    if (userId) {
      try {
        const bizuIds = bizus.map(b => b.id);
        
        const { data: userLikes, error: likesError } = await supabase
          .from('bizu_likes')
          .select('bizu_id')
          .eq('user_id', userId)
          .in('bizu_id', bizuIds);

        if (likesError) {
          console.warn('Erro ao buscar likes do usuário:', likesError);
          // Se não conseguir buscar likes, retornar bizus sem flag de like
          return NextResponse.json(bizus);
        }

        const likedBizuIds = new Set(userLikes?.map(like => like.bizu_id) || []);

        // Adicionar flag is_liked para cada bizu
        const bizusWithLikes = bizus.map(bizu => ({
          ...bizu,
          is_liked: likedBizuIds.has(bizu.id)
        }));

        return NextResponse.json(bizusWithLikes);
      } catch (likesError) {
        console.warn('Erro ao processar likes:', likesError);
        // Se houver erro ao processar likes, retornar bizus sem flag
        return NextResponse.json(bizus);
      }
    }

    return NextResponse.json(bizus);
  } catch (error) {
    console.error('Erro na API de top bizus:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 