'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/common/ui/Card';
import { Button } from '@/components/common/ui/Button';

const contactInfo = [
  {
    icon: Phone,
    label: 'Téléphone',
    value: '+237 6XX XXX XXX',
    sub: 'Lun – Ven, 8h – 18h',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'contact@ludra.cm',
    sub: 'Réponse sous 24h',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: MapPin,
    label: 'Adresse',
    value: 'Douala, Cameroun',
    sub: 'Bonapriso',
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
  {
    icon: Clock,
    label: 'Horaires',
    value: 'Lun – Sam',
    sub: '8h00 – 18h00',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/contacts/general', form, { auth: false });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Contactez-nous</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Une question, un problème ou une suggestion ? Notre équipe vous répond dans les plus brefs délais.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Infos de contact */}
          <div className="space-y-4">
            {contactInfo.map((info, i) => (
              <Card key={i} className="p-5 bg-white border border-gray-100 flex items-start gap-4">
                <div className={`${info.bg} p-3 rounded-xl flex-shrink-0`}>
                  <info.icon className={`h-5 w-5 ${info.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{info.label}</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{info.value}</p>
                  <p className="text-sm text-gray-500">{info.sub}</p>
                </div>
              </Card>
            ))}

            {/* Réseaux sociaux placeholder */}
            <Card className="p-5 bg-white border border-gray-100">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Réseaux sociaux</p>
              <div className="flex gap-3 flex-wrap">
                {['Facebook', 'Instagram', 'WhatsApp'].map((r) => (
                  <span key={r} className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full font-medium">
                    {r}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Formulaire */}
          <Card className="lg:col-span-2 p-8 bg-white border border-gray-100">
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div className="bg-green-100 p-5 rounded-full mb-5">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message envoyé !</h3>
                <p className="text-gray-600 mb-6">
                  Merci de nous avoir contactés. Nous vous répondrons dans les 24h.
                </p>
                <Button variant="outline" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                  Envoyer un autre message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Envoyer un message</h2>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Votre nom"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-gray-50 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="votre@email.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-gray-50 text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sujet *</label>
                  <select
                    name="subject"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-gray-50 text-gray-900"
                  >
                    <option value="">Sélectionner un sujet</option>
                    <option value="info">Demande d&apos;information</option>
                    <option value="probleme">Signaler un problème</option>
                    <option value="annonce">Problème avec une annonce</option>
                    <option value="proprietaire">Devenir propriétaire</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Décrivez votre demande..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-gray-50 text-gray-900 resize-none"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-700">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Envoi en cours...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send className="h-4 w-4" />
                      Envoyer le message
                    </span>
                  )}
                </Button>
                {error && (
                  <p className="mt-3 text-sm text-red-600 text-center">
                    {error}
                  </p>
                )}
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
