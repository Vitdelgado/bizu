# 📋 Scripts SQL do Supabase - Estrutura Organizada

## 🎯 **OBJETIVO**
Esta pasta contém os scripts SQL organizados e limpos para o projeto BizuDesk, sem conflitos ou duplicações.

## 📁 **ESTRUTURA DOS ARQUIVOS**

### **00_cleanup_conflicts.sql**
- **O que faz**: Remove triggers, funções e políticas conflitantes
- **Quando executar**: PRIMEIRO, antes de qualquer outro script
- **Por que**: Limpa conflitos dos scripts antigos do SQL Editor

### **01_schema_initial.sql**
- **O que faz**: Cria todas as tabelas e estruturas básicas
- **Quando executar**: SEGUNDO, após a limpeza
- **Contém**: 
  - Enum `role_type`
  - Tabelas: `users`, `bizus`, `bizu_edits`, `audit_logs`, `bizu_likes`
  - Colunas de métricas (`likes`, `views`)

### **02_triggers_and_functions.sql**
- **O que faz**: Cria todas as funções e triggers necessários
- **Quando executar**: TERCEIRO, após o schema
- **Contém**:
  - `handle_new_user()` - Cria perfil quando usuário se registra
  - `update_bizu_likes_count()` - Atualiza contador de likes
  - `has_user_liked_bizu()` - Verifica se usuário curtiu
  - `get_top_bizus_by_likes()` - Retorna top bizus
  - `promote_demote_user()` - Promove/demove usuários
  - `log_bizu_edit()` - Registra edições

### **03_rls_policies.sql**
- **O que faz**: Configura Row Level Security e políticas
- **Quando executar**: QUARTO, após funções
- **Contém**: Políticas RLS para todas as tabelas

### **04_sync_users_auth.sql**
- **O que faz**: Sincroniza dados entre `auth.users` e `public.users`
- **Quando executar**: QUINTO, após RLS
- **Contém**: Sincronização bidirecional de nomes e telefones

### **05_admin_setup.sql**
- **O que faz**: Configura usuário admin
- **Quando executar**: SEXTO, por último
- **Contém**: Promoção do Tektus a admin

## 🚀 **COMO EXECUTAR**

### **Ordem de Execução:**
1. `00_cleanup_conflicts.sql`
2. `01_schema_initial.sql`
3. `02_triggers_and_functions.sql`
4. `03_rls_policies.sql`
5. `04_sync_users_auth.sql`
6. `05_admin_setup.sql`

### **No Supabase SQL Editor:**
1. Abra o SQL Editor
2. Execute cada arquivo na ordem acima
3. Verifique os resultados de cada execução

## ⚠️ **PROBLEMAS RESOLVIDOS**

### **Conflitos Removidos:**
- ❌ Triggers duplicados na tabela `auth.users`
- ❌ Funções de sincronização conflitantes
- ❌ Políticas RLS duplicadas
- ❌ Scripts de schema duplicados

### **Melhorias Implementadas:**
- ✅ Estrutura organizada e numerada
- ✅ Scripts independentes e reutilizáveis
- ✅ Verificações de segurança
- ✅ Backup automático de dados
- ✅ Sincronização compatível

## 🔍 **VERIFICAÇÃO**

Após executar todos os scripts, use o arquivo `check_current_state.sql` para verificar se tudo está funcionando corretamente.

## 📝 **NOTAS**

- Todos os scripts usam `IF NOT EXISTS` e `DROP IF EXISTS` para evitar erros
- Os dados existentes são preservados
- A sincronização é bidirecional e segura
- O RLS está configurado corretamente para todas as tabelas 