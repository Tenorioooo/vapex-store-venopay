import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import { MOCK_PRODUCTS } from '../../data/MOCK_PRODUCTS';

const NAMES = ['Ana', 'João', 'Lucas', 'Mariana', 'Pedro', 'Beatriz', 'Gabriel', 'Fernanda', 'Rafael', 'Camila', 'Rodrigo', 'Juliana', 'Thiago', 'Amanda', 'Marcos'];
const CITIES = ['São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Curitiba, PR', 'Porto Alegre, RS', 'Brasília, DF', 'Salvador, BA', 'Fortaleza, CE', 'Recife, PE', 'Goiânia, GO', 'Campinas, SP', 'Florianópolis, SC', 'Vitória, ES'];
const TIMES = ['Agora mesmo', 'Há 2 minutos', 'Há 5 minutos', 'Há 12 minutos', 'Há 1 hora', 'Há 3 horas'];

interface SaleEvent {
  name: string;
  city: string;
  productName: string;
  productImage: string;
  time: string;
}

export default function SalesPopup() {
  const [currentSale, setCurrentSale] = useState<SaleEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Função para gerar uma venda aleatória
    const generateRandomSale = () => {
      const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
      const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
      const randomTime = TIMES[Math.floor(Math.random() * TIMES.length)];
      
      // Pega um produto aleatório (idealmente que tem imagem)
      const validProducts = MOCK_PRODUCTS.filter(p => p.image_url);
      const randomProduct = validProducts[Math.floor(Math.random() * validProducts.length)];

      setCurrentSale({
        name: randomName,
        city: randomCity,
        productName: randomProduct.name,
        productImage: randomProduct.image_url,
        time: randomTime
      });
      setIsVisible(true);

      // Esconde depois de 6 segundos
      setTimeout(() => {
        setIsVisible(false);
      }, 6000);
    };

    // Primeira exibição após 10 segundos
    const initialTimer = setTimeout(() => {
      generateRandomSale();
    }, 10000);

    // Repete a cada 25-45 segundos
    const interval = setInterval(() => {
      const nextDelay = Math.floor(Math.random() * (45000 - 25000 + 1) + 25000);
      setTimeout(() => {
        if (!document.hidden) {
          generateRandomSale();
        }
      }, nextDelay);
    }, 35000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && currentSale && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: -20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 max-w-[320px] bg-[#0a0a0a]/95 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl flex gap-3 items-center group"
        >
          {/* Close button that appears on hover */}
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-[#111] border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
          >
            <X size={12} className="text-gray-400" />
          </button>

          <div className="w-14 h-14 rounded-xl bg-white/5 overflow-hidden shrink-0 border border-white/5 flex items-center justify-center p-1 relative">
            <img 
              src={currentSale.productImage} 
              alt={currentSale.productName} 
              className="w-full h-full object-contain drop-shadow-lg"
            />
            {/* Pulsing indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0a0a] z-10" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping z-0 opacity-75" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <span className="font-semibold text-white">{currentSale.name}</span>
              <span>de</span>
              <span className="font-medium text-cyan-400 truncate">{currentSale.city}</span>
            </div>
            <p className="text-sm text-gray-300 font-medium leading-tight mb-1 line-clamp-1">
              Comprou {currentSale.productName}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <ShoppingBag size={10} />
              <span>{currentSale.time}</span>
              <span className="mx-1">•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400" /> Compra Verificada
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
