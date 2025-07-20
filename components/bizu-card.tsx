import { useEffect, useState } from 'react';
import styles from './bizu-card.module.css';

export interface Bizu {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  content: string;
  image_url?: string;
  views: number;
  likes: number;
  created_at: string;
  author_id: string;
  is_liked?: boolean;
}

interface BizuCardProps {
  bizu: Bizu;
  onClick?: () => void;
  onLike?: (bizuId: string) => void;
  onEdit?: (bizu: Bizu) => void;
  onDelete?: (bizuId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function BizuCard({ bizu, onClick, onLike, onEdit, onDelete, canEdit = false, canDelete = false }: BizuCardProps) {
  const [dateText, setDateText] = useState('');

  useEffect(() => {
    const formatDate = (date: string) => {
      const now = new Date();
      const bizuDate = new Date(date);
      const diffInDays = Math.floor((now.getTime() - bizuDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffInDays === 0) return 'hoje';
      if (diffInDays === 1) return 'há 1 dia';
      if (diffInDays < 7) return `há ${diffInDays} dias`;
      if (diffInDays < 30) return `há ${Math.floor(diffInDays / 7)} semana${Math.floor(diffInDays / 7) > 1 ? 's' : ''}`;
      return `há ${Math.floor(diffInDays / 30)} mês${Math.floor(diffInDays / 30) > 1 ? 'es' : ''}`;
    };
    setDateText(formatDate(bizu.created_at));
  }, [bizu.created_at]);

  const getPreview = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike) {
      onLike(bizu.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(bizu);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm('Tem certeza que deseja apagar este bizu? Esta ação não pode ser desfeita.')) {
      onDelete(bizu.id);
    }
  };

  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.cardContent}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <h3 className={styles.title}>{bizu.title}</h3>
            <span className={styles.badge}>{bizu.category}</span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.views}>{bizu.views} visualizações</span>
            <div className={styles.actionButtons}>
              {canEdit && (
                <button 
                  className={styles.editButton}
                  onClick={handleEdit}
                  title="Editar bizu"
                >
                  ✏️
                </button>
              )}
              {canDelete && (
                <button 
                  className={styles.deleteButton}
                  onClick={handleDelete}
                  title="Apagar bizu"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        </div>
        <p className={styles.preview}>{getPreview(bizu.content)}</p>
        <div className={styles.keywordsRow}>
          {bizu.keywords.map((keyword, index) => (
            <span key={index} className={styles.keyword}>{keyword}</span>
          ))}
        </div>
        <div className={styles.footerRow}>
          <span className={styles.date}>{dateText}</span>
          <div className={styles.actions}>
            <button 
              className={`${styles.likeButton} ${bizu.is_liked ? styles.liked : ''}`}
              onClick={handleLike}
              title={bizu.is_liked ? 'Descurtir' : 'Curtir'}
            >
              <span className={styles.heartIcon}>
                {bizu.is_liked ? '❤️' : '🤍'}
              </span>
              {bizu.likes}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 