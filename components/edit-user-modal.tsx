'use client';

import { useState, useEffect } from 'react';
import styles from './edit-user-modal.module.css';

interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'admin' | 'suporte';
  created_at: string;
  updated_at?: string;
}

interface EditUserModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (userId: string, userData: { name?: string; phone?: string; email?: string }) => Promise<void>;
}

export function EditUserModal({ user, open, onOpenChange, onSave }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      setError(null);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError(null);

      await onSave(user.id, {
        name: formData.name.trim() || undefined,
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined
      });

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setError(null);
  };

  if (!open || !user) return null;

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Editar Usuário</h2>
          <button className={styles.closeButton} onClick={handleCancel}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="name">Nome</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do usuário"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="phone">Telefone</label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(11) 99999-9999"
              className={styles.input}
            />
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