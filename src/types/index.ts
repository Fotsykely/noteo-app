import type { Ionicons } from '@expo/vector-icons';

export type IoniconName = keyof typeof Ionicons.glyphMap;

export type CategorySlug = 'resto' | 'sante' | 'garage';

export type Criterion = {
  slug: string;
  labelFr: string;
  labelMg: string;
};

export type Category = {
  slug: CategorySlug;
  nameFr: string;
  nameMg: string;
  icon: IoniconName;
  /** Teinte de la catégorie : classe de fond NativeWind + couleur d'icône (les
   *  composants d'icônes n'acceptent pas de className, d'où la couleur en dur) */
  tint: { bgClass: string; color: string };
  subcategories: string[];
  criteria: Criterion[];
};

export type Coordinates = { lat: number; lng: number };

/**
 * - `pending`   : proposé par un utilisateur, « à confirmer » (3 avis sur place requis)
 * - `published` : visible partout, classé
 * - `rejected`  : retiré (doublon, erroné, refusé)
 * - `closed`    : a existé, a fermé (distinct de `rejected` : l'historique est gardé)
 */
export type PlaceStatus = 'pending' | 'published' | 'rejected' | 'closed';

export type Place = {
  id: string;
  name: string;
  categorySlug: CategorySlug;
  /** Absente pour certains lieux proposés par les utilisateurs. */
  subcategory?: string;
  district: string;
  city: string;
  /** Rarement renseignées dans OpenStreetMap à Tana. */
  address?: string;
  phone?: string;
  coverUrl?: string;
  /** Nulles pour un lieu proposé sans GPS, en attente d'un admin. */
  lat: number | null;
  lng: number | null;
  ratingAvg: number;
  ratingCount: number;
  /** Moyenne par critère, indexée par slug de critère */
  criteriaAvgs: Record<string, number>;
  /** Répartition des notes : index 0 = 1 étoile … index 4 = 5 étoiles */
  distribution: [number, number, number, number, number];
  /** Présent si la fiche vient d'OpenStreetMap (attribution ODbL à afficher). */
  osmId?: string;
  status: PlaceStatus;
  /** Comptes différents l'ayant noté sur place ; 3 valident un lieu à confirmer. */
  onSiteCount: number;
};

export type Review = {
  id: string;
  placeId: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  rating: number;
  comment?: string;
  /** Note par critère, partielle : un avis peut n'en noter que certains. */
  criteria: Record<string, number>;
  createdAt: string;
};

export type District = { name: string; placeCount: number };
