import React, { useState } from 'react';
import { Package, Search, Truck, MapPin, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TrackOrderPage() {
  const [code, setCode] = useState('');
  const [tracking, setTracking] = useState(false);
  const [result, setResult] = useState<null | 'found' | 'not-found'>(null);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    setTracking(true);
    setResult(null);

    setTimeout(() => {
      setTracking(false);
      // Mock result based on code length or value
      if (code.length > 5) {
        setResult('found');
      } else {
        setResult('not-found');
      }
    }, 1500);
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-[#050505]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Package size={32} className="text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Rastreie seu Pedido</h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Acompanhe a entrega do seu pedido em tempo real. Insira o código de rastreio enviado para o seu e-mail ou WhatsApp.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 md:p-8 rounded-3xl mb-8 shadow-2xl">
          <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Ex: BR123456789VX"
                className="w-full pl-12 pr-4 py-4 bg-[#111] border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={tracking || !code.trim()}
              className="py-4 px-8 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all disabled:opacity-50 flex justify-center items-center gap-2 shrink-0"
            >
              {tracking ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Rastrear
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {result === 'not-found' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center"
          >
            <p className="text-red-400 font-medium">Código de rastreio não encontrado.</p>
            <p className="text-gray-400 text-sm mt-2">Verifique se o código está correto ou tente novamente mais tarde. Pode levar até 24h para o código aparecer no sistema após o envio.</p>
          </motion.div>
        )}

        {result === 'found' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6 mb-6">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Código de Rastreio</p>
                  <p className="text-cyan-400 font-mono font-bold text-lg">{code.toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-sm mb-1">Status Atual</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-bold">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Em Trânsito
                  </div>
                </div>
              </div>

              <div className="relative pl-8 space-y-8">
                {/* Timeline Line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-white/10" />

                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-8 bg-[#0a0a0a] p-1 rounded-full border-2 border-emerald-500 text-emerald-500">
                    <Truck size={16} />
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <h4 className="text-white font-bold mb-1">Objeto em trânsito - por favor aguarde</h4>
                    <p className="text-gray-400 text-sm mb-2">de Unidade de Tratamento, SAO PAULO - SP para Unidade de Distribuição em sua cidade.</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={12} /> Hoje, 08:45</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> São Paulo, SP</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-8 bg-[#0a0a0a] p-1 rounded-full border-2 border-cyan-500 text-cyan-500">
                    <Package size={16} />
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <h4 className="text-white font-bold mb-1">Objeto postado após o horário limite da unidade</h4>
                    <p className="text-gray-400 text-sm mb-2">O objeto será encaminhado na próxima coleta técnica.</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={12} /> Ontem, 18:30</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> São Paulo, SP</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="absolute -left-8 bg-[#0a0a0a] p-1 rounded-full border-2 border-gray-500 text-gray-500">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <h4 className="text-gray-400 font-bold mb-1">Pedido recebido e pagamento aprovado</h4>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1"><Clock size={12} /> Ontem, 14:15</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
