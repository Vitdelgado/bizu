import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const bizuId = params.id;
    const body = await request.json();
    
    // Verificar se o bizu existe
    const { data: existingBizu, error: fetchError } = await supabase
      .from('bizus')
      .select('author_id')
      .eq('id', bizuId)
      .single();

    if (fetchError || !existingBizu) {
      return NextResponse.json({ error: 'Bizu não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário é o autor ou admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAuthor = existingBizu.author_id === user.id;
    const isAdmin = userProfile?.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Sem permissão para editar este bizu' }, { status: 403 });
    }

    // Preparar dados para atualização
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.title) updateData.title = body.title;
    if (body.category) updateData.category = body.category;
    if (body.keywords) updateData.keywords = body.keywords;
    if (body.content) updateData.content = body.content;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;

    // Atualizar bizu
    const { data, error } = await supabase
      .from('bizus')
      .update(updateData)
      .eq('id', bizuId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar bizu:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Registrar na auditoria
    await supabase
      .from('bizu_edits')
      .insert({
        bizu_id: bizuId,
        editor_id: user.id,
        changes: body
      });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API de edição de bizu:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const bizuId = params.id;
    
    // Verificar se o bizu existe
    const { data: existingBizu, error: fetchError } = await supabase
      .from('bizus')
      .select('author_id')
      .eq('id', bizuId)
      .single();

    if (fetchError || !existingBizu) {
      return NextResponse.json({ error: 'Bizu não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário é o autor ou admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAuthor = existingBizu.author_id === user.id;
    const isAdmin = userProfile?.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Sem permissão para excluir este bizu' }, { status: 403 });
    }

    // Excluir bizu
    const { error } = await supabase
      .from('bizus')
      .delete()
      .eq('id', bizuId);

    if (error) {
      console.error('Erro ao excluir bizu:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na API de exclusão de bizu:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 