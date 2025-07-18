import styles from './similar-bizus-modal.module.css';
import { Bizu } from './bizu-card';

interface SimilarBizusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  similarBizus: Bizu[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function SimilarBizusModal({ open, onOpenChange, similarBizus, onConfirm, onCancel }: SimilarBizusModalProps) {
  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={() => onOpenChange(false)}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.icon}>⚠️</span>
          <h2 className={styles.title}>Bizus Similares Encontrados</h2>
        </div>
        <div className={styles.section}>
          <p className={styles.text}>
            Encontramos {similarBizus.length} bizu{similarBizus.length !== 1 ? 's' : ''} com título similar. Verifique se já existe algo parecido antes de continuar:
          </p>
          <div className={styles.similarList}>
            {similarBizus.map((bizu) => (
              <div key={bizu.id} className={styles.similarItem}>
                <h4 className={styles.similarTitle}>{bizu.title}</h4>
                <span className={styles.badge}>{bizu.category}</span>
                <p className={styles.similarContent}>{bizu.content}</p>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
          <button className={styles.confirmBtn} onClick={onConfirm}>Continuar mesmo assim</button>
        </div>
      </div>
    </div>
  );
} 