// types/report.ts — Signalements (transverse : annonces, profils, messages, avis)

export type ReportTargetType = 'listing' | 'user' | 'message' | 'review';

export type ReportReason =
  | 'arnaque'          // demande d'avance, faux bien…
  | 'fausse_annonce'   // bien inexistant, photos volées
  | 'doublon'
  | 'contenu_inapproprie'
  | 'deja_loue'
  | 'autre';

export interface ReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}
