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
  FaLayerGroup,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEllipsisV,
  FaChevronDown,
  FaFilter,
  FaArchive,
  FaTag,
  FaBoxOpen,
} from 'react-icons/fa';
import { useTenant } from '@/hooks/useTenant';
import { CategoriaFormModal } from '@/components/molecules/CategoriaFormModal';
import { useRef } from 'react';
import Link from 'next/link';

// Interface para categoria
interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
  status: boolean;
  _count?: {
    insumos: number;
  };
}

export default function CategoriaEstoquePage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  
  // Estados para dados e filtros
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [filteredCategorias, setFilteredCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  
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
  
  // Função para carregar categorias do servidor
  const fetchCategorias = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/estoque/categorias');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar categorias');
      }
      
      const data = await response.json();
      setCategorias(data.categorias);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as categorias',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carregar categorias ao montar o componente
  useEffect(() => {
    fetchCategorias();
  }, []);
  
  // Filtrar categorias quando o termo de busca ou status mudar
  useEffect(() => {
    const filtered = categorias.filter(categoria => {
      // Filtrar por status se necessário
      if (!showInactive && !categoria.status) {
        return false;
      }
      
      // Filtrar por termo de busca (case insensitive)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          categoria.nome.toLowerCase().includes(term) ||
          (categoria.descricao && categoria.descricao.toLowerCase().includes(term))
        );
      }
      
      return true;
    });
    
    setFilteredCategorias(filtered);
  }, [categorias, searchTerm, showInactive]);
  
  // Manipuladores de eventos
  const handleEdit = (categoria: Categoria) => {
    setSelectedCategoria(categoria);
    onFormOpen();
  };
  
  const handleAdd = () => {
    setSelectedCategoria(null);
    onFormOpen();
  };
  
  const handleDelete = (categoria: Categoria) => {
    setSelectedCategoria(categoria);
    onDeleteOpen();
  };
  
  const confirmDelete = async () => {
    if (!selectedCategoria) return;
    
    try {
      const response = await fetch(`/api/estoque/categorias/${selectedCategoria.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir categoria');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Categoria excluída com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Atualizar lista de categorias
      fetchCategorias();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a categoria',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
    }
  };
  
  const handleToggleStatus = async (categoria: Categoria) => {
    try {
      const response = await fetch(`/api/estoque/categorias/${categoria.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: !categoria.status,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao alterar status');
      }
      
      toast({
        title: 'Sucesso',
        description: `Categoria ${!categoria.status ? 'ativada' : 'desativada'} com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Atualizar lista de categorias
      fetchCategorias();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível alterar o status da categoria',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleFormSuccess = () => {
    onFormClose();
    fetchCategorias();
  };

  return (
    <Box p={5}>
      <Breadcrumb mb={4}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href="/estoque">Estoque</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Categorias</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" display="flex" alignItems="center">
          <Icon as={FaLayerGroup} mr={2} />
          {tenant ? `Categorias de Insumos - ${tenant.nome}` : 'Categorias de Insumos'}
        </Heading>
        
        <Button 
          colorScheme="teal" 
          leftIcon={<FaPlus />} 
          onClick={handleAdd}
        >
          Nova Categoria
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
                placeholder="Buscar categorias..."
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
          ) : filteredCategorias.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              Nenhuma categoria encontrada. {searchTerm && 'Tente ajustar os filtros.'}
            </Alert>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Nome</Th>
                    <Th>Descrição</Th>
                    <Th isNumeric>Insumos</Th>
                    <Th>Status</Th>
                    <Th textAlign="center">Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredCategorias.map((categoria) => (
                    <Tr key={categoria.id}>
                      <Td fontWeight="medium">{categoria.nome}</Td>
                      <Td>{categoria.descricao || '-'}</Td>
                      <Td isNumeric>
                        <Badge colorScheme="blue">
                          {categoria._count?.insumos || 0}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={categoria.status ? 'green' : 'red'}>
                          {categoria.status ? 'Ativo' : 'Inativo'}
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
                                onClick={() => handleEdit(categoria)}
                              >
                                Editar
                              </MenuItem>
                              <MenuItem
                                icon={categoria.status ? <FaArchive /> : <FaTag />}
                                onClick={() => handleToggleStatus(categoria)}
                              >
                                {categoria.status ? 'Desativar' : 'Ativar'}
                              </MenuItem>
                              {(categoria._count?.insumos || 0) === 0 && (
                                <MenuItem 
                                  icon={<FaTrash />} 
                                  color="red.500"
                                  onClick={() => handleDelete(categoria)}
                                >
                                  Excluir
                                </MenuItem>
                              )}
                              <MenuItem 
                                icon={<FaBoxOpen />} 
                                as={Link}
                                href={`/estoque/insumos?categoriaId=${categoria.id}`}
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
      <CategoriaFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        categoria={selectedCategoria}
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
              Excluir Categoria
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem certeza que deseja excluir a categoria "{selectedCategoria?.nome}"?
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
