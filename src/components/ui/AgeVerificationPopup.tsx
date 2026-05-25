import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import Logo from './Logo';

export default function AgeVerificationPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('age_verified');
    if (!verified) {
      setIsOpen(true);
      // Impede scroll enquanto o modal estiver aberto
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem('age_verified', 'true');
    setIsOpen(false);
    document.body.style.overflow = 'auto';
  };

  const handleReject = () => {
    // Redireciona para o Google ou outra página se não tiver 18 anos
    window.location.href = 'https://www.google.com';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 text-center shadow-2xl overflow-hidden"
          >
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-cyan-500/10 blur-3xl rounded-full" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              
              <div className="flex justify-center items-center gap-2 mb-4">
                <Logo className="w-6 h-6" />
                <span className="text-white font-bold text-lg tracking-tight">VAPE<span className="text-cyan-400">X</span></span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-4">Verificação de Idade</h2>
              <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                A venda de produtos deste site é estritamente proibida para menores de 18 anos. 
                Ao entrar, você confirma que tem idade legal para comprar produtos de tabacaria/vape na sua região.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleConfirm}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-cyan-500/25"
                >
                  SIM, TENHO MAIS DE 18 ANOS
                </button>
                <button
                  onClick={handleReject}
                  className="w-full py-4 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-xl hover:bg-white/10 hover:text-white transition-all"
                >
                  NÃO, TENHO MENOS DE 18 ANOS
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
