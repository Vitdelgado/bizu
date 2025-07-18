import styles from './bizu-detail-modal.module.css';
import Image from 'next/image';
import { Bizu } from './bizu-card';
import { useEffect, useState } from 'react';

interface BizuDetailModalProps {
  bizu: Bizu | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BizuDetailModal({ bizu, open, onOpenChange }: BizuDetailModalProps) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    if (bizu?.created_at && open) {
      setFormattedDate(
        new Date(bizu.created_at).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      );
    }
  }, [bizu?.created_at, open]);

  if (!bizu || !open) return null;

  return (
    <div className={styles.overlay} onClick={() => onOpenChange(false)}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{bizu.title}</h2>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.badge}>{bizu.category}</span>
          <span className={styles.meta}>{bizu.views} visualizações</span>
          <span className={styles.meta}>{formattedDate}</span>
        </div>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Palavras-chave</h3>
          <div className={styles.keywordsRow}>
            {bizu.keywords.map((keyword, index) => (
              <span key={index} className={styles.keyword}>{keyword}</span>
            ))}
          </div>
        </div>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Conteúdo</h3>
          <div className={styles.content}>{bizu.content}</div>
        </div>
        {bizu.image_url && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Imagem</h3>
            <Image src={bizu.image_url} alt={bizu.title} width={600} height={400} className={styles.image} />
          </div>
        )}
        <button className={styles.closeBtn} onClick={() => onOpenChange(false)}>Fechar</button>
      </div>
    </div>
  );
} 