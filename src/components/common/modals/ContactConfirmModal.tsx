'use client';

import { Phone, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/ui/Button';

interface ContactConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  userName: string;
  userPhone?: string;
  propertyTitle: string;
}

export default function ContactConfirmModal({
  isOpen, onConfirm, onCancel, loading = false, userName, userPhone, propertyTitle,
}: ContactConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-primary" />
        </div>

        <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Confirmer la demande</h2>
        <p className="text-sm text-gray-500 text-center mb-5">
          Pour <span className="font-medium text-gray-700">&ldquo;{propertyTitle}&rdquo;</span>
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-3">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Informations partagées avec le propriétaire</p>
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
          En confirmant, vous acceptez que ces informations soient transmises au propriétaire qui vous contactera directement.
        </p>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button variant="primary" className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? 'Envoi…' : 'Confirmer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
