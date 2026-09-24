import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { RatingBadge } from '@/components/ui/rating-badge';
import { StarRating } from '@/components/ui/star-rating';
import { CATEGORY_BY_SLUG } from '@/constants/categories';
import { useColors } from '@/hooks/use-theme';
import { formatDistance } from '@/lib/utils';
import type { Place } from '@/types';

function Cover({ place, className }: { place: Place; className?: string }) {
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
          <Ionicons name={category.icon} size={26} color={category.tint.color} />
        </View>
      )}
    </View>
  );
}

type PlaceCardProps = {
  place: Place;
  distanceMeters?: number;
};

/** Carte verticale, pour les carrousels horizontaux de l'accueil. */
export function PlaceCard({ place, distanceMeters }: PlaceCardProps) {
  const category = CATEGORY_BY_SLUG[place.categorySlug];

  return (
    <Link href={`/place/${place.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={place.name}
        className="w-60 overflow-hidden rounded-card border border-ink-100 bg-surface active:opacity-80 dark:border-white/10 dark:bg-surface-darkMuted">
        <Cover place={place} className="h-32 w-full bg-ink-100 dark:bg-white/10" />
        <View className="p-3">
          <Text className="text-base font-semibold text-ink dark:text-white" numberOfLines={1}>
            {place.name}
          </Text>
          <Text className="mt-0.5 text-xs text-ink-500 dark:text-ink-300" numberOfLines={1}>
            {place.subcategory} · {place.district}
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

  return (
    <Link href={`/place/${place.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={place.name}
        className="flex-row items-center gap-3 rounded-card px-4 py-3 active:bg-ink-50 dark:active:bg-white/5">
        {rank !== undefined && (
          <Text className="w-6 text-base font-bold text-ink-300 dark:text-ink-500">{rank}</Text>
        )}
        <Cover place={place} className="h-[68px] w-[68px] overflow-hidden rounded-2xl bg-ink-100 dark:bg-white/10" />
        <View className="flex-1">
          <Text className="text-base font-semibold text-ink dark:text-white" numberOfLines={1}>
            {place.name}
          </Text>
          <Text className="mt-0.5 text-xs text-ink-500 dark:text-ink-300" numberOfLines={1}>
            {place.subcategory} · {place.district}
            {distanceMeters !== undefined ? ` · ${formatDistance(distanceMeters)}` : ''}
          </Text>
          <View className="mt-1.5 flex-row items-center gap-2">
            <StarRating value={place.ratingAvg} size="sm" />
            <Text className="text-xs text-ink-500 dark:text-ink-300">
              {place.ratingAvg.toFixed(1).replace('.', ',')} · {place.ratingCount} avis
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </Pressable>
    </Link>
  );
}
