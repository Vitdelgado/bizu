import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-provider";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "@/components/toaster";
import { AdminProvider } from "@/context/admin-context";
import { GlobalHeader } from "@/components/global-header";
import { ClientOnly } from "@/components/client-only";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bizu Desk - Sistema de Suporte",
  description: "Sistema de gerenciamento de bizus para suporte técnico",
  keywords: ["suporte", "bizu", "técnico", "ajuda"],
  authors: [{ name: "Bizu Desk Team" }],
  creator: "Bizu Desk",
  publisher: "Bizu Desk",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://bizu-desk.vercel.app'),
  openGraph: {
    title: "Bizu Desk - Sistema de Suporte",
    description: "Sistema de gerenciamento de bizus para suporte técnico",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bizu Desk - Sistema de Suporte",
    description: "Sistema de gerenciamento de bizus para suporte técnico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Preload de recursos críticos */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Cache de assets estáticos */}
        <meta httpEquiv="Cache-Control" content="public, max-age=31536000, immutable" />
        
        {/* DNS Prefetch para melhor performance */}
        <link rel="dns-prefetch" href="//kbqdgbpgtedsryukoogu.supabase.co" />
        
        {/* Preload de ícones críticos */}
        <link rel="preload" href="/favicon.ico" as="image" type="image/x-icon" />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ClientOnly>
          <QueryProvider>
            <AuthProvider>
              <AdminProvider>
                <GlobalHeader />
                <main style={{ paddingTop: '70px' }}>
                  {children}
                </main>
                <Toaster />
              </AdminProvider>
            </AuthProvider>
          </QueryProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
