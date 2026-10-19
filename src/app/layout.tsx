// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import I18nProvider from '@/providers/I18n-provider'
import './globals.css'
import RootLayouter from '@/components/layout/RootLayout';
import BackToTop from '@/components/common/BackToTop'
import AuthProvider from '@/providers/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'LUDRA — Immobilier, personnel et services', template: '%s · LUDRA' },
  description: 'Logements, personnel de maison et prestataires au Cameroun : offres vérifiées, messagerie gratuite, contact direct sécurisé.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <I18nProvider>
          <AuthProvider>
            <RootLayouter>{children}</RootLayouter>
          </AuthProvider>
        </I18nProvider>

        <BackToTop />
      </body>
    </html>
  )
}