import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from './CartContext';
import { Link, useNavigate } from 'react-router-dom';
import ProductImage from '../ui/ProductImage';

export default function CartDrawer() {
  const { isCartOpen, setCartOpen, items, total, subtotal, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setCartOpen(false);
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-cyan-400" size={24} />
                <h2 className="text-xl font-bold text-white">Carrinho</h2>
                <span className="px-2 py-0.5 bg-white/5 rounded-md text-xs text-gray-400">
                  {items.reduce((sum, i) => sum + i.quantity, 0)} itens
                </span>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <ShoppingBag size={32} className="text-gray-600" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Seu carrinho está vazio</h3>
                  <p className="text-gray-500 text-sm mb-8">Parece que você ainda não adicionou nenhum produto.</p>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-sm font-bold transition-all"
                  >
                    Começar a Comprar
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
                      <ProductImage src={item.product?.image_url || null} alt={item.product?.name || ''} brand={item.product?.brand} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2 mb-1">
                        <h4 className="text-white font-medium text-sm truncate">{item.product?.name}</h4>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="text-[10px] text-gray-500 mb-2">
                        {item.flavor && <span>{item.flavor}</span>}
                        {item.flavor && item.color && <span className="mx-1">•</span>}
                        {item.color && <span>{item.color}</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center text-white text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-white font-bold text-sm">
                          R$ {((item.product?.price ?? 0) * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 bg-[#0d0d0d] border-t border-white/5 space-y-4">
                {subtotal > total && (
                  <div className="space-y-2 mb-3 pb-3 border-b border-white/5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Subtotal</span>
                      <span className="text-gray-400">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-cyan-400 font-medium">Promoção Compre 1 Leve 2</span>
                      <span className="text-cyan-400 font-bold">-R$ {(subtotal - total).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total com desconto</span>
                  <span className="text-2xl font-bold text-white">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <p className="text-[10px] text-gray-500 text-center">
                  Frete e impostos calculados no checkout
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/carrinho"
                    onClick={() => setCartOpen(false)}
                    className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all"
                  >
                    Ver Carrinho
                  </Link>
                  <button
                    onClick={handleCheckout}
                    className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-cyan-500/25"
                  >
                    Finalizar Compra <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
