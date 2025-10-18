"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CartContextType {
  cartItemsCount: number;
  setCartItemsCount: (count: number) => void;
  incrementCartCount: () => void;
  decrementCartCount: () => void;
  refreshCartCount: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItemsCount, setCartItemsCount] = useState(0);

  const refreshCartCount = async () => {
    try {
      const response = await fetch('/api/cart', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        const count = data.cartItems?.length || 0;
        setCartItemsCount(count);
      }
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
    }
  };

  const incrementCartCount = () => {
    setCartItemsCount(prev => prev + 1);
  };

  const decrementCartCount = () => {
    setCartItemsCount(prev => Math.max(0, prev - 1));
  };

  useEffect(() => {
    refreshCartCount();
  }, []);

  const value = {
    cartItemsCount,
    setCartItemsCount,
    incrementCartCount,
    decrementCartCount,
    refreshCartCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};