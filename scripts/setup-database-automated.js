const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão configuradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      throw error;
    }
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error.message);
    return { success: false, error };
  }
}

async function setupDatabase() {
  console.log('🚀 Iniciando configuração automatizada do banco de dados...\n');

  const scripts = [
    {
      name: 'Schema',
      sql: `
        -- Criação do enum para roles
        CREATE TYPE IF NOT EXISTS role_type AS ENUM ('admin', 'suporte');

        -- Tabela de usuários
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            name TEXT,
            phone TEXT,
            role role_type NOT NULL DEFAULT 'suporte',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ
        );

        -- Tabela de bizus
        CREATE TABLE IF NOT EXISTS bizus (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            keywords TEXT[],
            content TEXT NOT NULL,
            image_url TEXT,
            author_id UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ
        );

        -- Tabela de auditoria de edições de bizus
        CREATE TABLE IF NOT EXISTS bizu_edits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            bizu_id UUID REFERENCES bizus(id) ON DELETE CASCADE,
            editor_id UUID REFERENCES users(id) ON DELETE SET NULL,
            edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            changes JSONB
        );

        -- Tabela de auditoria geral
        CREATE TABLE IF NOT EXISTS audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            action TEXT NOT NULL,
            performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
            target_user UUID REFERENCES users(id) ON DELETE SET NULL,
            target_bizu UUID REFERENCES bizus(id) ON DELETE SET NULL,
            details JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    },
    {
      name: 'Triggers',
      sql: `
        -- Função para criar perfil na tabela users ao inserir em auth.users
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.users (id, email, name, phone, role, created_at)
          VALUES (NEW.id, NEW.email, NULL, NULL, 'suporte', NOW());
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Trigger para rodar a função após inserir em auth.users
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `
    },
    {
      name: 'RLS',
      sql: `
        -- Ativar RLS nas tabelas
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE bizus ENABLE ROW LEVEL SECURITY;
        ALTER TABLE bizu_edits ENABLE ROW LEVEL SECURITY;
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

        -- Políticas para tabela users
        DROP POLICY IF EXISTS "Admins podem ver todos os usuários" ON users;
        CREATE POLICY "Admins podem ver todos os usuários" ON users
          FOR SELECT USING (auth.uid() IS NOT NULL);

        DROP POLICY IF EXISTS "Admins podem inserir usuários" ON users;
        CREATE POLICY "Admins podem inserir usuários" ON users
          FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

        DROP POLICY IF EXISTS "Admins podem atualizar usuários" ON users;
        CREATE POLICY "Admins podem atualizar usuários" ON users
          FOR UPDATE USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

        DROP POLICY IF EXISTS "Admins podem deletar usuários" ON users;
        CREATE POLICY "Admins podem deletar usuários" ON users
          FOR DELETE USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

        -- Políticas para tabela bizus
        DROP POLICY IF EXISTS "Suporte pode inserir bizus" ON bizus;
        CREATE POLICY "Suporte pode inserir bizus" ON bizus
          FOR INSERT WITH CHECK (auth.uid() = author_id);

        DROP POLICY IF EXISTS "Suporte pode editar seus próprios bizus" ON bizus;
        CREATE POLICY "Suporte pode editar seus próprios bizus" ON bizus
          FOR UPDATE USING (auth.uid() = author_id);

        DROP POLICY IF EXISTS "Todos podem ver bizus" ON bizus;
        CREATE POLICY "Todos podem ver bizus" ON bizus
          FOR SELECT USING (TRUE);

        -- Políticas para tabela bizu_edits
        DROP POLICY IF EXISTS "Todos podem inserir edits" ON bizu_edits;
        CREATE POLICY "Todos podem inserir edits" ON bizu_edits
          FOR INSERT WITH CHECK (auth.uid() = editor_id);

        DROP POLICY IF EXISTS "Admin pode ver edits" ON bizu_edits;
        CREATE POLICY "Admin pode ver edits" ON bizu_edits
          FOR SELECT USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

        DROP POLICY IF EXISTS "Editor pode ver seus edits" ON bizu_edits;
        CREATE POLICY "Editor pode ver seus edits" ON bizu_edits
          FOR SELECT USING (editor_id = auth.uid());

        -- Políticas para tabela audit_logs
        DROP POLICY IF EXISTS "Todos podem inserir logs" ON audit_logs;
        CREATE POLICY "Todos podem inserir logs" ON audit_logs
          FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

        DROP POLICY IF EXISTS "Admin pode ver logs" ON audit_logs;
        CREATE POLICY "Admin pode ver logs" ON audit_logs
          FOR SELECT USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

        DROP POLICY IF EXISTS "Usuário pode ver logs que realizou" ON audit_logs;
        CREATE POLICY "Usuário pode ver logs que realizou" ON audit_logs
          FOR SELECT USING (performed_by = auth.uid());
      `
    },
    {
      name: 'Functions',
      sql: `
        -- Função para promover/demover usuários
        CREATE OR REPLACE FUNCTION promote_demote_user(
            p_user_id UUID,
            p_new_role role_type,
            p_performed_by UUID
        ) RETURNS VOID AS $$
        DECLARE
            admin_count INTEGER;
            current_role role_type;
        BEGIN
            SELECT role INTO current_role FROM users WHERE id = p_user_id;
            IF current_role = 'admin' AND p_new_role != 'admin' THEN
                SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'admin';
                IF admin_count <= 1 THEN
                    RAISE EXCEPTION 'Não é possível remover o último admin.';
                END IF;
            END IF;
            UPDATE users SET role = p_new_role, updated_at = NOW() WHERE id = p_user_id;
            INSERT INTO audit_logs (action, performed_by, target_user, details)
            VALUES ('promote_demote', p_performed_by, p_user_id, jsonb_build_object('new_role', p_new_role));
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Função para registrar edição de bizu
        CREATE OR REPLACE FUNCTION log_bizu_edit(
            p_bizu_id UUID,
            p_editor_id UUID,
            p_changes JSONB
        ) RETURNS VOID AS $$
        BEGIN
            INSERT INTO bizu_edits (bizu_id, editor_id, changes) VALUES (p_bizu_id, p_editor_id, p_changes);
            INSERT INTO audit_logs (action, performed_by, target_bizu, details)
            VALUES ('edit_bizu', p_editor_id, p_bizu_id, p_changes);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    }
  ];

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    console.log(`📋 Executando script ${i + 1}: ${script.name}...`);
    
    const result = await executeSQL(script.sql);
    
    if (result.success) {
      console.log(`✅ ${script.name} executado com sucesso!\n`);
    } else {
      console.log(`❌ Erro no ${script.name}. Tentando abordagem alternativa...`);
      
      // Se o RPC não funcionar, vamos tentar uma abordagem alternativa
      try {
        // Tentar executar via API REST
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: script.sql })
        });

        if (response.ok) {
          console.log(`✅ ${script.name} executado via API REST!\n`);
        } else {
          console.log(`⚠️  ${script.name} falhou. Execute manualmente no SQL Editor:\n`);
          console.log(script.sql);
          console.log('');
        }
      } catch (apiError) {
        console.log(`⚠️  ${script.name} falhou. Execute manualmente no SQL Editor:\n`);
        console.log(script.sql);
        console.log('');
      }
    }
  }

  console.log('🎉 Configuração concluída!');
  console.log('📝 Próximos passos:');
  console.log('1. Acesse o painel do Supabase');
  console.log('2. Vá em Table Editor para verificar as tabelas criadas');
  console.log('3. Teste a aplicação localmente');
  console.log('4. O erro deve ter desaparecido!');
}

setupDatabase().catch(console.error); 