import { useState, useEffect, FormEvent } from 'react';
import styles from './edit-bizu-modal.module.css';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/auth';
import { useToast } from '../hooks/use-toast';
import { Bizu } from './bizu-card';

interface EditBizuModalProps {
  bizu: Bizu | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBizuModal({ bizu, open, onOpenChange }: EditBizuModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [keywords, setKeywords] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const { userProfile } = useAuth();
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
      const categorias = Array.from(new Set(data.map((b: any) => b.category).filter(Boolean)));
      return categorias;
    },
  });

  useEffect(() => {
    if (bizu) {
      setTitle(bizu.title);
      setCategory(bizu.category);
      setKeywords(bizu.keywords.join(', '));
      setContent(bizu.content);
      setImageUrl(bizu.image_url || '');
    }
  }, [bizu]);

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setKeywords('');
    setContent('');
    setImageUrl('');
  };

  const updateBizuMutation = useMutation({
    mutationFn: async (data: Partial<Bizu>) => {
      if (!bizu) throw new Error('Bizu não encontrado');
      const res = await fetch(`/api/bizus/${bizu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text() || 'Erro ao atualizar bizu');
      return res;
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Bizu atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/bizus'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: unknown) => {
      let message = 'Erro ao atualizar bizu';
      if (error instanceof Error) message = error.message;
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      toast({ title: 'Erro', description: 'Você precisa estar logado para editar bizus', variant: 'destructive' });
      return;
    }
    if (!title.trim() || !category.trim() || !content.trim()) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    const keywordsArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
    updateBizuMutation.mutate({
      title: title.trim(),
      category: category.trim(),
      keywords: keywordsArray,
      content: content.trim(),
      image_url: imageUrl.trim() || undefined
    });
  };

  if (!bizu || !open) return null;

  return (
    <div className={styles.overlay} onClick={() => onOpenChange(false)}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Editar Bizu</h2>
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
              disabled={updateBizuMutation.isPending}
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
              disabled={updateBizuMutation.isPending}
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
              disabled={updateBizuMutation.isPending}
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
              disabled={updateBizuMutation.isPending}
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
              disabled={updateBizuMutation.isPending}
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
              disabled={updateBizuMutation.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={updateBizuMutation.isPending}
            >
              {updateBizuMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 