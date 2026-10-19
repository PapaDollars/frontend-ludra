import type { PublishDraft, SearchOptions } from '@/types';
import type { FieldErrors } from '../schemas';

export interface StepProps {
  draft: PublishDraft;
  /** Erreurs à afficher (champs touchés ou après tentative de passage). */
  errors: FieldErrors;
  options: SearchOptions | null;
  onData: (patch: Record<string, unknown>) => void;
  onBlur: (field: string) => void;
}
