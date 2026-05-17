import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Gift, ArrowRight } from 'lucide-react';

export default function PromoBanner() {
  return (
    <div className="bg-[#050505] px-4 sm:px-6 lg:px-8 pb-12 pt-0">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-700 p-8 sm:p-12 shadow-2xl shadow-cyan-500/20"
        >
          {/* Background Elements */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold mb-4 uppercase tracking-wider">
                <Gift size={14} /> Oferta Especial
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                Compre 1, <span className="text-cyan-200">Leve 2!</span>
              </h2>
              <p className="text-blue-100 text-lg max-w-lg mb-0">
                Aproveite nossa promoção exclusiva. Adicione 2 Pods no carrinho e pague apenas por 1. Validade por tempo limitado!
              </p>
            </div>
            
            <div className="flex-shrink-0">
              <Link 
                to="/produtos"
                className="group flex items-center justify-center gap-3 px-8 py-4 bg-white text-blue-900 font-bold text-lg rounded-2xl hover:bg-cyan-50 transition-all shadow-xl hover:shadow-white/25 hover:-translate-y-1"
              >
                Aproveitar Agora
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
