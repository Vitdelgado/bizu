import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bizuId } = await params;
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Verificar se o bizu existe
    const { data: bizu, error: bizuError } = await supabase
      .from('bizus')
      .select('id')
      .eq('id', bizuId)
      .single();

    if (bizuError || !bizu) {
      return NextResponse.json({ error: 'Bizu não encontrado' }, { status: 404 });
    }

    // Verificar se já curtiu
    const { data: existingLike } = await supabase
      .from('bizu_likes')
      .select('id')
      .eq('bizu_id', bizuId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      return NextResponse.json({ error: 'Você já curtiu este bizu' }, { status: 400 });
    }

    // Adicionar like
    const { error: likeError } = await supabase
      .from('bizu_likes')
      .insert({
        bizu_id: bizuId,
        user_id: user.id
      });

    if (likeError) {
      console.error('Erro ao adicionar like:', likeError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Buscar contador atualizado
    const { data: updatedBizu } = await supabase
      .from('bizus')
      .select('likes')
      .eq('id', bizuId)
      .single();

    return NextResponse.json({ 
      success: true, 
      likes: updatedBizu?.likes || 0 
    });
  } catch (error) {
    console.error('Erro na API de like:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bizuId } = await params;
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Verificar se o bizu existe
    const { data: bizu, error: bizuError } = await supabase
      .from('bizus')
      .select('id')
      .eq('id', bizuId)
      .single();

    if (bizuError || !bizu) {
      return NextResponse.json({ error: 'Bizu não encontrado' }, { status: 404 });
    }

    // Remover like
    const { error: unlikeError } = await supabase
      .from('bizu_likes')
      .delete()
      .eq('bizu_id', bizuId)
      .eq('user_id', user.id);

    if (unlikeError) {
      console.error('Erro ao remover like:', unlikeError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Buscar contador atualizado
    const { data: updatedBizu } = await supabase
      .from('bizus')
      .select('likes')
      .eq('id', bizuId)
      .single();

    return NextResponse.json({ 
      success: true, 
      likes: updatedBizu?.likes || 0 
    });
  } catch (error) {
    console.error('Erro na API de unlike:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 