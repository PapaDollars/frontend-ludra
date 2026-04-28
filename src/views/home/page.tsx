'use client';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import HeroSection from '@/views/home/components/HeroSection';
import FeaturedProperties from '@/views/home/components/FeaturedProperties';
import PropertyTypes from '@/views/home/components/PropertyTypes';
import WhyLudra from '@/views/home/components/WhyLudra';
import HowItWorks from '@/views/home/components/HowItWorks';
import CTA from '@/views/home/components/CTA';

const HomePage = memo(() => {
  const { ready } = useTranslation();
  const handleSearch = (_searchQuery: unknown) => {
    // La recherche sera implementée ici
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-tertiary-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-tertiary-100">
      <HeroSection onSearch={handleSearch} />
      <main>
        <FeaturedProperties />
        <PropertyTypes />
        <WhyLudra />
        <HowItWorks />
        <CTA />
      </main>
    </div>
  );
});

HomePage.displayName = 'HomePage';
export default HomePage;