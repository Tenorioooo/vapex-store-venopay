import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function PromoBanner() {
  return (
    <div className="bg-[#050505] px-4 sm:px-6 lg:px-8 pb-12 pt-32 sm:pt-36">
      <div className="max-w-7xl mx-auto">
        <Link to="/produtos" className="block">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-3xl shadow-2xl shadow-cyan-500/10 w-full"
          >
            <img 
              src="/banner.png" 
              alt="Promoção Especial" 
              className="w-full h-auto object-cover"
            />
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
