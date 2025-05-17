'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  HStack,
  useColorModeValue,
  Skeleton,
  VStack,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerCloseButton,
  Button,
  Badge,
  useDisclosure
} from '@chakra-ui/react';
import { FaShoppingCart, FaTruck } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { DeliveryHeader } from '@/components/delivery/DeliveryHeader';
import { ProductCard } from '@/components/delivery/ProductCard';
import { CartItem } from '@/components/delivery/CartItem';
import { EmptyState } from '@/components/delivery/EmptyState';
import { useCart } from '@/hooks/useCart';
import { StatusFuncionamento } from '@/components/delivery/StatusFuncionamento';
import { MobileFooter } from '@/components/delivery/MobileFooter';

export default function DeliveryPage() {
  const router = useRouter();
  const [tenant, setTenant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal
  } = useCart();

  // Estado para acompanhar a categoria ativa
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  
  // Criar refs para as seções de categorias
  const sectionRefs = useRef<{[key: number]: HTMLDivElement}>({});
  const categoryBarRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const categoryBgColor = useColorModeValue('white', 'gray.800');
  const activeCategoryBgColor = useColorModeValue('gray.50', 'gray.700');

  // Fetch tenant info and menu data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tenant info
        const tenantResponse = await fetch(`/api/delivery/tenant`);
        const tenantData = await tenantResponse.json();
        console.log('Tenant data:', tenantData);
        setTenant(tenantData.tenant);

        // With tenant ID, fetch categories
        // Categorias já virão ordenadas pela API de acordo com o campo ordemExibicao
        const categoriesResponse = await fetch(`/api/delivery/categories?tenantId=${tenantData.tenant.id}`);
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories);

        // Fetch products
        const productsResponse = await fetch(`/api/delivery/products?tenantId=${tenantData.tenant.id}`);
        const productsData = await productsResponse.json();
        setProducts(productsData.products);
      } catch (error) {
        console.error('Error loading delivery data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar e preparar categorias principais com produtos
  const mainCategoriesWithProducts = categories
    .filter(category => category.isMainCategory)
    .filter(category => {
      // Verificar se a categoria tem produtos diretos
      const hasDiretos = products.some(product =>
        product.categorias.some(cat => cat.categoriaId === category.id)
      );

      // Verificar se alguma subcategoria tem produtos
      const subCategories = categories.filter(
        sub => !sub.isMainCategory && sub.parentId === category.id
      );

      const hasSubProducts = subCategories.some(sub =>
        products.some(product =>
          product.categorias.some(cat => cat.categoriaId === sub.id)
        )
      );

      // Mostrar categoria apenas se tem produtos diretos ou em subcategorias
      return hasDiretos || hasSubProducts;
    });

  // Configurar Intersection Observer para detectar quando uma seção está visível
  useEffect(() => {
    // Esperar até que as referências sejam configuradas
    if (loading || Object.keys(sectionRefs.current).length === 0) return;

    // Limpar observador anterior se existir
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Variável para limitar a frequência de atualização
    let lastUpdateTime = 0;
    const updateThrottleMs = 100; // Intervalo mínimo entre atualizações

    const observerOptions = {
      root: null, // viewport
      // Ajuste da rootMargin para melhorar detecção e estabilidade
      rootMargin: '-120px 0px -65% 0px',
      threshold: [0.05, 0.2] // Simplificar thresholds para mais estabilidade
    };

    // Callback do observer
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // Verificar se é muito cedo para outra atualização
      const now = Date.now();
      if (now - lastUpdateTime < updateThrottleMs) return;

      // Encontrar as entradas que estão visíveis na viewport
      const visibleEntries = entries.filter(entry => entry.isIntersecting);
      
      if (visibleEntries.length > 0) {
        // Ordenar por posição e visibilidade
        const sortedEntries = visibleEntries.sort((a, b) => {
          // Priorizar elementos com maior área visível
          if (Math.abs(b.intersectionRatio - a.intersectionRatio) > 0.1) {
            return b.intersectionRatio - a.intersectionRatio;
          }
          
          // Se a visibilidade for similar, priorizar o que está mais próximo ao topo
          const rectA = a.boundingClientRect;
          const rectB = b.boundingClientRect;
          return Math.abs(rectA.top - 120) - Math.abs(rectB.top - 120);
        });

        // Pegar a primeira categoria mais visível
        const categoryId = parseInt(sortedEntries[0].target.id.replace('category-section-', ''));
        
        // Atualizar apenas se a categoria for diferente da atual
        if (activeCategory !== categoryId) {
          setActiveCategory(categoryId);
          lastUpdateTime = now;
          
          // Rolar a barra de categorias para manter a categoria ativa visível
          if (categoryBarRef.current) {
            const activeCategoryElement = categoryBarRef.current.querySelector(`[data-category-id="${categoryId}"]`);
            if (activeCategoryElement) {
              categoryBarRef.current.scrollTo({
                left: (activeCategoryElement as HTMLElement).offsetLeft - 40,
                behavior: 'smooth'
              });
            }
          }
        }
      }
    };

    // Criar e configurar o observer
    observerRef.current = new IntersectionObserver(observerCallback, observerOptions);
    
    // Observar todas as seções de categoria
    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) observerRef.current?.observe(ref);
    });

    // Adicionar um debounce para a rolagem para evitar atualizações frequentes demais
    let scrollTimeout: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = setTimeout(() => {
        // Verificar se é muito cedo para outra atualização
        const now = Date.now();
        if (now - lastUpdateTime < updateThrottleMs) return;

        const entries = observerRef.current?.takeRecords();
        if (entries && entries.length) {
          observerCallback(entries);
        }
      }, 50); // debounce de 50ms
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, products, categories, activeCategory]);

  // Inicializar a primeira categoria como ativa quando os dados são carregados
  useEffect(() => {
    if (!loading && mainCategoriesWithProducts.length > 0 && activeCategory === null) {
      setActiveCategory(mainCategoriesWithProducts[0].id);
    }
  }, [loading, mainCategoriesWithProducts, activeCategory]);

  // Função para rolar até a seção da categoria selecionada
  const scrollToCategory = useCallback((categoryId: number) => {
    setActiveCategory(categoryId);
    const sectionRef = sectionRefs.current[categoryId];
    
    if (sectionRef) {
      // Ajustar o offset considerando o cabeçalho fixo e a barra de categorias
      const headerOffset = 110; 
      const elementPosition = sectionRef.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <DeliveryHeader
        tenant={tenant}
        loading={loading}
        cartItemsCount={cart.length}
        onCartClick={onOpen}
        slug={tenant?.slug}
      />

      <Container maxW="container.xl" py={8} pt="110px" mt={0}>
        {loading ? (
          <VStack spacing={6} align="stretch">
            <Skeleton height="60px" width="200px" />
            <Skeleton height="40px" />
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} height="200px" />
              ))}
            </SimpleGrid>
          </VStack>
        ) : (
          <>
            <Heading mb={4} size="xl" color={tenant?.corPrimaria || 'teal.500'}>
              Cardápio Online
            </Heading>

            {tenant && <StatusFuncionamento tenantId={tenant.id} />}

            {/* Barra de categorias fixa */}
            <Box 
              position="sticky" 
              top="80px" 
              zIndex={90}
              bg={bgColor}
              py={2} 
              px={0}
              mt={4}
              mb={2}
              borderBottomWidth="1px"
              borderColor={borderColor}
              shadow="sm"
              borderRadius="md"
            >
              <HStack 
                spacing={2} 
                overflowX="auto"
                ref={categoryBarRef}
                css={{
                  scrollbarWidth: 'thin',
                  '&::-webkit-scrollbar': { height: '4px' },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: '#CBD5E0', borderRadius: '4px' },
                  padding: '0 8px',
                  scrollBehavior: 'smooth'
                }}
                px={2}
              >
                {mainCategoriesWithProducts.map(category => (
                  <Box 
                    key={category.id}
                    as="button"
                    py={2}
                    px={4}
                    borderRadius="md"
                    bg={activeCategory === category.id ? activeCategoryBgColor : categoryBgColor}
                    fontWeight={activeCategory === category.id ? "bold" : "normal"}
                    color={activeCategory === category.id ? tenant?.corPrimaria || 'teal.500' : 'inherit'}
                    borderBottomWidth="2px"
                    borderColor={activeCategory === category.id ? (tenant?.corPrimaria || 'teal.500') : 'transparent'}
                    position="relative"
                    _after={{
                      content: '""',
                      position: 'absolute',
                      bottom: '-2px',
                      left: '4px',
                      right: '4px',
                      height: '2px',
                      bg: activeCategory === category.id ? (tenant?.corPrimaria || 'teal.500') : 'transparent',
                      transition: 'all 0.3s ease'
                    }}
                    transition="all 0.3s ease, background 0.3s ease, color 0.3s ease, font-weight 0.3s ease"
                    whiteSpace="nowrap"
                    onClick={() => scrollToCategory(category.id)}
                    data-category-id={category.id}
                    _hover={{
                      bg: activeCategoryBgColor,
                      color: tenant?.corPrimaria || 'teal.500'
                    }}
                  >
                    {category.nome}
                  </Box>
                ))}
              </HStack>
            </Box>

            {/* Conteúdo das categorias */}
            <Box>
              {mainCategoriesWithProducts.map(mainCategory => {
                // Encontrar as subcategorias para esta categoria principal
                const subCategories = categories.filter(
                  category => !category.isMainCategory && category.parentId === mainCategory.id
                );

                // Encontrar produtos para a categoria principal
                const mainCategoryProducts = products.filter(product =>
                  product.categorias.some(cat => cat.categoriaId === mainCategory.id)
                );

                return (
                  <Box 
                    key={mainCategory.id} 
                    id={`category-section-${mainCategory.id}`}
                    ref={el => {
                      if (el) sectionRefs.current[mainCategory.id] = el;
                    }}
                    mb={10}
                    pt={2}
                    pb={4} // Adiciona um padding inferior para melhor detecção
                    px={1} // Adiciona um pequeno padding lateral
                  >
                    <Heading size="md" mb={4}>{mainCategory.nome}</Heading>

                    {/* Primeiro mostrar os produtos da categoria principal */}
                    {mainCategoryProducts.length > 0 && (
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={8}>
                        {mainCategoryProducts.map(product => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={addToCart}
                            tenantPrimaryColor={tenant?.corPrimaria}
                          />
                        ))}
                      </SimpleGrid>
                    )}

                    {/* Depois mostrar as subcategorias */}
                    {subCategories.map(subCategory => {
                      // Encontrar produtos para esta subcategoria
                      const subCategoryProducts = products.filter(product =>
                        product.categorias.some(cat => cat.categoriaId === subCategory.id)
                      );

                      if (subCategoryProducts.length === 0) return null;

                      return (
                        <Box key={subCategory.id} mb={8}>
                          <Heading
                            size="sm"
                            mb={4}
                            pl={4}
                            borderLeftWidth="4px"
                            borderLeftColor={tenant?.corPrimaria || 'teal.500'}
                          >
                            {subCategory.nome}
                          </Heading>

                          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            {subCategoryProducts.map(product => (
                              <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={addToCart}
                                tenantPrimaryColor={tenant?.corPrimaria}
                              />
                            ))}
                          </SimpleGrid>
                        </Box>
                      );
                    })}

                    {/* Mostrar empty state se não houver produtos nem em categoria principal nem subcategorias */}
                    {mainCategoryProducts.length === 0 && subCategories.every(
                      sub => products.filter(product =>
                        product.categorias.some(cat => cat.categoriaId === sub.id)
                      ).length === 0
                    ) && (
                        <EmptyState
                          message={`Nenhum produto disponível em ${mainCategory.nome}`}
                          icon={FaTruck}
                        />
                      )}
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </Container>

      {/* Shopping Cart Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <Flex align="center">
              <FaShoppingCart />
              <Text ml={2}>Seu Carrinho</Text>
              <Badge ml={2} colorScheme="teal" borderRadius="full" px={2}>
                {cart.length} {cart.length === 1 ? 'item' : 'itens'}
              </Badge>
            </Flex>
          </DrawerHeader>

          <DrawerBody>
            {cart.length > 0 ? (
              <VStack spacing={4} align="stretch" divider={<Box borderColor={borderColor} borderBottomWidth="1px" />}>
                {cart.map(item => (
                  <CartItem
                    key={`${item.id}-${item.options ? JSON.stringify(item.options) : 'noopt'}`}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                  />
                ))}
              </VStack>
            ) : (
              <EmptyState
                message="Seu carrinho está vazio"
                icon={FaShoppingCart}
                action={
                  <Button colorScheme="teal" onClick={onClose}>
                    Ver Cardápio
                  </Button>
                }
              />
            )}
          </DrawerBody>

          {cart.length > 0 && (
            <DrawerFooter borderTopWidth="1px" flexDirection="column">
              <Flex justify="space-between" w="full" mb={4}>
                <Text fontWeight="bold">Total:</Text>
                <Text fontWeight="bold" fontSize="xl">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(cartTotal)}
                </Text>
              </Flex>

              <Button
                w="full"
                colorScheme="teal"
                size="lg"
                mb={2}
                onClick={() => {
                  onClose(); // Close the drawer first
                  router.push(`/loja/checkout`); // Navigate to checkout
                }}
              >
                Finalizar Pedido
              </Button>

              <Button
                w="full"
                variant="outline"
                colorScheme="red"
                onClick={clearCart}
              >
                Limpar Carrinho
              </Button>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>

      {/* Footer móvel com botão "Meus Pedidos" e "Meu Carrinho" */}
      <MobileFooter tenant={tenant} onCartClick={onOpen} />
    </Box>
  );
}
