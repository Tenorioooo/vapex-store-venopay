import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

export default function TopCountdownBanner() {
  const [timeLeft, setTimeLeft] = useState({ hours: 24, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      // Target: midnight of the next day
      const target = new Date();
      target.setHours(24, 0, 0, 0);

      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        return { hours: 24, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      return { hours, minutes, seconds };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-red-600 to-orange-600 text-white h-[40px] px-4 shadow-lg shadow-red-500/20 flex items-center">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-center gap-3 text-sm font-bold tracking-wider">
        <Timer size={16} className="animate-pulse" />
        <span className="hidden sm:inline">PROMOÇÃO EXCLUSIVA:</span>
        <span className="text-cyan-100">OFERTA TERMINA EM:</span>
        <div className="flex items-center gap-1 font-mono bg-black/20 px-2 py-0.5 rounded border border-white/10">
          <span>{formatNumber(timeLeft.hours)}</span>
          <span className="animate-pulse">:</span>
          <span>{formatNumber(timeLeft.minutes)}</span>
          <span className="animate-pulse">:</span>
          <span>{formatNumber(timeLeft.seconds)}</span>
        </div>
        <span className="hidden lg:inline bg-white/20 px-2 py-0.5 rounded text-[10px] animate-bounce">
          COMPRE 1 E LEVE 2
        </span>
      </div>
    </div>
  );
}
