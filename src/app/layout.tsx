import type { Metadata } from 'next'
import { Providers } from './providers'
import conf from '../../package.json'
import { TenantProvider } from '@/hooks/useTenant';
import { CartProvider } from '@/providers/CartProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { getTenantMetadata } from '@/utils/tenant';

export async function generateMetadata(): Promise<Metadata> {
  // Tentar obter os metadados do tenant
  const tenantMeta = await getTenantMetadata();
  
  return {
    title: tenantMeta?.siteTitle || conf.displayName,
    description: tenantMeta?.siteDescription || conf.description,
    keywords: tenantMeta?.siteKeywords || '',
  }
}

const themeName = process.env.THEME ?? 'classic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-Br">

      <body suppressHydrationWarning={true}>
        <TenantProvider>
          <Providers themeName={themeName}>
            <NotificationProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </NotificationProvider>
          </Providers>
        </TenantProvider>
      </body>

    </html>
  )
}
