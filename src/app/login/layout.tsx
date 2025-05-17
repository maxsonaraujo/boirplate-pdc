import type { Metadata } from 'next'
import conf from '../../../package.json'
import { TenantProvider } from '@/hooks/useTenant';

export const metadata: Metadata = {
    title: `Login - ${conf.displayName} | Gráficos Financeiros`,
    description: conf.description,
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            {children}
        </>
    )
}
