import { VStack, Icon, Text, Box, useColorModeValue } from '@chakra-ui/react';
import { IconType } from 'react-icons';

interface EmptyStateProps {
  message: string;
  icon: IconType;
  action?: React.ReactNode;
}

export function EmptyState({ message, icon, action }: EmptyStateProps) {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.500', 'gray.400');
  
  return (
    <VStack
      spacing={4}
      padding={8}
      borderRadius="lg"
      bg={bgColor}
      width="100%"
      justify="center"
      align="center"
    >
      <Box 
        p={3} 
        borderRadius="full" 
        bg={useColorModeValue('gray.100', 'gray.600')}
      >
        <Icon as={icon} boxSize={8} color={textColor} />
      </Box>
      <Text color={textColor} fontWeight="medium" textAlign="center">
        {message}
      </Text>
      {action && (
        <Box mt={2}>
          {action}
        </Box>
      )}
    </VStack>
  );
}
