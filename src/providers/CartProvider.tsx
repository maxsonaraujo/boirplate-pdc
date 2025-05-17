'use client';

import React, { createContext, useContext } from 'react';
import { useCart as useCartHook } from '@/hooks/useCart';

// Definir o tipo do contexto
type CartContextType = ReturnType<typeof useCartHook>;

// Criar o contexto com valor padrão
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider do contexto
export function CartProvider({ children }: { children: React.ReactNode }) {
  const cartUtils = useCartHook();
  
  return (
    <CartContext.Provider value={cartUtils}>
      {children}
    </CartContext.Provider>
  );
}

// Hook personalizado para acessar o contexto
export function useCart() {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  
  return context;
}
