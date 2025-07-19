import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Headers de segurança
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Cache otimizado baseado no tipo de rota
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    // APIs - cache curto
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300');
  } else if (pathname.startsWith('/api/bizus')) {
    // API de bizus - cache médio
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600');
  } else if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
    // Assets estáticos - cache longo
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (pathname === '/') {
    // Página inicial - cache médio
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600');
  } else {
    // Outras páginas - cache padrão
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300');
  }

  // Compressão
  response.headers.set('Accept-Encoding', 'gzip, deflate, br');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 