-- Tabela para armazenar logs de erros
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component TEXT,
  props JSONB,
  user_agent TEXT,
  url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  environment TEXT DEFAULT 'development',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_component ON error_logs(component);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_environment ON error_logs(environment);

-- Política RLS para permitir inserção de logs (qualquer usuário autenticado)
CREATE POLICY "Allow authenticated users to insert error logs" ON error_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política RLS para permitir leitura apenas para admins
CREATE POLICY "Allow admins to read error logs" ON error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Função para limpar logs antigos automaticamente
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void AS $$
BEGIN
  -- Manter apenas logs dos últimos 30 dias
  DELETE FROM error_logs 
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Agendar limpeza automática (executar diariamente)
SELECT cron.schedule(
  'cleanup-error-logs',
  '0 2 * * *', -- 2 AM todos os dias
  'SELECT cleanup_old_error_logs();'
);

-- Função para obter estatísticas de erros
CREATE OR REPLACE FUNCTION get_error_statistics(
  days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  total_errors BIGINT,
  unique_components BIGINT,
  most_common_error TEXT,
  error_count BIGINT,
  recent_errors BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_errors,
    COUNT(DISTINCT component) as unique_components,
    error_message as most_common_error,
    COUNT(*) as error_count,
    COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '1 day') as recent_errors
  FROM error_logs
  WHERE timestamp > NOW() - (days_back || ' days')::INTERVAL
  GROUP BY error_message
  ORDER BY error_count DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE error_logs IS 'Tabela para armazenar logs de erros da aplicação';
COMMENT ON COLUMN error_logs.error_message IS 'Mensagem do erro';
COMMENT ON COLUMN error_logs.error_stack IS 'Stack trace do erro';
COMMENT ON COLUMN error_logs.component IS 'Nome do componente onde o erro ocorreu';
COMMENT ON COLUMN error_logs.props IS 'Props do componente no momento do erro';
COMMENT ON COLUMN error_logs.user_agent IS 'User agent do navegador';
COMMENT ON COLUMN error_logs.url IS 'URL onde o erro ocorreu';
COMMENT ON COLUMN error_logs.user_id IS 'ID do usuário (se autenticado)';
COMMENT ON COLUMN error_logs.timestamp IS 'Timestamp do erro';
COMMENT ON COLUMN error_logs.environment IS 'Ambiente (development, production, etc.)'; 