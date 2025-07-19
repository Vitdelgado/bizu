import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/auth-provider'
import { AdminProvider } from '@/context/admin-context'
import { QueryProvider } from '@/components/query-provider'
import { Toaster } from '@/components/toaster'
import { ClientOnly } from '@/components/client-only'
import { GlobalHeader } from '@/components/global-header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bizu Desk - Sistema de Conhecimento',
  description: 'Sistema de conhecimento para o time de suporte',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <AdminProvider>
              <GlobalHeader />
              {children}
              <ClientOnly>
                <Toaster />
              </ClientOnly>
            </AdminProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
