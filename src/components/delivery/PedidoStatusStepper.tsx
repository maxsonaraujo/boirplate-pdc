import {
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  Box,
  StepSeparator,
  Icon,
  useSteps
} from '@chakra-ui/react';
import { PedidoStatus, orderSteps, statusToStepperIndex } from '@/constants/pedidoStatus';

interface PedidoStatusStepperProps {
  status: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: string;
}

/**
 * Componente para exibir o progresso do pedido como um stepper/timeline
 */
export function PedidoStatusStepper({ 
  status, 
  orientation = 'vertical', 
  size = 'md',
  colorScheme = 'teal'
}: PedidoStatusStepperProps) {
  // Determina o passo ativo com base no status atual
  const activeStep = statusToStepperIndex[status as PedidoStatus] || 0;
  
  // Calculamos o tamanho adequado para a altura do stepper
  const getStepperHeight = () => {
    if (orientation === 'horizontal') return 'auto';
    return size === 'sm' ? '200px' : size === 'md' ? '250px' : '300px';
  };

  console.log("orderSteps", orderSteps);
  return (
    <Stepper 
      index={activeStep} 
      orientation={orientation} 
      height={getStepperHeight()} 
      gap={0}
      colorScheme={colorScheme}
      size={size}
    >
      {orderSteps.map((step, index) => (
        <Step key={index}>
          <StepIndicator>
            <StepStatus
              complete={<Icon as={step.icon} />}
              incomplete={<StepNumber>{index + 1}</StepNumber>}
              active={<Icon as={step.icon} />}
            />
          </StepIndicator>
          <Box flexShrink={0}>
            <StepTitle>{step.label}</StepTitle>
            <StepDescription>{step.description}</StepDescription>
          </Box>
          <StepSeparator />
        </Step>
      ))}
    </Stepper>
  );
}
