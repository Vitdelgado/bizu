import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('id');
  const email = searchParams.get('email');
  if (userId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } else if (email) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } else {
    // Listar todos os usuários
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role');
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, role } = body;
  if (!id || !role) {
    return NextResponse.json({ error: 'Missing id or role' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id)
    .select('id, email, role')
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('id');
  if (!userId) {
    return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
  }
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 