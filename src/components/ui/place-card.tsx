import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { PendingBadge } from '@/components/ui/pending-badge';
import { RatingBadge } from '@/components/ui/rating-badge';
import { StarRating } from '@/components/ui/star-rating';
import { CATEGORY_BY_SLUG } from '@/constants/categories';
import { useColors } from '@/hooks/use-theme';
import { placeSubtitle } from '@/lib/places';
import { cn, formatDistance, formatRating } from '@/lib/utils';
import type { Place } from '@/types';

/** Photo du lieu, ou à défaut l'icône de sa catégorie sur sa teinte. */
export function PlaceCover({
  place,
  className,
  iconSize = 26,
}: {
  place: Place;
  className?: string;
  iconSize?: number;
}) {
  const category = CATEGORY_BY_SLUG[place.categorySlug];

  return (
    <View className={className}>
      {place.coverUrl ? (
        <Image
          source={{ uri: place.coverUrl }}
          contentFit="cover"
          transition={180}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <View className={`h-full w-full items-center justify-center ${category.tint.bgClass}`}>
          <Ionicons name={category.icon} size={iconSize} color={category.tint.color} />
        </View>
      )}
    </View>
  );
}

type PlaceCardProps = {
  place: Place;
  distanceMeters?: number;
  /**
   * `fixed` : largeur constante, pour le carrousel horizontal du mobile.
   * `fill`  : épouse la colonne, pour la grille des grands écrans.
   */
  width?: 'fixed' | 'fill';
};

/** Carte verticale, pour les carrousels et les grilles. */
export function PlaceCard({ place, distanceMeters, width = 'fixed' }: PlaceCardProps) {
  const category = CATEGORY_BY_SLUG[place.categorySlug];

  return (
    <Link href={`/place/${place.id}`} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={place.name}
        className={cn(
          'overflow-hidden rounded-card border border-ink-100 bg-surface active:opacity-80 dark:border-white/10 dark:bg-surface-darkMuted',
          // Le survol n'existe qu'au pointeur : invisible sur mobile.
          'hover:border-brand-500/50 dark:hover:bg-white/10 web:transition-colors web:duration-150',
          width === 'fill' ? 'w-full' : 'w-60'
        )}>
        <PlaceCover place={place} className="h-32 w-full bg-ink-100 dark:bg-white/10" />
        <View className="p-3">
          <Text className="text-base font-semibold text-ink dark:text-white" numberOfLines={1}>
            {place.name}
          </Text>
          <Text className="mt-0.5 text-xs text-ink-500 dark:text-ink-300" numberOfLines={1}>
            {placeSubtitle(place, category.nameFr)}
          </Text>
          <View className="mt-2 flex-row items-center justify-between">
            <RatingBadge value={place.ratingAvg} count={place.ratingCount} size="sm" />
            {distanceMeters !== undefined && (
              <Text className="text-xs text-ink-500 dark:text-ink-300">
                {formatDistance(distanceMeters)}
              </Text>
            )}
          </View>
        </View>
        <View className="absolute left-3 top-3 rounded-pill bg-black/55 px-2 py-1">
          <Text className="text-[11px] font-medium text-white">{category.nameFr}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

type PlaceRowProps = {
  place: Place;
  distanceMeters?: number;
  /** Affiche la position au classement (1, 2, 3…). */
  rank?: number;
};

/** Ligne de liste, pour les classements et résultats de recherche. */
export function PlaceRow({ place, distanceMeters, rank }: PlaceRowProps) {
  const colors = useColors();
  const category = CATEGORY_BY_SLUG[place.categorySlug];

  return (
    <Link href={`/place/${place.id}`} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={place.name}
        className="flex-row items-center gap-3 rounded-card px-4 py-3 hover:bg-ink-50 active:bg-ink-100 dark:hover:bg-white/5 dark:active:bg-white/10 web:transition-colors web:duration-150">
        {rank !== undefined && (
          <Text className="min-w-6 text-base font-bold text-ink-500 dark:text-ink-300">{rank}</Text>
        )}
        <PlaceCover place={place} className="h-[68px] w-[68px] overflow-hidden rounded-2xl bg-ink-100 dark:bg-white/10" />
        <View className="flex-1">
          <Text className="text-base font-semibold text-ink dark:text-white" numberOfLines={1}>
            {place.name}
          </Text>
          <Text className="mt-0.5 text-xs text-ink-500 dark:text-ink-300" numberOfLines={1}>
            {placeSubtitle(place, category.nameFr)}
            {distanceMeters !== undefined ? ` · ${formatDistance(distanceMeters)}` : ''}
          </Text>
          {place.status === 'pending' ? (
            <PendingBadge onSiteCount={place.onSiteCount} className="mt-1.5" />
          ) : (
            <View className="mt-1.5 flex-row items-center gap-2">
              <StarRating value={place.ratingAvg} size="sm" />
              <Text className="text-xs text-ink-500 dark:text-ink-300">
                {place.ratingCount > 0
                  ? `${formatRating(place.ratingAvg)} · ${place.ratingCount} avis`
                  : 'Pas encore d\'avis'}
              </Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </Pressable>
    </Link>
  );
}

/** Emplacement statique d'une carte pendant le chargement : la mise en page ne saute pas. */
export function PlaceCardSkeleton({ width = 'fixed' }: { width?: 'fixed' | 'fill' }) {
  return (
    <View
      className={cn(
        'overflow-hidden rounded-card border border-ink-100 bg-surface dark:border-white/10 dark:bg-surface-darkMuted',
        width === 'fill' ? 'w-full' : 'w-60'
      )}>
      <View className="h-32 w-full bg-ink-100 dark:bg-white/10" />
      <View className="gap-2 p-3">
        <View className="h-4 w-3/4 rounded bg-ink-100 dark:bg-white/10" />
        <View className="h-3 w-1/2 rounded bg-ink-100 dark:bg-white/10" />
        <View className="mt-1 h-5 w-16 rounded-lg bg-ink-100 dark:bg-white/10" />
      </View>
    </View>
  );
}

/** Emplacement statique d'une ligne de liste pendant le chargement. */
export function PlaceRowSkeleton() {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <View className="h-[68px] w-[68px] rounded-2xl bg-ink-100 dark:bg-white/10" />
      <View className="flex-1 gap-2">
        <View className="h-4 w-2/3 rounded bg-ink-100 dark:bg-white/10" />
        <View className="h-3 w-1/2 rounded bg-ink-100 dark:bg-white/10" />
        <View className="h-3 w-1/3 rounded bg-ink-100 dark:bg-white/10" />
      </View>
    </View>
  );
}
