import { useState, FormEvent } from 'react';
import styles from './edit-bizu-modal.module.css';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '../hooks/use-toast';
import { Bizu } from './bizu-card';

interface CreateBizuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBizuModal({ open, onOpenChange }: CreateBizuModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [keywords, setKeywords] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar categorias existentes
  const { data: categoriasExistentes = [] } = useQuery<string[]>({
    queryKey: ['categorias-existentes'],
    queryFn: async () => {
      const res = await fetch('/api/bizus');
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      // Extrair categorias únicas
      const categorias = Array.from(new Set(data.map((b: { category: string }) => b.category).filter(Boolean)));
      return categorias;
    },
  });

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setKeywords('');
    setContent('');
    setImageUrl('');
  };

  const createBizuMutation = useMutation({
    mutationFn: async (data: Partial<Bizu>) => {
      console.log('🚀 Iniciando mutation...');
      if (!profile) {
        console.error('❌ Profile não encontrado na mutation');
        throw new Error('Usuário não autenticado');
      }
      
      // Obter token de sessão
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Token de sessão não encontrado');
      
      console.log('📊 Dados recebidos na mutation:', data);
      console.log('👤 Profile na mutation:', profile);
      
      const requestData = {
        ...data,
        author_id: profile.id
      };
      
      console.log('📤 Dados para API:', requestData);
      
      const res = await fetch('/api/bizus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestData),
      });
      
      console.log('📥 Resposta da API:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Erro da API:', errorText);
        throw new Error(errorText || 'Erro ao criar bizu');
      }
      
      const result = await res.json();
      console.log('✅ Bizu criado com sucesso:', result);
      return result;
    },
    onSuccess: () => {
      console.log('🎉 Mutation executada com sucesso');
      toast({ title: 'Sucesso', description: 'Bizu criado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/bizus'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: unknown) => {
      console.error('💥 Erro na mutation:', error);
      let message = 'Erro ao criar bizu';
      if (error instanceof Error) message = error.message;
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('🔍 Iniciando submissão do formulário...');
    console.log('👤 Profile:', profile);
    console.log('📝 Dados do formulário:', { title, category, content, keywords, imageUrl });
    
    if (!profile) {
      console.error('❌ Usuário não autenticado');
      toast({ title: 'Erro', description: 'Você precisa estar logado para criar bizus', variant: 'destructive' });
      return;
    }
    
    if (!title.trim() || !category.trim() || !content.trim()) {
      console.error('❌ Campos obrigatórios não preenchidos');
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    
    console.log('✅ Validação passou, iniciando criação...');
    
    const keywordsArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const bizuData = {
      title: title.trim(),
      category: category.trim(),
      keywords: keywordsArray,
      content: content.trim(),
      image_url: imageUrl.trim() || undefined
    };
    
    console.log('📤 Enviando dados:', bizuData);
    createBizuMutation.mutate(bizuData);
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={() => onOpenChange(false)}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Criar Novo Bizu</h2>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Título *</label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Como resolver problemas de login"
              required
              className={styles.input}
              disabled={createBizuMutation.isPending}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="category">Categoria *</label>
            <input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Processos N2, Certificado MEC"
              required
              className={styles.input}
              disabled={createBizuMutation.isPending}
              list="categories"
            />
            <datalist id="categories">
              {categoriasExistentes.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="keywords">Palavras-chave</label>
            <input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Ex: login, senha, acesso (separadas por vírgula)"
              className={styles.input}
              disabled={createBizuMutation.isPending}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="content">Conteúdo *</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva a solução ou procedimento..."
              className={styles.textarea}
              required
              disabled={createBizuMutation.isPending}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="imageUrl">URL da Imagem (opcional)</label>
            <input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              className={styles.input}
              disabled={createBizuMutation.isPending}
            />
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              className={styles.cancelBtn}
              disabled={createBizuMutation.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={createBizuMutation.isPending}
            >
              {createBizuMutation.isPending ? 'Criando...' : 'Criar Bizu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 