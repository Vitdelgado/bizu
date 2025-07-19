interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class LocalCache {
  private storage: Storage;

  constructor() {
    this.storage = typeof window !== 'undefined' ? window.localStorage : {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    };
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      this.storage.setItem(key, JSON.stringify(item));
    } catch {
      console.warn('Erro ao salvar no cache');
      // Se localStorage estiver cheio, limpar cache antigo
      this.clearExpired();
      try {
        const item: CacheItem<T> = {
          data,
          timestamp: Date.now(),
          ttl,
        };
        this.storage.setItem(key, JSON.stringify(item));
      } catch {
        console.error('Erro ao salvar no cache após limpeza');
      }
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(key);
      if (!item) return null;

      const cacheItem: CacheItem<T> = JSON.parse(item);
      const isExpired = Date.now() - cacheItem.timestamp > cacheItem.ttl;

      if (isExpired) {
        this.storage.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch {
      console.warn('Erro ao ler do cache');
      this.storage.removeItem(key);
      return null;
    }
  }

  remove(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch {
      console.warn('Erro ao remover do cache');
    }
  }

  clear(): void {
    try {
      this.storage.clear();
    } catch {
      console.warn('Erro ao limpar cache');
    }
  }

  clearExpired(): void {
    try {
      const keys = Object.keys(this.storage);
      const now = Date.now();

      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          const item = this.storage.getItem(key);
          if (item) {
            try {
              const cacheItem: CacheItem<unknown> = JSON.parse(item);
              const isExpired = now - cacheItem.timestamp > cacheItem.ttl;
              
              if (isExpired) {
                this.storage.removeItem(key);
              }
            } catch {
              // Item corrompido, remover
              this.storage.removeItem(key);
            }
          }
        }
      });
    } catch {
      console.warn('Erro ao limpar cache expirado');
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Cache específico para bizus
  setBizus(data: unknown[], ttl: number = 5 * 60 * 1000): void {
    this.set('cache_bizus', data, ttl);
  }

  getBizus(): unknown[] | null {
    return this.get('cache_bizus');
  }

  // Cache específico para usuários
  setUsers(data: unknown[], ttl: number = 10 * 60 * 1000): void {
    this.set('cache_users', data, ttl);
  }

  getUsers(): unknown[] | null {
    return this.get('cache_users');
  }

  // Cache específico para categorias
  setCategories(data: string[], ttl: number = 30 * 60 * 1000): void {
    this.set('cache_categories', data, ttl);
  }

  getCategories(): string[] | null {
    return this.get('cache_categories');
  }
}

export const localCache = new LocalCache();

// Limpar cache expirado periodicamente
if (typeof window !== 'undefined') {
  setInterval(() => {
    localCache.clearExpired();
  }, 5 * 60 * 1000); // A cada 5 minutos
} 