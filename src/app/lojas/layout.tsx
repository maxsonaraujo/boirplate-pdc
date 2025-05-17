import { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { slug?: string }
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    // Buscar informações do tenant para metadados
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/delivery/tenant`);
    
    if (!response.ok) {
      throw new Error('Falha ao carregar informações do restaurante');
    }
    
    const data = await response.json();
    const tenant = data.tenant;
    
    return {
      title: `Nossas Lojas - ${tenant.nome || 'Delivery Online'}`,
      description: `Confira todas as lojas do ${tenant.nome || 'nosso restaurante'} e encontre a mais próxima de você.`,
      keywords: `lojas, filiais, ${tenant.nome}, delivery, restaurante, ${tenant.siteKeywords || ''}`,
    };
  } catch (error) {
    return {
      title: 'Nossas Lojas',
      description: 'Confira todas as nossas lojas e encontre a mais próxima de você',
    };
  }
}

export default function LojasLayout({
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