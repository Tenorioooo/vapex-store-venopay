import { useState } from 'react';
import { Truck, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShippingCalculator() {
  const [cep, setCep] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<{ price: number; days: string } | null>(null);

  // Máscara simples de CEP
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) {
      value = value.slice(0, 5) + '-' + value.slice(5);
    }
    setCep(value);
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (cep.replace(/\D/g, '').length !== 8) return;
    
    setCalculating(true);
    setResult(null);

    // Simula API e retorna algo genérico (Sempre rápido e barato para converter bem)
    setTimeout(() => {
      setResult({
        price: 19.90, // mock fixo
        days: '2 a 4 dias úteis'
      });
      setCalculating(false);
    }, 1200);
  };

  return (
    <div className="mt-6 border-t border-white/5 pt-6">
      <div className="flex items-center gap-2 mb-3">
        <Truck size={18} className="text-cyan-400" />
        <h3 className="text-white font-semibold text-sm">Simular Frete e Prazo</h3>
      </div>
      
      <form onSubmit={handleCalculate} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={cep}
            onChange={handleCepChange}
            placeholder="00000-000"
            className="w-full pl-9 pr-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={calculating || cep.replace(/\D/g, '').length !== 8}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
        >
          {calculating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Calcular'
          )}
        </button>
      </form>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-cyan-400 font-semibold text-sm">Sedex Expresso</p>
                <p className="text-gray-400 text-xs mt-0.5">Chega em {result.days}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">R$ {result.price.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
            <div className="p-3 mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-emerald-400 font-semibold text-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Frete Grátis
                </p>
                <p className="text-gray-400 text-xs mt-0.5">A partir de R$ 300,00</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-sm">R$ 0,00</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
