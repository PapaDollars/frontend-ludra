'use client';

import { Phone, User, AlertCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/common/ui/Button';

interface ContactConfirmModalProps {
  isOpen: boolean;
  onCall: () => void;
  onWhatsApp?: () => void;
  onCancel: () => void;
  userName: string;
  userPhone?: string;
  propertyTitle: string;
}

export default function ContactConfirmModal({
  isOpen, onCall, onWhatsApp, onCancel, userName, userPhone, propertyTitle,
}: ContactConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 mx-4">
        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-primary" />
        </div>

        <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Contacter le propriétaire</h2>
        <p className="text-sm text-gray-500 text-center mb-5">
          Pour <span className="font-medium text-gray-700">&ldquo;{propertyTitle}&rdquo;</span>
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-3">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Vos informations partagées</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Nom</p>
              <p className="text-sm font-semibold text-gray-800">{userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Téléphone</p>
              <p className="text-sm font-semibold text-gray-800">{userPhone || <span className="text-gray-400 italic">Non renseigné</span>}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mb-5">
          En contactant, vous acceptez que vos informations soient transmises au propriétaire.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={onCall}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-xl font-semibold text-base transition-colors"
          >
            <Phone className="h-5 w-5" />
            Appeler le propriétaire
          </button>
          {onWhatsApp && (
            <button
              onClick={onWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-semibold text-base transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              Contacter via WhatsApp
            </button>
          )}
          <Button variant="outline" className="w-full" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
