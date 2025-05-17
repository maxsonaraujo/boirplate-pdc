'use client'

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  useToast,
  Badge,
  Switch,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Spinner,
  Alert,
  AlertIcon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useDisclosure,
  Text,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@chakra-ui/react';
import {
  FaRuler,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEllipsisV,
  FaFilter,
  FaArchive,
  FaTag,
  FaInfo,
} from 'react-icons/fa';
import { useTenant } from '@/hooks/useTenant';
import { UnidadeMedidaFormModal } from '@/components/molecules/UnidadeMedidaFormModal';
import { useRef } from 'react';
import Link from 'next/link';

// Interface para unidade de medida
interface UnidadeMedida {
  id: number;
  nome: string;
  simbolo: string;
  descricao?: string;
  status: boolean;
  _count?: {
    insumos: number;
  };
}

export default function UnidadesMedidaPage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  
  // Estados para dados e filtros
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [filteredUnidades, setFilteredUnidades] = useState<UnidadeMedida[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState<UnidadeMedida | null>(null);
  
  // Estados para modal de formulário
  const { 
    isOpen: isFormOpen, 
    onOpen: onFormOpen, 
    onClose: onFormClose 
  } = useDisclosure();
  
  // Estados para diálogo de confirmação
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  const cancelRef = useRef(null);
  
  // Função para carregar unidades do servidor
  const fetchUnidades = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/unidades-medida');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar unidades de medida');
      }
      
      const data = await response.json();
      setUnidades(data.unidades);
    } catch (error) {
      console.error('Erro ao carregar unidades de medida:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as unidades de medida',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carregar unidades ao montar o componente
  useEffect(() => {
    fetchUnidades();
  }, []);
  
  // Filtrar unidades quando o termo de busca ou status mudar
  useEffect(() => {
    const filtered = unidades.filter(unidade => {
      // Filtrar por status se necessário
      if (!showInactive && !unidade.status) {
        return false;
      }
      
      // Filtrar por termo de busca (case insensitive)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          unidade.nome.toLowerCase().includes(term) ||
          unidade.simbolo.toLowerCase().includes(term) ||
          (unidade.descricao && unidade.descricao.toLowerCase().includes(term))
        );
      }
      
      return true;
    });
    
    setFilteredUnidades(filtered);
  }, [unidades, searchTerm, showInactive]);
  
  // Manipuladores de eventos
  const handleEdit = (unidade: UnidadeMedida) => {
    setSelectedUnidade(unidade);
    onFormOpen();
  };
  
  const handleAdd = () => {
    setSelectedUnidade(null);
    onFormOpen();
  };
  
  const handleDelete = (unidade: UnidadeMedida) => {
    setSelectedUnidade(unidade);
    onDeleteOpen();
  };
  
  const confirmDelete = async () => {
    if (!selectedUnidade) return;
    
    try {
      const response = await fetch(`/api/estoque/unidades/${selectedUnidade.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir unidade de medida');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Unidade de medida excluída com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Atualizar lista de unidades
      fetchUnidades();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a unidade de medida',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
    }
  };
  
  const handleToggleStatus = async (unidade: UnidadeMedida) => {
    try {
      const response = await fetch(`/api/unidades-medida/${unidade.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: !unidade.status,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao alterar status');
      }
      
      toast({
        title: 'Sucesso',
        description: `Unidade de medida ${!unidade.status ? 'ativada' : 'desativada'} com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Atualizar lista de unidades
      fetchUnidades();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível alterar o status da unidade de medida',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleFormSuccess = () => {
    onFormClose();
    fetchUnidades();
  };

  return (
    <Box p={5}>
      <Breadcrumb mb={4}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href="/estoque">Estoque</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Unidades de Medida</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" display="flex" alignItems="center">
          <Icon as={FaRuler} mr={2} />
          {tenant ? `Unidades de Medida - ${tenant.nome}` : 'Unidades de Medida'}
        </Heading>
        
        <Button 
          colorScheme="teal" 
          leftIcon={<FaPlus />} 
          onClick={handleAdd}
        >
          Nova Unidade
        </Button>
      </Flex>
      
      <Card bg={cardBg} boxShadow="md" mb={6}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            {/* Barra de busca */}
            <InputGroup maxW="400px">
              <InputLeftElement>
                <Icon as={FaSearch} color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Buscar unidades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            {/* Filtro de status */}
            <HStack>
              <Icon as={FaFilter} />
              <Text>Mostrar inativas</Text>
              <Switch 
                colorScheme="teal" 
                isChecked={showInactive} 
                onChange={() => setShowInactive(!showInactive)} 
              />
            </HStack>
          </Flex>
        </CardHeader>
        
        <CardBody>
          {isLoading ? (
            <Flex justify="center" p={8}>
              <Spinner size="xl" />
            </Flex>
          ) : filteredUnidades.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              Nenhuma unidade de medida encontrada. {searchTerm && 'Tente ajustar os filtros.'}
            </Alert>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Nome</Th>
                    <Th>Símbolo</Th>
                    <Th>Descrição</Th>
                    <Th isNumeric>Insumos</Th>
                    <Th>Status</Th>
                    <Th textAlign="center">Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredUnidades.map((unidade) => (
                    <Tr key={unidade.id}>
                      <Td fontWeight="medium">{unidade.nome}</Td>
                      <Td><Badge colorScheme="blue">{unidade.simbolo}</Badge></Td>
                      <Td>{unidade.descricao || '-'}</Td>
                      <Td isNumeric>
                        <Badge colorScheme="purple">
                          {unidade._count?.insumos || 0}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={unidade.status ? 'green' : 'red'}>
                          {unidade.status ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </Td>
                      <Td>
                        <Flex justify="center">
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<FaEllipsisV />}
                              variant="ghost"
                              size="sm"
                            />
                            <MenuList>
                              <MenuItem 
                                icon={<FaEdit />} 
                                onClick={() => handleEdit(unidade)}
                              >
                                Editar
                              </MenuItem>
                              <MenuItem
                                icon={unidade.status ? <FaArchive /> : <FaTag />}
                                onClick={() => handleToggleStatus(unidade)}
                              >
                                {unidade.status ? 'Desativar' : 'Ativar'}
                              </MenuItem>
                              {(unidade._count?.insumos || 0) === 0 && (
                                <MenuItem 
                                  icon={<FaTrash />} 
                                  color="red.500"
                                  onClick={() => handleDelete(unidade)}
                                >
                                  Excluir
                                </MenuItem>
                              )}
                              <MenuItem 
                                icon={<FaInfo />} 
                                as={Link}
                                href={`/estoque/insumos?unidadeMedidaId=${unidade.id}`}
                              >
                                Ver Insumos
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>
      
      {/* Modal de formulário */}
      <UnidadeMedidaFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        unidade={selectedUnidade}
        onSuccess={handleFormSuccess}
      />
      
      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Excluir Unidade de Medida
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem certeza que deseja excluir a unidade "{selectedUnidade?.nome}" ({selectedUnidade?.simbolo})?
              Esta ação não pode ser desfeita.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
