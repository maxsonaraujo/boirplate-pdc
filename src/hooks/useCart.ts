import { useState, useEffect } from 'react';

export function useCart() {
  // Inicializar o estado do carrinho a partir do localStorage (se disponível)
  const [cart, setCart] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('degusflow_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });
  
  // Salvar o carrinho no localStorage quando ele mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('degusflow_cart', JSON.stringify(cart));
    }
  }, [cart]);
  
  // Adicionar um item ao carrinho
  const addToCart = (product: any, quantity: number, options?: any, observation?: string) => {
    setCart(prevCart => {
      // Verificar se o item já existe no carrinho com as mesmas opções
      const existingItemIndex = prevCart.findIndex(item => {
        if (item.id !== product.id) return false;
        
        // Para produtos simples sem opções
        if (!options && !item.options) return true;
        
        // Para produtos com opções, comparar as opções selecionadas
        if (!options || !item.options) return false;
        
        return JSON.stringify(options) === JSON.stringify(item.options) && 
               item.observation === observation;
      });
      
      if (existingItemIndex !== -1) {
        // Atualizar a quantidade se o item já existir
        return prevCart.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Adicionar novo item ao carrinho
        return [...prevCart, { 
          ...product, 
          quantity, 
          options,
          observation,
          cartItemId: Date.now() // ID único para identificar o item no carrinho
        }];
      }
    });
  };
  
  // Remover um item do carrinho
  const removeFromCart = (productId: number, options?: any) => {
    setCart(prevCart => 
      prevCart.filter(item => {
        // Para produtos simples sem opções
        if (!options && !item.options) return item.id !== productId;
        
        // Para produtos com opções, comparar o ID e as opções
        if (item.id !== productId) return true;
        
        return JSON.stringify(options) !== JSON.stringify(item.options);
      })
    );
  };
  
  // Atualizar a quantidade de um item
  const updateQuantity = (productId: number, quantity: number, options?: any) => {
    if (quantity < 1) return; // Não permitir quantidades menores que 1
    
    setCart(prevCart => 
      prevCart.map(item => {
        // Para produtos simples sem opções
        if (item.id === productId && (!options || !item.options || JSON.stringify(options) === JSON.stringify(item.options))) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };
  
  // Limpar o carrinho
  const clearCart = () => {
    setCart([]);
  };
  
  // Calcular o valor total do carrinho
  const calculateTotal = () => {
    return cart.reduce(
      (total, item) => total + (item.precoFinal || item.precoVenda) * item.quantity, 
      0
    );
  };
  
  // Total do carrinho (para compatibilidade)
  const cartTotal = calculateTotal();
  
  // Calcular a quantidade total de itens no carrinho
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);
  
  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartItemCount,
    calculateTotal,
  };
}
