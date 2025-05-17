'use client';

import { useEffect, useState } from 'react';
import { ChakraProvider, extendTheme, Theme } from '@chakra-ui/react';
import { useTenant } from '@/hooks/useTenant';

interface DeliveryThemeProviderProps {
  children: React.ReactNode;
  slug: string;
}

export function DeliveryThemeProvider({ children, slug }: DeliveryThemeProviderProps) {
  const [tenant, setTenant] = useState<any>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar informações do tenant quando o componente carregar
  useEffect(() => {
    const fetchTenantInfo = async () => {
      try {
        const response = await fetch(`/api/delivery/tenant`);
        if (response.ok) {
          const data = await response.json();
          setTenant(data.tenant);
          
          // Criar tema personalizado baseado nas cores do tenant
          const customTheme = extendTheme({
            colors: {
              brand: {
                primary: data.tenant.corPrimaria || '#38B2AC',
                secondary: data.tenant.corSecundaria || '#319795',
              },
            },
            components: {
              Button: {
                baseStyle: {
                  fontWeight: 'bold',
                },
                variants: {
                  solid: {
                    bg: data.tenant.corPrimaria || '#38B2AC',
                    color: 'white',
                    _hover: {
                      bg: data.tenant.corPrimaria || '#38B2AC',
                      opacity: 0.85,
                      transform: 'translateY(-1px)'
                    },
                    _active: {
                      bg: data.tenant.corPrimaria || '#38B2AC',
                      opacity: 0.95,
                      transform: 'translateY(0)'
                    },
                    _focus: {
                      boxShadow: `0 0 0 3px ${data.tenant.corPrimaria}40` // Adiciona a cor primária com 25% de opacidade
                    }
                  },
                  outline: {
                    borderColor: data.tenant.corPrimaria || '#38B2AC',
                    color: data.tenant.corPrimaria || '#38B2AC',
                    _hover: {
                      bg: `${data.tenant.corPrimaria}10` // Adiciona a cor primária com 10% de opacidade
                    },
                    _active: {
                      bg: `${data.tenant.corPrimaria}20` // Adiciona a cor primária com 20% de opacidade
                    },
                    _focus: {
                      boxShadow: `0 0 0 3px ${data.tenant.corPrimaria}40` // Adiciona a cor primária com 25% de opacidade
                    }
                  },
                  ghost: {
                    color: data.tenant.corPrimaria || '#38B2AC',
                    _hover: {
                      bg: `${data.tenant.corPrimaria}10` // Adiciona a cor primária com 10% de opacidade
                    }
                  }
                },
              },
              IconButton: {
                baseStyle: {
                  _focus: {
                    boxShadow: `0 0 0 3px ${data.tenant.corPrimaria}40` // Adiciona a cor primária com 25% de opacidade
                  }
                },
                variants: {
                  ghost: {
                    _hover: {
                      bg: `${data.tenant.corPrimaria}15` // Adiciona a cor primária com 15% de opacidade
                    }
                  }
                }
              },
              Tabs: {
                variants: {
                  enclosed: {
                    tab: {
                      _selected: {
                        color: data.tenant.corPrimaria || '#38B2AC',
                      },
                      _hover: {
                        color: data.tenant.corPrimaria || '#38B2AC',
                        opacity: 0.8
                      }
                    },
                  },
                },
              },
              Badge: {
                baseStyle: {
                  borderRadius: 'full',
                  fontWeight: 'semibold'
                }
              },
              Heading: {
                baseStyle: {
                  fontWeight: '600'
                }
              }
            },
          });
          
          setTheme(customTheme as any);
        }
      } catch (error) {
        console.error('Erro ao carregar informações do tenant:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (slug) {
      fetchTenantInfo();
    }
  }, [slug]);

  // Enquanto carrega, usar um tema padrão
  if (loading || !theme) {
    const defaultTheme = extendTheme({
      colors: {
        brand: {
          primary: '#38B2AC',
          secondary: '#319795',
        },
      },
    });
    
    return <ChakraProvider theme={defaultTheme}>{children}</ChakraProvider>;
  }

  return <ChakraProvider theme={theme}>{children}</ChakraProvider>;
}
