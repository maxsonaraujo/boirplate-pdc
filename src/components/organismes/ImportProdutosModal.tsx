'use client'

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Box,
  useColorModeValue,
  Alert,
  AlertIcon,
  Progress,
  Icon,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  useToast,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react'
import { useState, useRef, useEffect } from 'react'
import { 
  FaFileImport, 
  FaDownload, 
  FaUpload, 
  FaCheck, 
  FaTimes, 
  FaFileExcel, 
  FaInfoCircle,
  FaExclamationTriangle
} from 'react-icons/fa'

export function ImportProdutosModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewData, setPreviewData] = useState([])
  const [importResults, setImportResults] = useState({
    success: 0,
    errors: 0,
    messages: []
  })
  
  const fileInputRef = useRef(null)
  const toast = useToast()
  
  // Reset modal ao abrir
  const handleModalOpen = () => {
    setStep(1)
    setFile(null)
    setFileName('')
    setProgress(0)
    setPreviewData([])
    setImportResults({
      success: 0,
      errors: 0,
      messages: []
    })
  }
  
  // Baixar modelo de planilha
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/produtos/template')
      if (!response.ok) throw new Error('Erro ao baixar modelo')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'modelo_importacao_produtos.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: 'Modelo baixado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (error) {
      toast({
        title: 'Erro ao baixar modelo',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }
  
  // Selecionar arquivo
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return
    
    // Verificar se é um arquivo Excel
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const extension = '.' + selectedFile.name.split('.').pop().toLowerCase()
    
    if (!validExtensions.includes(extension)) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv)',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }
    
    setFile(selectedFile)
    setFileName(selectedFile.name)
    
    // Simular validação e preview
    setTimeout(() => {
      setPreviewData([
        { codigo: 'X001', nome: 'Produto Exemplo 1', precoVenda: 15.90, status: true, erro: null },
        { codigo: 'X002', nome: 'Produto Exemplo 2', precoVenda: 25.50, status: true, erro: null },
        { codigo: 'X003', nome: '', precoVenda: 30.00, status: true, erro: 'Nome em branco' },
        { codigo: '', nome: 'Produto Inválido', precoVenda: 12.00, status: true, erro: 'Código em branco' },
        { codigo: 'X004', nome: 'Produto Exemplo 4', precoVenda: -5.00, status: true, erro: 'Preço inválido' }
      ])
      setStep(2)
    }, 1000)
  }
  
  // Iniciar importação
  const handleStartImport = async () => {
    setIsLoading(true)
    setProgress(0)
    
    try {
      // Criar FormData para envio
      const formData = new FormData()
      formData.append('file', file)
      
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.floor(Math.random() * 10)
          return newProgress >= 100 ? 100 : newProgress
        })
      }, 300)
      
      // Aqui iria o código real para enviar o arquivo ao servidor
      // const response = await fetch('/api/produtos/import', {
      //   method: 'POST',
      //   body: formData
      // })
      
      // Simulação de um tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      clearInterval(progressInterval)
      setProgress(100)
      
      // Simular resultados
      setImportResults({
        success: 3,
        errors: 2,
        messages: [
          { type: 'success', message: 'Produto X001 "Produto Exemplo 1" importado com sucesso' },
          { type: 'success', message: 'Produto X002 "Produto Exemplo 2" importado com sucesso' },
          { type: 'error', message: 'Erro na linha 3: Nome do produto não pode ser vazio' },
          { type: 'error', message: 'Erro na linha 4: Código do produto não pode ser vazio' },
          { type: 'success', message: 'Produto X004 "Produto Exemplo 4" atualizado com sucesso' }
        ]
      })
      
      setStep(3)
      
      // Se tudo ocorreu bem, atualizar a lista de produtos
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: 'Erro na importação',
        description: error.message || 'Ocorreu um erro ao importar os produtos',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fechar modal
  const handleClose = () => {
    if (isLoading) return // Evitar fechamento durante o processamento
    onClose()
  }
  
  // Resetar estado do modal quando for aberto
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setFile(null)
      setFileName('')
      setProgress(0)
      setPreviewData([])
      setImportResults({
        success: 0,
        errors: 0,
        messages: []
      })
    }
  }, [isOpen])
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      size="4xl" 
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={FaFileImport} />
            <Text>Importar Produtos</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={isLoading} />

        <ModalBody>
          {/* Passo 1: Seleção de arquivo */}
          {step === 1 && (
            <VStack spacing={6} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Instruções para Importação</Text>
                  <Text fontSize="sm">
                    Faça o download do modelo e preencha com seus produtos. Em seguida, faça o upload do arquivo.
                  </Text>
                </Box>
              </Alert>
              
              <Box 
                p={6} 
                borderWidth={2} 
                borderStyle="dashed" 
                borderRadius="md" 
                textAlign="center"
                borderColor={useColorModeValue('gray.300', 'gray.600')}
                bg={useColorModeValue('gray.50', 'gray.700')}
              >
                <Icon as={FaFileExcel} boxSize={16} color="green.500" mb={4} />
                
                <Text fontSize="lg" fontWeight="medium" mb={4}>
                  Arraste seu arquivo ou clique para selecionar
                </Text>
                
                <HStack justify="center" spacing={4}>
                  <Button 
                    leftIcon={<FaDownload />} 
                    colorScheme="blue" 
                    variant="outline"
                    onClick={handleDownloadTemplate}
                  >
                    Baixar Modelo
                  </Button>
                  
                  <Button 
                    leftIcon={<FaUpload />} 
                    colorScheme="teal"
                    onClick={() => fileInputRef.current.click()}
                  >
                    Selecionar Arquivo
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                  />
                </HStack>
                
                {fileName && (
                  <Text mt={4} color="blue.500">
                    Arquivo selecionado: {fileName}
                  </Text>
                )}
              </Box>
              
              <Box p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                <Text fontWeight="bold" mb={2}>Regras para importação:</Text>
                <List spacing={2}>
                  <ListItem>
                    <ListIcon as={FaCheck} color="green.500" />
                    Todos os campos marcados como obrigatórios devem ser preenchidos
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FaCheck} color="green.500" />
                    Códigos duplicados atualizarão os produtos existentes
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FaCheck} color="green.500" />
                    Os preços devem ser informados com ponto como separador decimal
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FaExclamationTriangle} color="orange.500" />
                    Categorias inexistentes serão ignoradas
                  </ListItem>
                </List>
              </Box>
            </VStack>
          )}
          
          {/* Passo 2: Preview e validação */}
          {step === 2 && (
            <VStack spacing={6} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text>
                  Verifique os dados antes de iniciar a importação. Linhas com erros não serão importadas.
                </Text>
              </Alert>
              
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                    <Tr>
                      <Th>Código</Th>
                      <Th>Nome</Th>
                      <Th isNumeric>Preço</Th>
                      <Th>Status</Th>
                      <Th>Validação</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {previewData.map((item, index) => (
                      <Tr key={index} bg={item.erro ? useColorModeValue('red.50', 'red.900') : undefined}>
                        <Td fontFamily="mono">{item.codigo || '-'}</Td>
                        <Td>{item.nome || '-'}</Td>
                        <Td isNumeric>{item.precoVenda?.toFixed(2) || '-'}</Td>
                        <Td>
                          <Badge colorScheme={item.status ? 'green' : 'red'}>
                            {item.status ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </Td>
                        <Td>
                          {item.erro ? (
                            <HStack color="red.500">
                              <Icon as={FaTimes} />
                              <Text fontSize="sm">{item.erro}</Text>
                            </HStack>
                          ) : (
                            <HStack color="green.500">
                              <Icon as={FaCheck} />
                              <Text fontSize="sm">Válido</Text>
                            </HStack>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
              
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Atenção</Text>
                  <Text fontSize="sm">
                    Esta ação pode atualizar produtos existentes. Verifique se os dados estão corretos antes de prosseguir.
                  </Text>
                </Box>
              </Alert>
            </VStack>
          )}
          
          {/* Passo 3: Processamento e resultados */}
          {step === 3 && (
            <VStack spacing={6} align="stretch">
              <Box p={4} bg={useColorModeValue('green.50', 'green.900')} borderRadius="md">
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Icon as={FaCheck} color="green.500" boxSize={6} />
                    <Text fontWeight="bold" fontSize="lg">Importação Concluída</Text>
                  </HStack>
                  
                  <HStack>
                    <Badge colorScheme="green" p={2} borderRadius="md">
                      {importResults.success} produtos importados
                    </Badge>
                    {importResults.errors > 0 && (
                      <Badge colorScheme="red" p={2} borderRadius="md">
                        {importResults.errors} erros
                      </Badge>
                    )}
                  </HStack>
                </Flex>
              </Box>
              
              <Box borderWidth={1} borderRadius="md" p={4} maxH="300px" overflowY="auto">
                <Text fontWeight="bold" mb={2}>Detalhes da importação:</Text>
                <List spacing={2}>
                  {importResults.messages.map((msg, index) => (
                    <ListItem key={index}>
                      <ListIcon 
                        as={msg.type === 'success' ? FaCheck : FaTimes} 
                        color={msg.type === 'success' ? 'green.500' : 'red.500'} 
                      />
                      {msg.message}
                    </ListItem>
                  ))}
                </List>
              </Box>
              
              {importResults.errors > 0 && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Text>
                    Alguns produtos não puderam ser importados devido a erros. 
                    Corrija os problemas e tente novamente para esses itens.
                  </Text>
                </Alert>
              )}
            </VStack>
          )}

          {/* Barra de progresso (visível apenas durante o processamento) */}
          {isLoading && (
            <Box mt={4}>
              <Text mb={2}>Processando importação... {progress}%</Text>
              <Progress value={progress} colorScheme="teal" size="sm" borderRadius="md" />
            </Box>
          )}
        </ModalBody>

        <ModalFooter>
          {step === 1 && (
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          )}
          
          {step === 2 && (
            <>
              <Button variant="ghost" onClick={() => setStep(1)} mr={3} isDisabled={isLoading}>
                Voltar
              </Button>
              <Button 
                colorScheme="teal" 
                onClick={handleStartImport} 
                isLoading={isLoading}
                loadingText="Importando..."
                leftIcon={<FaUpload />}
              >
                Iniciar Importação
              </Button>
            </>
          )}
          
          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)} mr={3}>
                Nova Importação
              </Button>
              <Button colorScheme="teal" onClick={onClose}>
                Concluir
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
