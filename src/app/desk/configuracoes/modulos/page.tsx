'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box, Heading, Text, Button, Table, Thead, Tbody, Tr, Th, Td, Flex, HStack, Card, CardBody,
  useDisclosure, useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, ModalFooter, FormControl, FormLabel, Input, Textarea, Switch,
  FormErrorMessage, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Spinner, Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaPuzzlePiece } from 'react-icons/fa';
import { ChevronRightIcon } from '@chakra-ui/icons';
import Link from 'next/link';

interface Module {
  id: string;
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tenants: number;
  };
}

export default function ModulosPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    descricao: '',
    status: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const cancelRef = useRef(null);
  const toast = useToast();

  // Cores de UI
  const cardBg = useColorModeValue('white', 'gray.700');

  // Carregar módulos ao montar o componente
  useEffect(() => {
    fetchModules();
  }, []);

  // Buscar a lista de módulos
  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/modules');
      const data = await response.json();

      if (response.ok) {
        setModules(data.modules);
      } else {
        throw new Error(data.message || 'Erro ao carregar módulos');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar os módulos',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir modal para adicionar um novo módulo
  const handleAddModule = () => {
    setSelectedModule(null);
    setFormData({
      nome: '',
      slug: '',
      descricao: '',
      status: true,
    });
    setFormErrors({});
    onFormOpen();
  };

  // Abrir modal para editar um módulo existente
  const handleEditModule = (module: Module) => {
    setSelectedModule(module);
    setFormData({
      nome: module.name,
      slug: module.slug,
      descricao: module.description || '',
      status: module.isActive,
    });
    setFormErrors({});
    onFormOpen();
  };

  // Preparar para excluir um módulo
  const handleDeleteClick = (module: Module) => {
    setSelectedModule(module);
    onDeleteOpen();
  };

  // Validar o formulário
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      errors.nome = 'O nome do módulo é obrigatório';
    }

    if (!formData.slug.trim()) {
      errors.slug = 'O slug do módulo é obrigatório';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'O slug deve conter apenas letras minúsculas, números e hífens';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Lidar com a alteração de campos do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpar erro específico ao editar o campo
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Lidar com a alteração do switch de status
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      status: e.target.checked
    }));
  };

  // Gerar slug com base no nome
  const handleAutogenerateSlug = () => {
    if (formData.nome) {
      const slug = formData.nome
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');

      setFormData(prev => ({
        ...prev,
        slug
      }));

      // Limpar erro de slug se existir
      if (formErrors.slug) {
        setFormErrors(prev => ({
          ...prev,
          slug: ''
        }));
      }
    }
  };

  // Salvar um módulo (criar ou editar)
  const handleSaveModule = async () => {
    if (!validateForm()) return;

    try {
      const isEditing = !!selectedModule;
      const url = isEditing
        ? `/api/modules/${selectedModule.id}`
        : '/api/modules';

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: isEditing
            ? 'Módulo atualizado com sucesso'
            : 'Módulo criado com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        fetchModules();
        onFormClose();
      } else {
        throw new Error(data.message || 'Erro ao salvar módulo');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o módulo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Excluir um módulo
  const handleDeleteModule = async () => {
    if (!selectedModule) return;

    try {
      const response = await fetch(`/api/modules/${selectedModule.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Módulo excluído com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        fetchModules();
        onDeleteClose();
      } else {
        throw new Error(data.message || 'Erro ao excluir módulo');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o módulo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
    }
  };

  return (
    <Box p={4}>
      {/* Breadcrumbs */}
      <Breadcrumb mb={4} fontSize="sm" separator={<ChevronRightIcon color="gray.500" />}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href="/desk">
            Dashboard
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href="/desk/configuracoes/gerais">
            Configurações
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">Módulos</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={1}>
            Gerenciamento de Módulos
          </Heading>
          <Text color="gray.600">
            Gerencie os módulos disponíveis no sistema.
          </Text>
        </Box>

        <Button
          colorScheme="teal"
          leftIcon={<FaPlus />}
          onClick={handleAddModule}
        >
          Novo Módulo
        </Button>
      </Flex>

      <Card bg={cardBg} boxShadow="md">
        <CardBody>
          {isLoading ? (
            <Flex justify="center" py={10}>
              <Spinner size="xl" color="teal.500" />
            </Flex>
          ) : modules.length === 0 ? (
            <Box textAlign="center" py={10}>
              <FaPuzzlePiece size={40} style={{ margin: '0 auto', opacity: 0.4 }} />
              <Text mt={4} fontSize="lg" color="gray.500">
                Nenhum módulo encontrado
              </Text>
              <Button
                mt={4}
                colorScheme="teal"
                leftIcon={<FaPlus />}
                size="sm"
                onClick={handleAddModule}
              >
                Adicionar Módulo
              </Button>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Nome</Th>
                    <Th>Slug</Th>
                    <Th>Descrição</Th>
                    <Th>Status</Th>
                    <Th>Tenants</Th>
                    <Th textAlign="right">Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {modules.map((module) => (
                    <Tr key={module.id}>
                      <Td fontWeight="medium">{module.name}</Td>
                      <Td><code>{module.slug}</code></Td>
                      <Td>{module.description || '-'}</Td>
                      <Td>
                        <Badge
                          colorScheme={module.isActive ? 'green' : 'red'}
                          variant="subtle"
                          px={2}
                          py={1}
                          borderRadius="md"
                        >
                          {module.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme="purple"
                          variant="outline"
                          px={2}
                          py={1}
                        >
                          {module._count?.tenants || 0}
                        </Badge>
                      </Td>
                      <Td textAlign="right">
                        <HStack spacing={2} justifyContent="flex-end">
                          <Button
                            size="sm"
                            leftIcon={<FaEdit />}
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => handleEditModule(module)}
                          >
                            Editar
                          </Button>

                          {(module._count?.tenants || 0) === 0 && (
                            <Button
                              size="sm"
                              leftIcon={<FaTrash />}
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleDeleteClick(module)}
                            >
                              Excluir
                            </Button>
                          )}
                        </HStack>
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
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedModule ? 'Editar Módulo' : 'Novo Módulo'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl isInvalid={!!formErrors.nome} mb={4}>
              <FormLabel>Nome do Módulo</FormLabel>
              <Input
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Ex: Estoque, Financeiro, etc."
              />
              {formErrors.nome && (
                <FormErrorMessage>{formErrors.nome}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl isInvalid={!!formErrors.slug} mb={4}>
              <FormLabel>
                Slug
                <Button
                  size="xs"
                  ml={2}
                  colorScheme="blue"
                  variant="outline"
                  onClick={handleAutogenerateSlug}
                >
                  Gerar
                </Button>
              </FormLabel>
              <Input
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="ex: estoque, financeiro, etc."
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                Identificador único usado internamente pelo sistema. Use apenas letras minúsculas, números e hífens.
              </Text>
              {formErrors.slug && (
                <FormErrorMessage>{formErrors.slug}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Descrição</FormLabel>
              <Textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                placeholder="Descreva a funcionalidade deste módulo"
                resize="vertical"
                rows={3}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center" mb={4}>
              <FormLabel mb="0">
                Status Ativo
              </FormLabel>
              <Switch
                id="status"
                name="status"
                isChecked={formData.status}
                onChange={handleSwitchChange}
                colorScheme="green"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onFormClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleSaveModule}
            >
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Excluir Módulo
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem certeza que deseja excluir o módulo <strong>{selectedModule?.name}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={handleDeleteModule} ml={3}>
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}