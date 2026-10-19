'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Marquer que nous sommes côté client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollTop > 300);
    };

    // Écouter le scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Nettoyer
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isClient]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Ne render que côté client ET quand visible
  if (!isClient || !isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="print:hidden fixed bottom-24 md:bottom-6 right-4 md:right-6 z-30 w-11 h-11 bg-brand hover:bg-brand-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-200"
      aria-label="Remonter en haut de la page"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
};

export default BackToTop;