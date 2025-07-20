'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bizu, BizuCard } from './bizu-card';
import { BizuDetailModal } from './bizu-detail-modal';
import { EditBizuModal } from './edit-bizu-modal';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import styles from './top-bizus-section.module.css';

export function TopBizusSection() {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedBizu, setSelectedBizu] = useState<Bizu | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingBizu, setEditingBizu] = useState<Bizu | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Buscar top bizus
  const { data: topBizus, isLoading, error } = useQuery<Bizu[]>({
    queryKey: ['/api/bizus/top', { limit: 10, userId: profile?.id }],
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutations para like/unlike
  const likeMutation = useMutation({
    mutationFn: async (bizuId: string) => {
      const response = await fetch(`/api/bizus/${bizuId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Erro ao curtir bizu');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bizus/top'] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async (bizuId: string) => {
      const response = await fetch(`/api/bizus/${bizuId}/like`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Erro ao descurtir bizu');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bizus/top'] });
    },
  });

  // Mutation para edição
  const editMutation = useMutation({
    mutationFn: async ({ bizuId, bizuData }: { bizuId: string; bizuData: Partial<Bizu> }) => {
      const response = await fetch(`/api/bizus/${bizuId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bizuData),
      });
      if (!response.ok) throw new Error('Erro ao editar bizu');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Bizu editado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/bizus/top'] });
      setShowEditModal(false);
      setEditingBizu(null);
    },
    onError: (error) => {
      toast({ 
        title: 'Erro', 
        description: error instanceof Error ? error.message : 'Erro ao editar bizu',
        variant: 'destructive'
      });
    },
  });

  const handleLike = (bizuId: string) => {
    if (!profile) {
      toast({ 
        title: 'Ação necessária', 
        description: 'Faça login para curtir bizus',
        variant: 'destructive'
      });
      return;
    }

    const bizu = topBizus?.find(b => b.id === bizuId);
    if (bizu?.is_liked) {
      unlikeMutation.mutate(bizuId);
    } else {
      likeMutation.mutate(bizuId);
    }
  };

  const handleEdit = (bizu: Bizu) => {
    if (!profile) {
      toast({ 
        title: 'Ação necessária', 
        description: 'Faça login para editar bizus',
        variant: 'destructive'
      });
      return;
    }

    const canEdit = isAdmin || bizu.author_id === profile.id;
    if (!canEdit) {
      toast({ 
        title: 'Sem permissão', 
        description: 'Você só pode editar seus próprios bizus',
        variant: 'destructive'
      });
      return;
    }

    setEditingBizu(bizu);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (bizuId: string, bizuData: Partial<Bizu>) => {
    editMutation.mutate({ bizuId, bizuData });
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando top bizus...</p>
        </div>
      </div>
    );
  }

  if (error || !topBizus || topBizus.length === 0) {
    return null; // Não mostrar seção se não há dados
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.trophy}>🏆</span>
          Top 10 Bizus Mais Curtidos
        </h2>
        <p className={styles.subtitle}>
          Os bizus mais úteis da comunidade
        </p>
      </div>

      <div className={styles.bizusGrid}>
        {topBizus.map((bizu, index) => (
          <div key={bizu.id} className={styles.bizuWrapper}>
            <div className={styles.rank}>
              #{index + 1}
            </div>
            <BizuCard
              bizu={bizu}
              onClick={() => {
                setSelectedBizu(bizu);
                setShowDetailModal(true);
              }}
              onLike={handleLike}
              onEdit={handleEdit}
              canEdit={isAdmin || bizu.author_id === profile?.id}
            />
          </div>
        ))}
      </div>

      {/* Modal de detalhes */}
      {showDetailModal && (
        <BizuDetailModal
          bizu={selectedBizu}
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
        />
      )}

      {/* Modal de edição */}
      {showEditModal && (
        <EditBizuModal
          bizu={editingBizu}
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
} 