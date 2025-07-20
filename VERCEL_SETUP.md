# 🚀 Configuração do Vercel - BizuDesk

## ❌ **PROBLEMA IDENTIFICADO**
O deployment no Vercel está falhando porque as variáveis de ambiente do Supabase não estão configuradas.

## 🔧 **SOLUÇÃO**

### **1. Configurar Variáveis no Vercel**

1. **Acesse o Dashboard do Vercel:**
   - Vá para: https://vercel.com/dashboard
   - Encontre o projeto `bizu`

2. **Configure as Variáveis de Ambiente:**
   - Vá em: **Settings** > **Environment Variables**
   - Adicione as seguintes variáveis:

   ```
   NOME: NEXT_PUBLIC_SUPABASE_URL
   VALOR: https://kbqdgbpgtedsryukoogu.supabase.co
   ENVIRONMENT: Production, Preview, Development
   ```

   ```
   NOME: NEXT_PUBLIC_SUPABASE_ANON_KEY
   VALOR: [sua_chave_anonima_do_supabase]
   ENVIRONMENT: Production, Preview, Development
   ```

### **2. Obter a Chave Anônima do Supabase**

1. **Acesse o Supabase:**
   - Vá para: https://supabase.com
   - Entre no projeto: `kbqdgbpgtedsryukoogu`

2. **Copie a Chave:**
   - Vá em: **Settings** > **API**
   - Copie o valor de **"anon public"**
   - Cole no Vercel como `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **3. Fazer Novo Deploy**

1. **No Vercel:**
   - Vá em: **Deployments**
   - Clique em **"Redeploy"** no último deployment

2. **Ou via Git:**
   ```bash
   git commit --allow-empty -m "trigger redeploy"
   git push origin main
   ```

## ✅ **VERIFICAÇÃO**

Após configurar as variáveis, o deployment deve funcionar corretamente.

## 📝 **NOTAS**

- As variáveis `NEXT_PUBLIC_*` são expostas no cliente
- Isso é seguro para chaves anônimas do Supabase
- O RLS (Row Level Security) protege os dados 