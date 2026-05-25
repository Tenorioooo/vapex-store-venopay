import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartItem, Product } from '../../types';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  subtotal: number;
  loading: boolean;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addItem: (product: Product, flavor?: string, color?: string, openCart?: boolean) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem('guest_cart');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isCartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('guest_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, flavor?: string, color?: string, openCart: boolean = true) => {
    const existing = items.find(i => i.product_id === product.id && i.flavor === (flavor || null) && i.color === (color || null));
    if (existing) {
      setItems(prev => prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        user_id: '',
        product_id: product.id,
        quantity: 1,
        flavor: flavor || null,
        color: color || null,
        product,
      };
      setItems(prev => [...prev, newItem]);
    }
    if (openCart) setCartOpen(true);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('guest_cart');
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  
  // Preço total sem descontos
  const subtotal = items.reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0);
  
  // Preço total com a promoção Compre 1 Leve 2
  const total = items.reduce((sum, i) => {
    const price = i.product?.price ?? 0;
    const isPromo = i.product?.category_id === 'pods-descartaveis' || i.product?.category_id === 'pods-recarregaveis';
    
    if (isPromo) {
      // Promoção Compre 1 Leve 2: Para cada 2 itens, paga apenas 1
      const paidQuantity = Math.ceil(i.quantity / 2);
      return sum + (price * paidQuantity);
    }
    
    return sum + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, total, subtotal, loading: false, isCartOpen, setCartOpen, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

