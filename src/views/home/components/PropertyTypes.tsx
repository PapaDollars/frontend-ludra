'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Building2, Home, BedDouble, Layers, Square } from 'lucide-react';
import URL from '@/utilis/url/url_front';

const types = [
  {
    icon: BedDouble,
    label: 'Chambre',
    value: 'room',
    desc: 'Chambre meublée ou non meublée',
    color: 'from-orange-500 to-orange-700',
  },
  {
    icon: Square,
    label: 'Studio',
    value: 'studio',
    desc: 'Compact et idéal pour étudiant ou solo',
    color: 'from-purple-500 to-purple-700',
  },
  {
    icon: Building2,
    label: 'Appartement',
    value: 'apartment',
    desc: 'Logements en immeuble, toutes surfaces',
    color: 'from-blue-500 to-blue-700',
  },
  {
    icon: Home,
    label: 'Maison',
    value: 'house',
    desc: 'Villas et maisons individuelles',
    color: 'from-green-500 to-green-700',
  },
];

const PropertyTypes = memo(() => {
  return (
    <section className="py-20 bg-gray-50 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Tous types de{' '}
            <span className="text-secondary">logements</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Appartement, studio, maison, chambre ou loft — nous avons ce qu&apos;il vous faut.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {types.map((type) => (
            <Link
              key={type.value}
              href={`${URL.public.properties}?type=${type.value}`}
              className="group"
            >
              <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`bg-gradient-to-br ${type.color} p-8 flex justify-center`}>
                  <type.icon className="h-12 w-12 text-white group-hover:scale-110 transition-transform" />
                </div>
                <div className="bg-white p-4 text-center">
                  <p className="font-bold text-gray-900">{type.label}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">{type.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
});

PropertyTypes.displayName = 'PropertyTypes';
export default PropertyTypes;
