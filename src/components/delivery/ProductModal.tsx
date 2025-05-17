import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Image,
  Text,
  Box,
  Stack,
  Heading,
  Flex,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  Checkbox,
  VStack,
  HStack,
  useColorModeValue,
  Alert,
  AlertIcon,
  Textarea,
  Skeleton,
  Badge
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FaShoppingCart } from 'react-icons/fa';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onAddToCart: (product: any, quantity: number, options?: any, observation?: string) => void;
  tenantPrimaryColor?: string;
}

export function ProductModal({ 
  isOpen, 
  onClose, 
  product, 
  onAddToCart,
  tenantPrimaryColor = 'teal.500' 
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(product?.precoVenda || 0);
  const [selectedOptions, setSelectedOptions] = useState<any>({
    complementos: {}
  });
  const [basePrice, setBasePrice] = useState(product?.precoVenda || 0);
  const [additionalPrice, setAdditionalPrice] = useState(0);
  const [sabores, setSabores] = useState<any[]>([]);
  const [selectedSabores, setSelectedSabores] = useState<number[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [observation, setObservation] = useState('');
  const [isLoadingSabores, setIsLoadingSabores] = useState(false);
  const [maxSabores, setMaxSabores] = useState(product?.maxSabores || 1);
  const [tipoCobranca, setTipoCobranca] = useState(product?.tipoCobranca || '');
  const [exibirPrecoBase, setExibirPrecoBase] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  
  useEffect(() => {
    if (isOpen) {
      if (product?.aceitaSabores && product?.id) {
        fetchSabores();
      }
      setQuantity(1);
      setSelectedOptions({
        complementos: {}
      });
      setSelectedSabores([]);
      setValidationErrors([]);
      setTotalPrice(product?.precoVenda || 0);
      setObservation('');
      setAdditionalPrice(0);
    }
  }, [isOpen, product]);

  const fetchSabores = async () => {
    if (product?.aceitaSabores && product?.id) {
      try {
        setIsLoadingSabores(true);
        const response = await fetch(`/api/delivery/products/${product.id}/sabores`);
        const data = await response.json();
        if (response.ok) {
          setSabores(data.sabores || []);
          if (data.maxSabores) {
            setMaxSabores(data.maxSabores);
          }
          if (data.tipoCobranca) {
            setTipoCobranca(data.tipoCobranca);
          }
          setExibirPrecoBase(data.exibirPrecoBase || false);
        } else {
          console.error('Erro ao buscar sabores:', data.error);
        }
      } catch (error) {
        console.error('Erro ao buscar sabores:', error);
      } finally {
        setIsLoadingSabores(false);
      }
    }
  };

  useEffect(() => {
    let currentBasePrice = product?.precoVenda || 0;
    let currentAdditionalPrice = 0;
    
    if (selectedOptions.complementos) {
      Object.values(selectedOptions.complementos).forEach((groupSelections: any) => {
        if (Array.isArray(groupSelections)) {
          groupSelections.forEach((compId: number) => {
            const complemento = product.grupoComplementos?.flatMap((grupo: any) => 
              grupo.grupoComplemento.complementos
            )?.find(
              (c: any) => c.complemento.id === compId
            )?.complemento;
            
            if (complemento?.precoAdicional) {
              currentAdditionalPrice += parseFloat(complemento.precoAdicional);
            }
          });
        } else if (groupSelections) {
          const complemento = product.grupoComplementos?.flatMap((grupo: any) => 
            grupo.grupoComplemento.complementos
          )?.find(
            (c: any) => c.complemento.id === groupSelections
          )?.complemento;
          
          if (complemento?.precoAdicional) {
            currentAdditionalPrice += parseFloat(complemento.precoAdicional);
          }
        }
      });
    }
    
    if (product?.aceitaSabores && selectedSabores.length > 0) {
      const selectedSaboresData = sabores
        .filter(s => selectedSabores.includes(s.saborId))
        .map(s => ({
          price: parseFloat(s.sabor.precoVenda) + (s.precoAdicional || 0),
          id: s.saborId
        }));
      
      if (selectedSaboresData.length > 0) {
        if (tipoCobranca === 'mais_caro') {
          const maxPrice = Math.max(...selectedSaboresData.map(s => s.price));
          currentBasePrice = maxPrice;
        } else if (tipoCobranca === 'media') {
          const totalSaboresPrice = selectedSaboresData.reduce((sum, s) => sum + s.price, 0);
          currentBasePrice = totalSaboresPrice / selectedSaboresData.length;
        } else if (tipoCobranca === 'proporcional') {
          const totalSaboresPrice = selectedSaboresData.reduce((sum, s) => sum + s.price, 0);
          currentBasePrice = totalSaboresPrice / selectedSaboresData.length;
        } else if (tipoCobranca === 'valor_base') {
          // currentBasePrice already holds the value of product.precoVenda
        }
      }
    }
    
    setBasePrice(currentBasePrice);
    setAdditionalPrice(currentAdditionalPrice);
    setTotalPrice((currentBasePrice + currentAdditionalPrice) * quantity);
  }, [product, selectedOptions, selectedSabores, quantity, sabores, tipoCobranca]);
  
  const handleComplementoChange = (groupId: number, complementoId: number, isExclusive: boolean) => {
    setSelectedOptions(prevOptions => {
      const newOptions = { 
        ...prevOptions,
        complementos: { ...prevOptions.complementos } 
      };
      
      if (isExclusive) {
        if (newOptions.complementos[groupId] === complementoId) {
          newOptions.complementos[groupId] = null;
        } else {
          newOptions.complementos[groupId] = complementoId;
        }
      } else {
        if (!Array.isArray(newOptions.complementos[groupId])) {
          newOptions.complementos[groupId] = [];
        }
        
        const selections = [...newOptions.complementos[groupId]];
        const index = selections.indexOf(complementoId);
        
        if (index > -1) {
          selections.splice(index, 1);
        } else {
          selections.push(complementoId);
        }
        
        newOptions.complementos[groupId] = selections;
      }
      
      return newOptions;
    });
  };
  
  const handleSaborChange = (saborId: number) => {
    setSelectedSabores(prev => {
      const newSelection = [...prev];
      const index = newSelection.indexOf(saborId);
      
      if (index === -1) {
        if (newSelection.length < maxSabores) {
          newSelection.push(saborId);
        }
      } else {
        newSelection.splice(index, 1);
      }
      
      return newSelection;
    });
  };
  
  const validateSelections = () => {
    const errors = [];
    
    if (product.grupoComplementos?.length > 0) {
      product.grupoComplementos.forEach((grupo: any) => {
        if (grupo.obrigatorio) {
          const selections = selectedOptions.complementos?.[grupo.grupoComplementoId] || [];
          const count = Array.isArray(selections) ? selections.length : selections ? 1 : 0;
          
          if (count < (grupo.minSelecao || 0)) {
            errors.push(`Selecione pelo menos ${grupo.minSelecao} opções em "${grupo.grupoComplemento.nome}"`);
          }
        }
      });
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  const handleAddToCart = () => {
    if (!validateSelections()) return;
    
    const productWithOptions = {
      ...product,
      selectedOptions: {
        ...selectedOptions,
        sabores: selectedSabores.map(id => {
          const sabor = sabores.find(s => s.saborId === id);
          return {
            id,
            nome: sabor?.sabor?.nome,
            precoAdicional: sabor?.precoAdicional || 0
          };
        })
      },
      precoFinal: totalPrice / quantity,
      observation: observation
    };
    
    onAddToCart(productWithOptions, quantity, selectedOptions, observation);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };
  
  const isComplementoSelected = (groupId: number, complementoId: number, isExclusive: boolean): boolean => {
    const selections = selectedOptions.complementos?.[groupId];
    
    if (isExclusive) {
      return selections === complementoId;
    } else {
      return Array.isArray(selections) && selections.includes(complementoId);
    }
  };
  
  const isMaxSelectionReached = (groupId: number, maxSelecao: number): boolean => {
    const selections = selectedOptions.complementos?.[groupId];
    
    if (!Array.isArray(selections)) return false;
    
    return selections.length >= maxSelecao && maxSelecao > 0;
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader color={tenantPrimaryColor}>{product?.nome}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {product?.imagem && (
            <Image
              src={product.imagem}
              alt={product.nome}
              borderRadius="md"
              objectFit="cover"
              width="100%"
              height="200px"
              mb={4}
            />
          )}
          
          <Text mb={4}>{product?.descricao}</Text>
          
          <Divider mb={4} />
          
          <FormControl mb={6}>
            <FormLabel fontWeight="bold">Quantidade</FormLabel>
            <NumberInput
              defaultValue={1}
              min={1}
              max={20}
              value={quantity}
              onChange={(_, value) => setQuantity(value)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
          
          {product?.aceitaSabores && (
            <Box mb={6}>
              <HStack justify="space-between" mb={2}>
                <Heading size="sm">
                  Sabores {maxSabores > 1 ? `(máximo ${maxSabores})` : ''}
                </Heading>
                {exibirPrecoBase && (
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">
                    Preço base: {formatCurrency(product.precoVenda || 0)}
                  </Text>
                )}
              </HStack>
              
              <Text fontSize="sm" mb={3}>
                {maxSabores > 1 
                  ? `Selecione de 1 até ${maxSabores} sabores` 
                  : 'Selecione o sabor desejado'}
              </Text>
              
              {isLoadingSabores ? (
                <VStack align="stretch" spacing={3}>
                  <Skeleton height="40px" />
                  <Skeleton height="40px" />
                  <Skeleton height="40px" />
                </VStack>
              ) : sabores.length === 0 ? (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Text>Não há sabores disponíveis para este produto</Text>
                </Alert>
              ) : (
                <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto" pr={2}>
                  {sabores.map(sabor => (
                    <Box 
                      key={sabor.saborId} 
                      borderWidth="1px" 
                      borderRadius="md" 
                      p={2}
                      bg={selectedSabores.includes(sabor.saborId) ? 'gray.50' : 'transparent'}
                      borderColor={selectedSabores.includes(sabor.saborId) ? 'teal.300' : 'gray.200'}
                      _hover={{ borderColor: 'teal.300' }}
                      cursor="pointer"
                      onClick={() => handleSaborChange(sabor.saborId)}
                    >
                      <HStack spacing={3} justify="space-between">
                        <Checkbox 
                          isChecked={selectedSabores.includes(sabor.saborId)} 
                          onChange={() => handleSaborChange(sabor.saborId)}
                          isDisabled={
                            !selectedSabores.includes(sabor.saborId) && 
                            selectedSabores.length >= maxSabores
                          }
                        >
                          <VStack align="start" spacing={0}>
                            <HStack>
                              <Text fontWeight="medium">{sabor.sabor.nome}</Text>
                              {sabor.precoAdicional > 0 && (
                                <Badge colorScheme="green">
                                  +{formatCurrency(sabor.precoAdicional)}
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize="sm" color="gray.500">
                              Valor: {formatCurrency(parseFloat(sabor.sabor.precoVenda) || 0)}
                            </Text>
                          </VStack>
                        </Checkbox>
                        
                        {sabor.sabor.imagem && (
                          <Image 
                            src={sabor.sabor.imagem} 
                            alt={sabor.sabor.nome}
                            boxSize="32px"
                            borderRadius="full"
                            objectFit="cover"
                          />
                        )}
                      </HStack>
                      
                      {sabor.sabor.descricao && (
                        <Text fontSize="xs" ml={6} color="gray.600" mt={1}>
                          {sabor.sabor.descricao}
                        </Text>
                      )}
                    </Box>
                  ))}
                </VStack>
              )}
              
              {product?.aceitaSabores && tipoCobranca && (
                <Box mt={3} p={2} bg="gray.50" borderRadius="md">
                  <Text fontSize="sm" fontWeight="medium" color="gray.600">
                    Como é calculado o preço:
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {tipoCobranca === 'mais_caro' && 'Será cobrado o valor do sabor mais caro selecionado.'}
                    {tipoCobranca === 'media' && 'Será cobrado o valor médio dos sabores selecionados.'}
                    {tipoCobranca === 'proporcional' && 'Os valores dos sabores serão cobrados proporcionalmente.'}
                    {tipoCobranca === 'valor_base' && 'Será cobrado o valor base do produto independente dos sabores escolhidos.'}
                  </Text>
                </Box>
              )}
            </Box>
          )}
          
          {product?.grupoComplementos?.map((grupo: any) => (
            <Box key={grupo.grupoComplementoId} mb={6}>
              <Flex justify="space-between" align="center" mb={2}>
                <Heading size="sm">
                  {grupo.grupoComplemento.nome}
                </Heading>
                {grupo.obrigatorio ? (
                  <Text fontSize="xs" bg="red.100" color="red.800" px={2} py={1} borderRadius="full">
                    Obrigatório
                  </Text>
                ) : (
                  <Text fontSize="xs" bg="gray.100" color="gray.600" px={2} py={1} borderRadius="full">
                    Opcional
                  </Text>
                )}
              </Flex>
              
              <Text fontSize="sm" mb={3}>
                {grupo.minSelecao > 0 && (
                  <>Mínimo: {grupo.minSelecao} • </>
                )}
                {!grupo.minSelecao || grupo.minSelecao === 0 ? (
                  <Text as="span" fontStyle="italic" color="gray.500" mr={2}>
                    Você pode pular esta seção •  
                  </Text>
                ) : null}
                 Máximo: {grupo.maxSelecao || 'ilimitado'}
              </Text>
              
              <VStack align="stretch" spacing={2}>
                {grupo.grupoComplemento.complementos?.map((item: any) => {
                  const isExclusive = grupo.maxSelecao === 1;
                  const complementoId = item.complemento.id;
                  const precoAdicional = parseFloat(item.complemento.precoAdicional) || 0;
                  
                  const isSelected = isComplementoSelected(grupo.grupoComplementoId, complementoId, isExclusive);
                  
                  const isDisabled = !isSelected && 
                    isMaxSelectionReached(grupo.grupoComplementoId, grupo.maxSelecao);
                  
                  return (
                    <Box 
                      key={complementoId} 
                      borderWidth="1px" 
                      borderRadius="md" 
                      p={2}
                      bg={isSelected ? 'gray.50' : 'white'}
                      borderColor={isSelected ? 'teal.300' : 'gray.200'}
                      _hover={{ borderColor: 'teal.300' }}
                      cursor={isDisabled ? 'not-allowed' : 'pointer'}
                      onClick={() => {
                        if (!isDisabled) {
                          handleComplementoChange(grupo.grupoComplementoId, complementoId, isExclusive);
                        }
                      }}
                    >
                      <Flex justify="space-between" width="100%" align="center">
                        <Checkbox
                          isChecked={isSelected}
                          onChange={() => {
                            if (!isDisabled) {
                              handleComplementoChange(grupo.grupoComplementoId, complementoId, isExclusive);
                            }
                          }}
                          isDisabled={isDisabled}
                          pointerEvents="none"
                        >
                          <Text>{item.complemento.nome}</Text>
                        </Checkbox>
                        {precoAdicional > 0 && (
                          <Badge colorScheme="green" fontSize="sm" variant="subtle">
                            +{formatCurrency(precoAdicional)}
                          </Badge>
                        )}
                      </Flex>
                      {isSelected && precoAdicional > 0 && (
                        <Text fontSize="xs" color="green.500" ml={6} mt={1}>
                          Adicionou {formatCurrency(precoAdicional)} ao valor
                        </Text>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            </Box>
          ))}
          
          <FormControl mt={4} mb={6}>
            <FormLabel fontWeight="bold">Observações</FormLabel>
            <Textarea
              placeholder="Alguma observação especial para este pedido? Ex: Sem cebola, bem passado, etc."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              resize="vertical"
              rows={3}
            />
          </FormControl>
          
          {validationErrors.length > 0 && (
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                {validationErrors.map((error, idx) => (
                  <Text key={idx} fontSize="sm">{error}</Text>
                ))}
              </VStack>
            </Alert>
          )}
        </ModalBody>
        
        <ModalFooter borderTopWidth="1px">
          <Flex width="100%" justify="space-between" align="center">
            <Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color="gray.500">Preço base: {formatCurrency(basePrice)}</Text>
                {additionalPrice > 0 && (
                  <Text fontSize="sm" color="green.500">
                    Adicionais: +{formatCurrency(additionalPrice)}
                  </Text>
                )}
                <Text fontWeight="bold" fontSize="lg" color={tenantPrimaryColor}>
                  Total: {formatCurrency(totalPrice)}
                </Text>
              </VStack>
            </Box>
            
            <Button
              colorScheme="teal"
              leftIcon={<FaShoppingCart />}
              onClick={handleAddToCart}
              isDisabled={validationErrors.length > 0}
            >
              Adicionar ao Carrinho
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
