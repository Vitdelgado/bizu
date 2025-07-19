import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Otimizações de cache e performance
  experimental: {
    optimizePackageImports: ['@tanstack/react-query'],
  },
  
  // Headers de cache para assets estáticos
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=300', // 1 min local, 5 min CDN
          },
        ],
      },
      {
        source: '/api/bizus',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600', // 5 min local, 10 min CDN
          },
        ],
      },
    ];
  },

  // Otimizações de imagens
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 dias
  },

  // Compressão
  compress: true,
  
  // Otimizações de bundle (swcMinify é true por padrão no Next.js 13+)
  
  // Configurações de cache para desenvolvimento
  onDemandEntries: {
    maxInactiveAge: 25 * 1000, // 25 segundos
    pagesBufferLength: 2,
  },
};

export default nextConfig;
