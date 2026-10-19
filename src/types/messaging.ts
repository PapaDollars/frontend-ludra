// types/messaging.ts — Module 05 : Messagerie interne
import type { Amount, ISODate, Publisher, Universe } from './common';
import type { PriceUnit } from './feed';

/** Objet de la conversation (annonce, profil candidat, service). */
export interface ConversationContext {
  universe: Universe;
  itemId: string;
  title: string;
  thumbnail?: string | null;
  price?: Amount;
  priceUnit?: PriceUnit;
}

export interface MessagePreview {
  text: string;
  fromMe: boolean;
  createdAt: ISODate;
}

export interface Conversation {
  id: string;
  /** L'autre participant (jamais de téléphone ici). */
  participant: Publisher;
  context: ConversationContext | null;
  lastMessage: MessagePreview | null;
  unreadCount: number;
  updatedAt: ISODate;
  participantOnline: boolean;
  /** Dernière lecture par l'autre participant : mes messages antérieurs sont « Lu ». */
  participantLastReadAt: ISODate | null;
  /** J'ai bloqué l'autre participant. */
  blockedByMe: boolean;
  /** L'autre participant m'a bloqué : envoi impossible. */
  blockedMe: boolean;
}

export type MessageKind = 'text' | 'image' | 'system';

/**
 * Modération appliquée par le serveur :
 * - contact_masked : numéro / e-mail masqué (aucune coordonnée révélée automatiquement)
 * - link_blocked   : lien retiré
 * - image_rejected : image refusée par le contrôle
 */
export type MessageModeration = 'contact_masked' | 'link_blocked' | 'image_rejected';

export interface Message {
  id: string;
  conversationId: string;
  kind: MessageKind;
  /** Calculé par le serveur relativement à l'utilisateur connecté. */
  fromMe: boolean;
  text?: string;
  image?: { url: string; width?: number; height?: number };
  createdAt: ISODate;
  moderation?: MessageModeration[];
}

export interface OpenConversationInput {
  recipientId: string;
  itemId?: string;
}
