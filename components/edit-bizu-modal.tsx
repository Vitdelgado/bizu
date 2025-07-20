'use client';

import { useState, useEffect } from 'react';
import styles from './edit-bizu-modal.module.css';
import { Bizu } from './bizu-card';

interface EditBizuModalProps {
  bizu: Bizu | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (bizuId: string, bizuData: Partial<Bizu>) => Promise<void>;
}

export function EditBizuModal({ bizu, open, onOpenChange, onSave }: EditBizuModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    keywords: '',
    content: '',
    image_url: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bizu) {
      setFormData({
        title: bizu.title || '',
        category: bizu.category || '',
        keywords: bizu.keywords.join(', ') || '',
        content: bizu.content || '',
        image_url: bizu.image_url || ''
      });
      setError(null);
    }
  }, [bizu]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizu) return;

    try {
      setSaving(true);
      setError(null);

      const keywords = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      await onSave(bizu.id, {
        title: formData.title.trim(),
        category: formData.category.trim(),
        keywords,
        content: formData.content.trim(),
        image_url: formData.image_url.trim() || undefined
      });

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar bizu');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setError(null);
  };

  if (!open || !bizu) return null;

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Editar Bizu</h2>
          <button className={styles.closeButton} onClick={handleCancel}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="title">Título *</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Título do bizu"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="category">Categoria *</label>
            <input
              id="category"
              type="text"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              placeholder="Ex: Suporte, Financeiro, Certificados"
              required
              className={styles.input}
            />
            <small className={styles.helpText}>
              Separe múltiplas categorias por vírgula
            </small>
          </div>

          <div className={styles.field}>
            <label htmlFor="keywords">Palavras-chave</label>
            <input
              id="keywords"
              type="text"
              value={formData.keywords}
              onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
              placeholder="palavra1, palavra2, palavra3"
              className={styles.input}
            />
            <small className={styles.helpText}>
              Separe as palavras-chave por vírgula
            </small>
          </div>

          <div className={styles.field}>
            <label htmlFor="content">Conteúdo *</label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Conteúdo detalhado do bizu..."
              required
              rows={8}
              className={styles.textarea}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="image_url">URL da Imagem/Vídeo</label>
            <input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://exemplo.com/imagem.jpg"
              className={styles.input}
            />
            <small className={styles.helpText}>
              URL opcional para imagem ou vídeo relacionado
            </small>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 