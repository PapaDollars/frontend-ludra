'use client';

import Link from 'next/link';
import { Home, MapPin, Users, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/common/ui/Card';
import { Button } from '@/components/common/ui/Button';
import URL from '@/utilis/url/url_front';

const stats = [
  { number: '4 000+', label: 'Logements listés' },
  { number: '8', label: 'Villes couvertes' },
  { number: '3', label: 'Types de comptes' },
  { number: '24/7', label: 'Support disponible' },
];

const features = [
  'Recherche par ville, type, budget et surface',
  'Annonces vérifiées par notre équipe',
  'Contact direct avec le propriétaire',
  'Planification de visites intégrée',
  'Sauvegarde des favoris',
  'Interface en français et en anglais',
];

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">À propos de Ludra</h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Ludra est une plateforme camerounaise de recherche de logement.
            Elle connecte locataires et propriétaires dans les principales villes du pays,
            de manière simple, rapide et fiable.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((s, i) => (
            <Card key={i} className="p-5 text-center bg-white border border-gray-100">
              <p className="text-3xl font-bold text-primary">{s.number}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Qui peut utiliser Ludra */}
        <Card className="p-8 bg-white border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">Pour qui ?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { role: 'Visiteurs', desc: 'Parcourez les annonces librement, sans compte.' },
              { role: 'Locataires', desc: 'Créez un compte pour contacter les propriétaires et gérer vos favoris.' },
              { role: 'Propriétaires', desc: 'Publiez vos biens, gérez les statuts et suivez vos statistiques.' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900 mb-1">{item.role}</p>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Fonctionnalités */}
        <Card className="p-8 bg-white border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">Ce que propose la plateforme</h2>
          </div>
          <ul className="space-y-3">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-700">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Villes */}
        <Card className="p-8 bg-white border border-gray-100 mb-10">
          <div className="flex items-center gap-3 mb-5">
            <MapPin className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">Villes disponibles</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Ngaoundéré', 'Limbé', 'Kribi', 'Bamenda'].map((city) => (
              <span key={city} className="bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full">
                {city}
              </span>
            ))}
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Link href={URL.public.properties}>
            <Button size="lg" className="bg-primary hover:bg-primary-700">
              Explorer les logements
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
