'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Switch,
  VStack,
  Textarea,
  useToast,
  InputGroup,
  InputLeftAddon,
  Text,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { Module } from '@/hooks/useModules';

interface ModuleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: Module | null;
}

export function ModuleFormModal({ isOpen, onClose, module }: ModuleFormModalProps) {
  const toast = useToast();
  const isEditing = !!module;
  
  // Estados do formulário
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Preencher o formulário se estiver editando
  useEffect(() => {
    if (module) {
      setName(module.name);
      setSlug(module.slug);
      setDescription(module.description || '');
      setActive(module.isActive);
    } else {
      // Resetar o formulário se estiver adicionando
      setName('');
      setSlug('');
      setDescription('');
      setActive(true);
    }
    
    // Limpar os erros ao abrir o modal
    setErrors({});
  }, [module, isOpen]);
  
  // Gerar o slug a partir do nome
  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  // Atualizar o slug quando o nome mudar, exceto se estiver editando
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    
    // Só gerar slug automaticamente se for um novo módulo ou o slug ainda não foi editado
    if (!isEditing || slug === generateSlug(module?.name || '')) {
      setSlug(generateSlug(newName));
    }
  };
  
  // Validar o formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'O nome é obrigatório';
    }
    
    if (!slug.trim()) {
      newErrors.slug = 'O slug é obrigatório';
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      newErrors.slug = 'O slug deve conter apenas letras minúsculas, números e hífens';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Enviar o formulário
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const url = isEditing ? `/api/modules/${module.id}` : '/api/modules';
      const method = isEditing ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
          active,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar módulo');
      }
      
      toast({
        title: 'Sucesso',
        description: isEditing 
          ? `Módulo ${name} atualizado com sucesso` 
          : `Módulo ${name} criado com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar o módulo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isEditing ? 'Editar Módulo' : 'Adicionar Módulo'}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.name}>
              <FormLabel>Nome</FormLabel>
              <Input
                placeholder="Nome do módulo"
                value={name}
                onChange={handleNameChange}
              />
              {errors.name && (
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              )}
            </FormControl>
            
            <FormControl isInvalid={!!errors.slug}>
              <FormLabel>Slug</FormLabel>
              <InputGroup>
                <Input
                  placeholder="slug-do-modulo"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                />
              </InputGroup>
              {errors.slug ? (
                <FormErrorMessage>{errors.slug}</FormErrorMessage>
              ) : (
                <Text fontSize="sm" color="gray.500" mt={1}>
                  O slug é usado como identificador único do módulo no sistema
                </Text>
              )}
            </FormControl>
            
            <FormControl>
              <FormLabel>Descrição</FormLabel>
              <Textarea
                placeholder="Descrição do módulo (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="active" mb="0">
                Módulo ativo?
              </FormLabel>
              <Switch
                id="active"
                isChecked={active}
                onChange={(e) => setActive(e.target.checked)}
                colorScheme="teal"
              />
            </FormControl>
            
            {isEditing && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                Alterar o módulo afetará todos os tenants que o utilizam.
              </Alert>
            )}
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            colorScheme="teal"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {isEditing ? 'Atualizar' : 'Adicionar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}