# 📘 BizuDesk (O Bizu do Suporte)

> **O mini Help interno e dicionário informal do time de suporte da Curseduca**

---

## 🌟 Visão Geral
O **BizuDesk** é uma aplicação web interna criada para o time de suporte da **Curseduca**, com o objetivo de reunir, organizar e facilitar o acesso rápido a soluções práticas, aprendizados informais e dúvidas recorrentes do dia a dia que **não estão documentadas no Help oficial**.

Inspirada visualmente na simplicidade da tela do Google, é um **mini Help interno** e um **dicionário informal** que fortalece a autonomia da equipe e a conexão entre membros do time.

---

## 🔧 Stack do Projeto
| Camada     | Tecnologia                     |
|------------|--------------------------------|
| Frontend   | Next.js + CSS puro             |
| Backend    | Supabase (PostgreSQL + Auth)   |
| Auth       | Supabase Auth (Email/Password) |
| Hospedagem | Vercel/Netlify (sugestão)      |

---

## ✨ Funcionalidades

- **Tela Principal de Busca** (estilo Google, minimalista)
- **Busca instantânea** por título, categoria, palavra-chave e conteúdo
- **Cards de bizus** com título, categoria, palavras-chave, trecho do conteúdo e visualizações
- **CRUD de Bizus** (criar, editar, remover)
- **Gestão de Usuários** (apenas admin pode promover/demover)
- **Controle de Roles**: `admin` e `suporte`
- **Auditoria**: logs de promoções, edições e contribuições
- **Autenticação**: login/cadastro via Supabase Auth
- **Responsividade**: design adaptado para desktop e mobile

---

## 🗂️ Estrutura do Banco (Supabase)

### Tabela: `bizus`
| Campo      | Tipo      | Descrição                              |
|------------|-----------|----------------------------------------|
| id         | UUID (PK) | Identificador do bizu                  |
| title      | text      | Título                                 |
| category   | text      | Categoria                              |
| keywords   | text[]    | Palavras-chave                         |
| content    | text      | Conteúdo completo                      |
| image_url  | text      | URL da imagem (opcional)               |
| author_id  | UUID      | Referência ao autor (usuário)          |
| created_at | timestamp | Data de criação                        |
| updated_at | timestamp | Data de atualização                    |
| views      | integer   | Visualizações                          |

### Tabela: `users`
| Campo      | Tipo      | Descrição                     |
|------------|-----------|-------------------------------|
| id         | UUID (PK) | ID do usuário autenticado     |
| email      | text      | Email institucional           |
| name       | text      | Nome do usuário (opcional)    |
| phone      | text      | Telefone (opcional)           |
| role       | enum      | `admin` / `suporte`           |
| created_at | timestamp | Data de cadastro              |
| updated_at | timestamp | Data de atualização           |

### Tabela: `bizu_edits`
| Campo      | Tipo      | Descrição                     |
|------------|-----------|-------------------------------|
| id         | UUID (PK) | ID da edição                  |
| bizu_id    | UUID      | Referência ao bizu            |
| editor_id  | UUID      | Usuário que editou            |
| edited_at  | timestamp | Data da edição                |
| changes    | JSONB     | Registro do que foi alterado  |

### Tabela: `audit_logs`
| Campo        | Tipo      | Descrição                                 |
|--------------|-----------|-------------------------------------------|
| id           | UUID (PK) | ID do log                                 |
| action       | text      | Ação realizada (ex: promote, edit_bizu)   |
| performed_by | UUID      | Quem fez                                  |
| target_user  | UUID      | Usuário afetado (se aplicável)            |
| target_bizu  | UUID      | Bizu afetado (se aplicável)               |
| details      | JSONB     | Detalhes extras                           |
| created_at   | timestamp | Data do log                               |

---

## 👥 Sistema de Roles

### Admin
- Pode criar, editar e remover bizus
- Pode promover/demover usuários
- Pode acessar área de gestão de usuários
- Pode deletar usuários (exceto a si mesmo se for o único admin)

### Suporte
- Pode criar e editar apenas seus próprios bizus
- Pode contribuir em bizus de outros (com registro de auditoria)
- Não pode acessar gestão de usuários
- Não pode promover/demover usuários

---

## 🚀 Como rodar o projeto

### 1. Configurar Supabase
- Crie um projeto no [Supabase](https://supabase.com)
- Execute os scripts SQL em `/supabase-sql` na ordem:
  1. `01_schema.sql`
  2. `02_triggers.sql`
  3. `03_rls.sql`
  4. `04_functions.sql`
- Crie o usuário super admin (Tektus) no painel Auth e promova com o script `05_superadmin.sql`

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. Instalar dependências
```bash
npm install
```

### 4. Rodar localmente
```bash
npm run dev
```

### 5. Importar bizus (opcional)
- Use o script `scripts/import-bizus.js` ou o painel do Supabase

---

## 🖥️ Telas do Sistema

- **Tela Principal**: Busca estilo Google, cards de bizus, links úteis
- **Tela de Administração**: CRUD de bizus, gestão de usuários (apenas admin)
- **Modal de Autenticação**: Login/cadastro integrado

---

## 📈 Futuro do Projeto
- Busca por relevância (text search avançado)
- Curtir bizus / marcar como favorito
- Comentários entre membros
- Exportar como PDF
- IA interna para sugerir bizus baseados na busca
- Integração futura com o Zendesk

---

## 💡 Contribua
Pull requests e sugestões são bem-vindos! Sinta-se à vontade para abrir issues.

---

**Desenvolvido com ❤️ para o time de suporte da Curseduca**
