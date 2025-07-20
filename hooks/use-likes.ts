import { useState } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

export function useLikes() {
  const [likedBizus, setLikedBizus] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const { profile } = useAuth();
  const { toast } = useToast();

  const likeBizu = async (bizuId: string) => {
    if (!profile) {
      toast({ 
        title: 'Erro', 
        description: 'Você precisa estar logado para curtir bizus', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      const isLiked = likedBizus.has(bizuId);
      const method = isLiked ? 'DELETE' : 'POST';
      
      console.log(`Tentando ${isLiked ? 'descurtir' : 'curtir'} bizu ${bizuId}`);
      
      const response = await fetch(`/api/bizus/${bizuId}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Resposta da API:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Dados da resposta:', data);
      
      // Atualizar estado local
      setLikeCounts(prev => ({
        ...prev,
        [bizuId]: data.likes
      }));

      if (isLiked) {
        setLikedBizus(prev => {
          const newSet = new Set(prev);
          newSet.delete(bizuId);
          return newSet;
        });
        toast({ 
          title: 'Descurtido', 
          description: 'Bizu removido dos seus favoritos' 
        });
      } else {
        setLikedBizus(prev => new Set(prev).add(bizuId));
        toast({ 
          title: 'Curtido!', 
          description: 'Bizu adicionado aos seus favoritos' 
        });
      }
    } catch (error) {
      console.error('Erro ao processar like:', error);
      toast({ 
        title: 'Erro', 
        description: error instanceof Error ? error.message : 'Erro ao processar like. Tente novamente.', 
        variant: 'destructive' 
      });
    }
  };

  const isLiked = (bizuId: string) => likedBizus.has(bizuId);
  
  const getLikeCount = (bizuId: string) => likeCounts[bizuId] || 0;

  const setInitialLikeState = (bizuId: string, isLiked: boolean, count: number) => {
    if (isLiked) {
      setLikedBizus(prev => new Set(prev).add(bizuId));
    }
    setLikeCounts(prev => ({
      ...prev,
      [bizuId]: count
    }));
  };

  return {
    likeBizu,
    isLiked,
    getLikeCount,
    setInitialLikeState,
  };
} 