import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function PromoBanner() {
  return (
    <div className="bg-[#050505] px-4 sm:px-6 lg:px-8 pb-12 pt-0">
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
              src="https://chatgpt.com/backend-api/estuary/content?id=file_000000004b8c71fbb1ad98fbb6e7cdb8&ts=494179&p=fs&cid=1&sig=c7f1666f46838ed72e3e1749dc9e94ee018ea698a746b8dbc1bd039894161eae&v=0" 
              alt="Promoção Especial" 
              className="w-full h-auto object-cover"
            />
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
