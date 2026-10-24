import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReportSheet, type ReportTarget } from '@/components/report-sheet';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { CriteriaBars } from '@/components/ui/criteria-bars';
import { EmptyState } from '@/components/ui/empty-state';
import { PendingBadge } from '@/components/ui/pending-badge';
import { PlaceCover } from '@/components/ui/place-card';
import { ErrorState, LoadingState } from '@/components/ui/query-state';
import { RatingDistribution } from '@/components/ui/rating-distribution';
import { StarRating } from '@/components/ui/star-rating';
import { CATEGORY_BY_SLUG } from '@/constants/categories';
import { useIsDesktop } from '@/hooks/use-breakpoint';
import { useLocation } from '@/hooks/use-location';
import { useMyReview, usePlace, usePlaceReviews } from '@/hooks/use-places';
import { useIsModerator } from '@/hooks/use-role';
import { useColors } from '@/hooks/use-theme';
import { REQUIRED_ON_SITE_REVIEWS } from '@/lib/places';
import { useSession } from '@/lib/session';
import { distanceMeters, formatDistance, formatRating, timeAgo } from '@/lib/utils';

export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDesktop = useIsDesktop();

  const location = useLocation();
  const placeQuery = usePlace(id);
  const reviewsQuery = usePlaceReviews(id);
  const user = useSession();
  const { data: myReview } = useMyReview(id, user?.id);
  const reviewLabel = myReview ? 'Modifier mon avis' : 'Donner mon avis';
  const place = placeQuery.data;
  const isModerator = useIsModerator();
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  // Signaler demande un compte : on évite les signalements anonymes.
  function openReport(target: ReportTarget) {
    if (!user) {
      router.push('/auth/sign-in');
      return;
    }
    setReportTarget(target);
  }

  if (placeQuery.isPending) {
    return (
      <View className="flex-1 justify-center bg-surface dark:bg-surface-dark">
        <LoadingState />
      </View>
    );
  }

  if (placeQuery.isError) {
    return (
      <View className="flex-1 justify-center bg-surface dark:bg-surface-dark">
        <ErrorState onRetry={() => placeQuery.refetch()} />
      </View>
    );
  }

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
  const distance =
    location && place.lat !== null && place.lng !== null
      ? distanceMeters(location.origin, { lat: place.lat, lng: place.lng })
      : undefined;
  const hasReviews = place.ratingCount > 0;
  const reviews = reviewsQuery.data ?? [];

  const cover = place.coverUrl ? (
    <Image
      source={{ uri: place.coverUrl }}
      contentFit="cover"
      transition={200}
      style={{ width: '100%', height: '100%' }}
    />
  ) : (
    <PlaceCover place={place} className="h-full w-full" iconSize={48} />
  );

  const meta = (
    <View className="flex-row items-center gap-2">
      <View className={`rounded-pill px-2.5 py-1 ${category.tint.bgClass}`}>
        <Text className="text-xs font-semibold" style={{ color: category.tint.color }}>
          {place.subcategory ?? category.nameFr}
        </Text>
      </View>
      <Text className="text-xs text-ink-500 dark:text-ink-300">
        {place.district}
        {distance !== undefined ? ` · ${formatDistance(distance)}` : ''}
      </Text>
    </View>
  );

  const pendingNotice =
    place.status === 'pending' ? (
      <View className="gap-2 rounded-card bg-amber-50 p-4 dark:bg-amber-500/10">
        <PendingBadge onSiteCount={place.onSiteCount} />
        <Text className="text-sm leading-5 text-ink-700 dark:text-ink-200">
          {place.lat === null
            ? 'Lieu proposé par un membre, en attente de vérification par un administrateur.'
            : `Lieu proposé par un membre. Il sera confirmé et classé après ${REQUIRED_ON_SITE_REVIEWS} avis donnés sur place : si vous y êtes, votre avis compte.`}
        </Text>
      </View>
    ) : place.status === 'closed' || place.status === 'rejected' ? (
      <View className="gap-1 rounded-card bg-red-50 p-4 dark:bg-red-500/10">
        <Text className="text-sm font-semibold text-red-800 dark:text-red-300">
          {place.status === 'closed' ? 'Lieu fermé' : 'Lieu retiré du catalogue'}
        </Text>
        <Text className="text-sm leading-5 text-ink-700 dark:text-ink-200">
          Cette fiche n&apos;est plus visible du public : vous la voyez parce que vous modérez.
        </Text>
      </View>
    ) : null;

  const ratingBlock = (
    <View className="flex-row gap-6 rounded-card border border-ink-100 p-4 dark:border-white/10">
      <View className="items-center justify-center">
        <Text className="text-4xl font-bold text-ink dark:text-white">
          {hasReviews ? formatRating(place.ratingAvg) : '—'}
        </Text>
        <View className="mt-1.5">
          <StarRating value={place.ratingAvg} size="md" />
        </View>
        <Text className="mt-1.5 text-xs text-ink-500 dark:text-ink-300">
          {hasReviews ? `${place.ratingCount} avis` : 'Aucun avis'}
        </Text>
      </View>
      <View className="flex-1 justify-center">
        <RatingDistribution distribution={place.distribution} />
      </View>
    </View>
  );

  // Sans avis, des barres à zéro laisseraient croire à de mauvaises notes.
  const criteriaBlock = hasReviews ? (
    <>
      <Text className="text-lg font-bold text-ink dark:text-white">Ce que disent les notes</Text>
      <View className="mt-3">
        <CriteriaBars criteria={category.criteria} values={place.criteriaAvgs} />
      </View>
    </>
  ) : null;

  const contactBlock = (
    <View className="gap-3 rounded-card bg-ink-50 p-4 dark:bg-white/5">
      <View className="flex-row items-start gap-3">
        <Ionicons name="location-outline" size={18} color={colors.textMuted} />
        <Text className="flex-1 text-sm text-ink-700 dark:text-ink-300">
          {[place.address, place.district, place.city].filter(Boolean).join(', ')}
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
      <View className="flex-row flex-wrap gap-x-5 gap-y-2 pt-1">
        <Pressable
          onPress={() => openReport({ kind: 'place', placeId: place.id })}
          accessibilityRole="button"
          className="flex-row items-center gap-1.5 active:opacity-60">
          <Ionicons name="flag-outline" size={15} color={colors.textMuted} />
          <Text className="text-xs font-medium text-ink-500 dark:text-ink-300">
            Signaler un problème
          </Text>
        </Pressable>
        {isModerator && (
          <Pressable
            onPress={() => router.push(`/place/new?id=${place.id}`)}
            accessibilityRole="button"
            className="flex-row items-center gap-1.5 active:opacity-60">
            <Ionicons name="create-outline" size={15} color={colors.brand} />
            <Text className="text-xs font-semibold text-brand-500">Corriger la fiche</Text>
          </Pressable>
        )}
      </View>
      {/* Attribution exigée par la licence ODbL des données OpenStreetMap. */}
      {place.osmId && (
        <Text className="text-xs text-ink-500 dark:text-ink-300">
          Informations : © les contributeurs d&apos;OpenStreetMap
        </Text>
      )}
    </View>
  );

  const reviewList = reviewsQuery.isPending ? (
    <LoadingState />
  ) : reviewsQuery.isError ? (
    <ErrorState onRetry={() => reviewsQuery.refetch()} />
  ) : reviews.length === 0 ? (
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
              {review.authorId !== user?.id && (
                <Pressable
                  onPress={() => openReport({ kind: 'review', placeId: place.id, reviewId: review.id })}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Signaler cet avis"
                  className="active:opacity-60">
                  <Ionicons name="flag-outline" size={16} color={colors.textFaint} />
                </Pressable>
              )}
            </View>
            {review.comment && (
              <Text className="mt-3 text-sm leading-5 text-ink-700 dark:text-ink-200">
                {review.comment}
              </Text>
            )}
            <View className="mt-3 flex-row flex-wrap gap-2">
              {category.criteria
                .filter((criterion) => review.criteria[criterion.slug] !== undefined)
                .map((criterion) => (
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
                    {hasReviews ? `${formatRating(place.ratingAvg)} · ${place.ratingCount} avis` : 'Aucun avis'}
                  </Text>
                </View>
                <View className="mt-5 flex-row">
                  <Button
                    label={reviewLabel}
                    icon="star"
                    onPress={() => router.push(`/review/new?placeId=${place.id}`)}
                  />
                </View>
              </View>
            </View>

            {pendingNotice && <View className="mt-8 max-w-2xl">{pendingNotice}</View>}

            {/* Notes et coordonnées côte à côte */}
            <View className="mt-10 flex-row gap-6">
              <View className="flex-1 gap-6">
                {ratingBlock}
                {contactBlock}
              </View>
              <View className="flex-1">{criteriaBlock}</View>
            </View>

            <Text className="mt-10 text-lg font-bold text-ink dark:text-white">
              Avis ({place.ratingCount})
            </Text>
            {reviewList}
          </Container>
        </ScrollView>
        <ReportSheet target={reportTarget} onClose={() => setReportTarget(null)} />
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

          {pendingNotice && <View className="mt-5">{pendingNotice}</View>}

          <View className="mt-5">{ratingBlock}</View>

          {criteriaBlock && <View className="mt-7">{criteriaBlock}</View>}

          <View className="mt-7">{contactBlock}</View>

          <Text className="mt-8 text-lg font-bold text-ink dark:text-white">
            Avis ({place.ratingCount})
          </Text>
          {reviewList}
        </View>
      </ScrollView>

      <View
        style={{ paddingBottom: insets.bottom + 12 }}
        className="absolute inset-x-0 bottom-0 border-t border-ink-100 bg-surface px-5 pt-3 dark:border-white/10 dark:bg-surface-dark">
        <Button
          label={reviewLabel}
          icon="star"
          fullWidth
          onPress={() => router.push(`/review/new?placeId=${place.id}`)}
        />
      </View>

      <ReportSheet target={reportTarget} onClose={() => setReportTarget(null)} />
    </View>
  );
}
