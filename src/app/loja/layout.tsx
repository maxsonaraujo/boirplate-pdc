import { Metadata, ResolvingMetadata } from 'next';
import { DeliveryThemeProvider } from '@/providers/DeliveryThemeProvider';

type Props = {
  params: { slug: string }
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    // Obter o slug dos parâmetros - evitar desestruturação direta para evitar avisos
    const slug = props.params.slug;
    
    // Buscar informações do tenant para metadados
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/delivery/tenant`);
    
    if (!response.ok) {
      throw new Error('Falha ao carregar informações do restaurante');
    }
    
    const data = await response.json();
    const tenant = data.tenant;
    
    return {
      title: tenant.siteTitle || tenant.nome || 'Delivery Online',
      description: tenant.siteDescription || 'Faça seu pedido online',
      keywords: tenant.siteKeywords || 'delivery, comida, pedido online',
      metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    };
  } catch (error) {
    return {
      title: 'Delivery Online',
      description: 'Faça seu pedido online',
      metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    };
  }
}

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  );
}
