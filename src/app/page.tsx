import FeedPage from '@/views/feed/FeedPage';

// V2.1 : l'accueil est le feed d'offres (dossier §1, décision structurante).
export default function HomeApp() {
  return <FeedPage filter="tous" />;
}
