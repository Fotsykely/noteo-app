import type { Category, CategorySlug } from '@/types';

/**
 * Les 3 catégories du MVP Antananarivo, avec leurs critères de notation.
 * Les libellés malgaches sont à valider avant la mise en production.
 */
export const CATEGORIES: Category[] = [
  {
    slug: 'resto',
    nameFr: 'Restaurants',
    nameMg: 'Toeram-pisakafoanana',
    icon: 'restaurant',
    tint: { bgClass: 'bg-orange-100 dark:bg-orange-500/20', color: '#EA580C' },
    subcategories: ['Restaurant', 'Gargote', 'Fast-food', 'Pâtisserie', 'Bar'],
    criteria: [
      { slug: 'gout', labelFr: 'Goût', labelMg: 'Tsiro' },
      { slug: 'prix', labelFr: 'Rapport qualité-prix', labelMg: 'Vidiny' },
      { slug: 'accueil', labelFr: 'Accueil', labelMg: 'Fandraisana' },
    ],
  },
  {
    slug: 'sante',
    nameFr: 'Santé',
    nameMg: 'Fahasalamana',
    icon: 'medkit',
    tint: { bgClass: 'bg-sky-100 dark:bg-sky-500/20', color: '#0284C7' },
    subcategories: ['Médecin généraliste', 'Dentiste', 'Clinique', 'Pharmacie', 'Laboratoire'],
    criteria: [
      { slug: 'ecoute', labelFr: 'Écoute', labelMg: 'Fihainoana' },
      { slug: 'competence', labelFr: 'Compétence', labelMg: 'Fahaiza-manao' },
      { slug: 'attente', labelFr: "Temps d'attente", labelMg: 'Fiandrasana' },
    ],
  },
  {
    slug: 'garage',
    nameFr: 'Garages',
    nameMg: 'Toeram-panamboarana',
    icon: 'car-sport',
    tint: { bgClass: 'bg-violet-100 dark:bg-violet-500/20', color: '#7C3AED' },
    subcategories: ['Garage auto', 'Mécanicien', 'Carrosserie', 'Pneus', 'Lavage'],
    criteria: [
      { slug: 'honnetete', labelFr: 'Honnêteté du prix', labelMg: 'Fahamarinan-bidy' },
      { slug: 'qualite', labelFr: 'Qualité de la réparation', labelMg: 'Kalitao' },
      { slug: 'delai', labelFr: 'Délai', labelMg: 'Fotoana' },
    ],
  },
];

export const CATEGORY_BY_SLUG: Record<CategorySlug, Category> = CATEGORIES.reduce(
  (acc, category) => ({ ...acc, [category.slug]: category }),
  {} as Record<CategorySlug, Category>
);

/** Quartiers d'Antananarivo proposés dans les filtres. */
export const DISTRICTS = [
  'Analakely',
  'Ivandry',
  'Ambatobe',
  'Ankorondrano',
  'Andraharo',
  'Isoraka',
  'Antaninarenina',
  'Behoririka',
  'Mahamasina',
  'Talatamaty',
  'Ivato',
  'Andoharanofotsy',
];
