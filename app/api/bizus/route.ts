import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Listar ou buscar bizus
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const q = searchParams.get('q');
  const limit = Number(searchParams.get('limit')) || 20;

  if (id) {
    // Buscar bizu por ID
    const { data, error } = await supabase
      .from('bizus')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: Criar novo bizu
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, category, keywords, content, image_url, author_id } = body;
  if (!title || !category || !keywords || !content || !author_id) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('bizus')
    .insert([{ title, category, keywords, content, image_url, author_id }])
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH: Editar bizu
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 });
  const { data, error } = await supabase
    .from('bizus')
    .update(fields)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE: Remover bizu
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 });
  const { error } = await supabase
    .from('bizus')
    .delete()
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
} 