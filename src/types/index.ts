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

export type Place = {
  id: string;
  name: string;
  categorySlug: CategorySlug;
  subcategory: string;
  district: string;
  city: string;
  address: string;
  phone?: string;
  coverUrl?: string;
  lat: number;
  lng: number;
  ratingAvg: number;
  ratingCount: number;
  /** Moyenne par critère, indexée par slug de critère */
  criteriaAvgs: Record<string, number>;
  /** Répartition des notes : index 0 = 1 étoile … index 4 = 5 étoiles */
  distribution: [number, number, number, number, number];
};

export type Review = {
  id: string;
  placeId: string;
  authorName: string;
  authorInitials: string;
  rating: number;
  comment: string;
  criteria: Record<string, number>;
  createdAt: string;
};
