
# 📘 Documentação Oficial do Projeto: BizuDesk (O Bizu do Suporte)

## 🌟 Visão Geral
O **BizuDesk** é uma aplicação web interna criada para o time de suporte da **Curseduca**, com o objetivo de reunir, organizar e facilitar o acesso rápido a soluções práticas, aprendizados informais e dúvidas recorrentes do dia a dia que **não estão documentadas no Help oficial**.

Inspirada visualmente na simplicidade da tela do Google, é um **mini Help interno** e um **dicionário informal** que fortalece a autonomia da equipe e a conexão entre membros do time.

---

## 🔧 Stack do Projeto
| Camada     | Tecnologia                     |
|------------|--------------------------------|
| Frontend   | Next.js + CSS puro        |
| Backend    | Supabase (PostgreSQL + Auth)   |
| Auth       | Supabase Auth (Email/Password) |
| Hospedagem |              |

---

## 🔸 Funcionalidades Essenciais

### 1. Tela Principal de Busca (Aparecida)
- “**Estilo Google**”:
  - Logo bonito e colorido: **O Bizu do Suporte**
  - Fundo branco, visual clean e minimalista
- Campo central de busca com placeholder amigável (ex: "Qual é o bizu?")
- Resultados exibidos em cards simples:
  - Exibe apenas os 3 primeiros
  - Botão: **"Ver mais bizus"** carrega mais sem sair da tela (infinite scroll ou expandir abaixo)
- Cada bizu mostra:
  - Título
  - Categoria
  - Palavras-chave
  - Trecho inicial do conteúdo
- Áreas fixas:
  - 🔗 Link para [Help Curseduca](https://help.curseduca.com)
  - 🔗 Link para Treinamento de Suporte
  - ⚙️ Link para a Tela de Administração

---

### 2. Tela de Administração (Cadastro e Gestão)
- Fundo branco, visual limpo, estilo "fórum de cadastro"
- Formulário para adicionar novo bizu:
  - **Título** (curto e claro)
  - **Categoria** (dropdown com exemplos: "Processos N2", "Certificado MEC")
  - **Palavras-chave** (ex: "login", "senha", "certificado", separadas por vírgula)
  - **Conteúdo** (texto simples com quebra de linha pelo Enter)
  - **URL da imagem** (opcional, só uma imagem, via link do Imgur)
- Listagem dos bizus já adicionados abaixo do formulário (para evitar duplicatas)
- Link de volta para a Tela Principal de Busca

---

## 🔍 Estrutura do Banco (Supabase)

### Tabela: `bizus`
| Campo         | Tipo      | Descrição                              |
|---------------|-----------|----------------------------------------|
| id            | UUID (PK) | Identificador do bizu                  |
| title         | text      | Título                                |
| category      | text      | Categoria                              |
| keywords      | text[]    | Palavras-chave                         |
| content       | text      | Conteúdo completo                     |
| image_url     | text      | URL da imagem (opcional)              |
| author_id     | UUID      | Referência ao autor (usuário)         |
| created_at    | timestamp | Data de criação                      |
| views         | integer   | Visualizações                        |

### Tabela: `users`
| Campo      | Tipo      | Descrição                     |
|------------|-----------|-------------------------------|
| id         | UUID (PK) | ID do usuário autenticado     |
| email      | text      | Email institucional            |
| role       | text      | viewer / admin                 |
| created_at | timestamp | Data de cadastro               |

---

## 🔗 Tipos de Conteúdo a Serem Gerenciados
- Dúvidas frequentes e como resolvê-las
- Procedimentos internos (implantação, CS, N2)
- Glossário de termos comuns do mercado digital (ex: "funil", "lançamento", "CTA")
- Procedimentos de abertura de chamados (passo a passo e checklist informal)
- Regras de autonomia (ex: "por que não emitimos token")

---

## ✅ Checklist para MVP
- [ ] Configurar Supabase (auth + tabelas)
- [ ] Estruturar projeto React com CSS puro
- [ ] Criar Tela Principal (estilo Google)
- [ ] Criar Tela de Administração com CRUD
- [ ] Conectar Supabase ao frontend (listar, buscar, adicionar)
- [ ] Deploy na Vercel/Netlify

---

## 📈 Futuro do Projeto (Evolução)
- Busca por relevância (text search com prioridade por palavra-chave)
- Curtir bizus / marcar como favorito
- Comentários entre membros
- Exportar como PDF
- IA interna para sugerir bizus baseados na busca
- Integração futura com o Zendesk (importar ticket resolvido como bizu)

---

Seja bem-vinda, Aparecida — o coração do nosso suporte interno! 💖
