import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');

    // Buscar top bizus por likes
    let query = supabase
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

    // Se há um usuário logado, verificar quais bizus ele curtiu
    if (userId && bizus && bizus.length > 0) {
      const bizuIds = bizus.map(b => b.id);
      
      const { data: userLikes } = await supabase
        .from('bizu_likes')
        .select('bizu_id')
        .eq('user_id', userId)
        .in('bizu_id', bizuIds);

      const likedBizuIds = new Set(userLikes?.map(like => like.bizu_id) || []);

      // Adicionar flag is_liked para cada bizu
      const bizusWithLikes = bizus.map(bizu => ({
        ...bizu,
        is_liked: likedBizuIds.has(bizu.id)
      }));

      return NextResponse.json(bizusWithLikes);
    }

    return NextResponse.json(bizus || []);
  } catch (error) {
    console.error('Erro na API de top bizus:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 