# Scripts de Criação de Base de Dados - BizuDesk

## Passo a Passo para Configuração Inicial

1. **Crie o usuário super admin no Supabase Auth**
   - Email: agenciatektus@gmail.com
   - Nome: Tektus
   - Telefone: +5521977357727
   - (Faça isso pelo painel do Supabase, em Authentication > Users > Invite User)

2. **Execute os scripts SQL na ordem abaixo pelo SQL Editor do Supabase:**

   1. `01_schema.sql` - Criação das tabelas e tipos
   2. `02_triggers.sql` - Trigger para sincronizar auth.users -> users
   3. `03_rls.sql` - Políticas de segurança (RLS)
   4. `04_functions.sql` - Funções de promoção/demissão e auditoria
   5. `05_superadmin.sql` - Promove o usuário Tektus para admin

3. **Importe os bizus pelo painel do Supabase**
   - Use a opção de importar CSV na tabela `bizus`.
   - Certifique-se de que o campo `author_id` corresponda ao id do usuário desejado.

4. **Testes e Validação**
   - Cadastre um novo usuário pelo frontend ou painel do Supabase Auth.
   - Verifique se o perfil é criado automaticamente na tabela `users` com role `suporte`.
   - Faça login como admin e teste a promoção/demissão de usuários.
   - Teste a criação e edição de bizus como suporte e admin.
   - Verifique os registros de auditoria em `audit_logs` e `bizu_edits`.

## Observações
- O sistema está preparado para escalabilidade e auditoria.
- Roles e permissões são controlados via RLS e funções seguras.
- O admin nunca pode remover a si mesmo se for o único admin.
- Toda ação relevante é registrada para rastreabilidade.

Se precisar de scripts de importação, exemplos de queries ou integração com o frontend, peça por aqui! 