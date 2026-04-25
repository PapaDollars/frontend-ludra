'use client';

import { memo } from 'react';
import { Shield, Search, MapPin, Phone, Star, Zap } from 'lucide-react';
import { Card } from '@/components/common/ui/Card';

const advantages = [
  {
    icon: Shield,
    title: 'Annonces vérifiées',
    description: 'Chaque propriété est contrôlée avant publication. Fini les arnaques et les fausses annonces.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Search,
    title: 'Recherche avancée',
    description: 'Filtrez par ville, type, budget, chambres. Trouvez exactement ce que vous cherchez.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: Phone,
    title: 'Contact direct',
    description: 'Connectez-vous directement avec le propriétaire. Planifiez vos visites depuis la plateforme.',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: MapPin,
    title: '8 villes couvertes',
    description: 'Douala, Yaoundé, Bafoussam, Garoua et bien d\'autres — partout au Cameroun.',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    icon: Star,
    title: 'Gratuit pour les locataires',
    description: 'Aucun frais pour chercher et contacter un propriétaire. Créez votre compte en 1 minute.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
  },
  {
    icon: Zap,
    title: 'Rapide et simple',
    description: 'Interface intuitive, disponible en français et en anglais, sur mobile et desktop.',
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
];

const WhyLudra = memo(() => {
  return (
    <section className="py-20 bg-white px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Pourquoi choisir{' '}
            <span className="text-primary">Ludra</span> ?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            La plateforme pensée pour simplifier la recherche de logement au Cameroun.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advantages.map((adv, i) => (
            <Card
              key={i}
              className="p-7 border border-gray-100 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group"
            >
              <div className={`${adv.bg} w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <adv.icon className={`h-7 w-7 ${adv.color}`} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{adv.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">{adv.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
});

WhyLudra.displayName = 'WhyLudra';
export default WhyLudra;
