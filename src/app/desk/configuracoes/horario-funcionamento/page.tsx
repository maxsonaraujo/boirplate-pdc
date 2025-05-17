'use client';

import { Container, Heading, Text, Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react';
import HorariosFuncionamentoForm from '@/components/molecules/HorariosFuncionamentoForm';
import { ChevronRightIcon } from '@chakra-ui/icons';

export default function HorariosFuncionamentoPage() {
  return (
    <Container maxW="container.xl" py={6}>
      <Heading mb={4}>Horários de Funcionamento</Heading>
      <Text mb={6} color="gray.600">
        Configure os horários de funcionamento para o site de delivery. Os clientes só poderão
        fazer pedidos quando seu estabelecimento estiver aberto.
      </Text>

      <HorariosFuncionamentoForm />
    </Container>
  );
}
