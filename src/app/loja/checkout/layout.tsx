import { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { slug: string }
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    // Buscar informações do tenant para metadadoss
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/delivery/tenant`);
    
    if (!response.ok) {
      throw new Error('Falha ao carregar informações do restaurante');
    }
    
    const data = await response.json();
    const tenant = data.tenant;
    
    return {
      title: `Checkout - ${tenant.nome || 'Delivery'}`,
      description: tenant.siteDescription || 'Finalize seu pedido de delivery',
    };
  } catch (error) {
    return {
      title: 'Checkout',
      description: 'Finalize seu pedido'
    };
  }
}

export default function CheckoutLayout({
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
