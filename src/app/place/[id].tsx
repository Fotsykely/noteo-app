import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { CriteriaBars } from '@/components/ui/criteria-bars';
import { EmptyState } from '@/components/ui/empty-state';
import { RatingDistribution } from '@/components/ui/rating-distribution';
import { StarRating } from '@/components/ui/star-rating';
import { CATEGORY_BY_SLUG } from '@/constants/categories';
import { getPlace, getReviewsForPlace, TANA_CENTER } from '@/data/mock';
import { useIsDesktop } from '@/hooks/use-breakpoint';
import { useColors } from '@/hooks/use-theme';
import { distanceMeters, formatDistance, formatRating, timeAgo } from '@/lib/utils';

export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDesktop = useIsDesktop();

  const place = useMemo(() => getPlace(id), [id]);
  const reviews = useMemo(() => (place ? getReviewsForPlace(place.id) : []), [place]);

  if (!place) {
    return (
      <View className="flex-1 bg-surface dark:bg-surface-dark">
        <EmptyState
          icon="alert-circle-outline"
          title="Lieu introuvable"
          description="Cette fiche n'existe plus ou a été retirée."
          actionLabel="Revenir en arrière"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const category = CATEGORY_BY_SLUG[place.categorySlug];
  const distance = distanceMeters(TANA_CENTER, { lat: place.lat, lng: place.lng });

  const cover = place.coverUrl ? (
    <Image
      source={{ uri: place.coverUrl }}
      contentFit="cover"
      transition={200}
      style={{ width: '100%', height: '100%' }}
    />
  ) : null;

  const meta = (
    <View className="flex-row items-center gap-2">
      <View className={`rounded-pill px-2.5 py-1 ${category.tint.bgClass}`}>
        <Text className="text-xs font-semibold" style={{ color: category.tint.color }}>
          {place.subcategory}
        </Text>
      </View>
      <Text className="text-xs text-ink-500 dark:text-ink-300">
        {place.district} · {formatDistance(distance)}
      </Text>
    </View>
  );

  const ratingBlock = (
    <View className="flex-row gap-6 rounded-card border border-ink-100 p-4 dark:border-white/10">
      <View className="items-center justify-center">
        <Text className="text-4xl font-bold text-ink dark:text-white">
          {formatRating(place.ratingAvg)}
        </Text>
        <View className="mt-1.5">
          <StarRating value={place.ratingAvg} size="md" />
        </View>
        <Text className="mt-1.5 text-xs text-ink-500 dark:text-ink-300">
          {place.ratingCount} avis
        </Text>
      </View>
      <View className="flex-1 justify-center">
        <RatingDistribution distribution={place.distribution} />
      </View>
    </View>
  );

  const criteriaBlock = (
    <>
      <Text className="text-lg font-bold text-ink dark:text-white">Ce que disent les notes</Text>
      <View className="mt-3">
        <CriteriaBars criteria={category.criteria} values={place.criteriaAvgs} />
      </View>
    </>
  );

  const contactBlock = (
    <View className="gap-3 rounded-card bg-ink-50 p-4 dark:bg-white/5">
      <View className="flex-row items-start gap-3">
        <Ionicons name="location-outline" size={18} color={colors.textMuted} />
        <Text className="flex-1 text-sm text-ink-700 dark:text-ink-300">
          {place.address}, {place.city}
        </Text>
      </View>
      {place.phone && (
        <Pressable
          onPress={() => Linking.openURL(`tel:${place.phone?.replace(/\s/g, '')}`)}
          accessibilityRole="button"
          className="flex-row items-center gap-3 active:opacity-60">
          <Ionicons name="call-outline" size={18} color={colors.brand} />
          <Text className="flex-1 text-sm font-medium text-brand-500">{place.phone}</Text>
        </Pressable>
      )}
    </View>
  );

  const reviewList =
    reviews.length === 0 ? (
      <EmptyState
        icon="chatbubble-outline"
        title="Pas encore d'avis"
        description="Soyez la première personne à noter ce lieu."
      />
    ) : (
      <View className="mt-3 gap-4">
        {reviews.map((review) => (
          <View
            key={review.id}
            className="rounded-card border border-ink-100 p-4 dark:border-white/10">
            <View className="flex-row items-center gap-3">
              <Avatar initials={review.authorInitials} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-ink dark:text-white">
                  {review.authorName}
                </Text>
                <Text className="text-xs text-ink-500 dark:text-ink-300">
                  {timeAgo(review.createdAt)}
                </Text>
              </View>
              <StarRating value={review.rating} size="sm" />
            </View>
            <Text className="mt-3 text-sm leading-5 text-ink-700 dark:text-ink-200">
              {review.comment}
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {category.criteria.map((criterion) => (
                <View
                  key={criterion.slug}
                  className="rounded-pill bg-ink-50 px-2.5 py-1 dark:bg-white/10">
                  <Text className="text-[11px] text-ink-700 dark:text-ink-300">
                    {criterion.labelFr} {review.criteria[criterion.slug]}/5
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );

  // ---------- Grand écran : en-tête deux colonnes, pas de barre d'action flottante ----------
  if (isDesktop) {
    return (
      <View className="flex-1 bg-surface dark:bg-surface-dark">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
          <Container className="pt-6">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              className="h-10 w-10 items-center justify-center rounded-full active:opacity-70 hover:bg-ink-50 dark:hover:bg-white/10">
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>

            <View className="mt-4 flex-row items-end gap-6">
              <View className="h-56 w-56 overflow-hidden rounded-2xl bg-ink-100 dark:bg-white/10">
                {cover}
              </View>
              <View className="flex-1 pb-1">
                {meta}
                <Text className="mt-3 text-[44px] font-bold leading-[52px] text-ink dark:text-white">
                  {place.name}
                </Text>
                <View className="mt-3 flex-row items-center gap-2">
                  <StarRating value={place.ratingAvg} size="md" />
                  <Text className="text-sm text-ink-700 dark:text-ink-200">
                    {formatRating(place.ratingAvg)} · {place.ratingCount} avis
                  </Text>
                </View>
                <View className="mt-5 flex-row">
                  <Button
                    label="Donner mon avis"
                    icon="star"
                    onPress={() => router.push(`/review/new?placeId=${place.id}`)}
                  />
                </View>
              </View>
            </View>

            {/* Notes et coordonnées côte à côte */}
            <View className="mt-10 flex-row gap-6">
              <View className="flex-1 gap-6">
                {ratingBlock}
                {contactBlock}
              </View>
              <View className="flex-1">{criteriaBlock}</View>
            </View>

            <Text className="mt-10 text-lg font-bold text-ink dark:text-white">
              Avis ({reviews.length})
            </Text>
            {reviewList}
          </Container>
        </ScrollView>
      </View>
    );
  }

  // ---------- Mobile ----------
  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="h-64 w-full bg-ink-100 dark:bg-white/10">{cover}</View>

        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          style={{ top: insets.top + 8 }}
          className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-black/55 active:opacity-70">
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>

        <View className="-mt-5 rounded-t-3xl bg-surface px-5 pt-5 dark:bg-surface-dark">
          {meta}

          <Text className="mt-2.5 text-[26px] font-bold leading-8 text-ink dark:text-white">
            {place.name}
          </Text>

          <View className="mt-5">{ratingBlock}</View>

          <View className="mt-7">{criteriaBlock}</View>

          <View className="mt-7">{contactBlock}</View>

          <Text className="mt-8 text-lg font-bold text-ink dark:text-white">
            Avis ({reviews.length})
          </Text>
          {reviewList}
        </View>
      </ScrollView>

      <View
        style={{ paddingBottom: insets.bottom + 12 }}
        className="absolute inset-x-0 bottom-0 border-t border-ink-100 bg-surface px-5 pt-3 dark:border-white/10 dark:bg-surface-dark">
        <Button
          label="Donner mon avis"
          icon="star"
          fullWidth
          onPress={() => router.push(`/review/new?placeId=${place.id}`)}
        />
      </View>
    </View>
  );
}
