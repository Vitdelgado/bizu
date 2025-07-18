-- Ativar RLS nas tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bizus ENABLE ROW LEVEL SECURITY;
ALTER TABLE bizu_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela users
-- Apenas admin pode selecionar, inserir, atualizar e deletar usuários
CREATE POLICY "Admins podem ver todos os usuários" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem inserir usuários" ON users
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE POLICY "Admins podem atualizar usuários" ON users
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE POLICY "Admins podem deletar usuários" ON users
  FOR DELETE USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- Políticas para tabela bizus
-- Suporte pode inserir e editar apenas seus próprios bizus
CREATE POLICY "Suporte pode inserir bizus" ON bizus
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Suporte pode editar seus próprios bizus" ON bizus
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Todos podem ver bizus" ON bizus
  FOR SELECT USING (TRUE);

-- Políticas para tabela bizu_edits
-- Todos podem inserir, admin pode ver tudo
CREATE POLICY "Todos podem inserir edits" ON bizu_edits
  FOR INSERT WITH CHECK (auth.uid() = editor_id);

CREATE POLICY "Admin pode ver edits" ON bizu_edits
  FOR SELECT USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE POLICY "Editor pode ver seus edits" ON bizu_edits
  FOR SELECT USING (editor_id = auth.uid());

-- Políticas para tabela audit_logs
-- Todos podem inserir, admin pode ver tudo
CREATE POLICY "Todos podem inserir logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin pode ver logs" ON audit_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE POLICY "Usuário pode ver logs que realizou" ON audit_logs
  FOR SELECT USING (performed_by = auth.uid()); 