import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';

import { DistrictPicker } from '@/components/district-picker';
import { Chip } from '@/components/ui/category-chip';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { PlaceRow, PlaceRowSkeleton } from '@/components/ui/place-card';
import { ErrorState, LoadingState } from '@/components/ui/query-state';
import { Screen } from '@/components/ui/screen';
import { CATEGORIES } from '@/constants/categories';
import { useIsDesktop } from '@/hooks/use-breakpoint';
import { useLocation } from '@/hooks/use-location';
import { useCategoryCounts, useDistricts, useRankedPlaces } from '@/hooks/use-places';
import type { SortMode } from '@/lib/places';
import type { CategorySlug } from '@/types';
import { showScrollbar } from '@/lib/utils';

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const isDesktop = useIsDesktop();

  const [category, setCategory] = useState<CategorySlug | null>(
    (params.category as CategorySlug) ?? null
  );
  const [district, setDistrict] = useState<string | null>(null);
  const [chosenSort, setSort] = useState<SortMode>('rating');
  // Trier par distance suppose la position réelle de l'appareil.
  const location = useLocation();
  const canSortByDistance = location?.source === 'device';
  const sort: SortMode = canSortByDistance ? chosenSort : 'rating';

  // L'onglet reste monté : une tuile de l'accueil qui change `?category=` doit
  // mettre le filtre à jour (ajustement pendant le rendu, sans effet).
  const [lastParam, setLastParam] = useState(params.category);
  if (params.category !== lastParam) {
    setLastParam(params.category);
    setCategory((params.category as CategorySlug) ?? null);
  }

  const ranking = useRankedPlaces({ category, district, sort });
  const results = useMemo(() => ranking.data?.pages.flat() ?? [], [ranking.data]);

  // Nombre total de lieux pour ces filtres, sans attendre d'avoir tout chargé.
  const counts = useCategoryCounts();
  const districts = useDistricts(category);
  const total = district
    ? districts.data?.find((item) => item.name === district)?.placeCount
    : category
      ? counts.data?.[category]
      : counts.data && Object.values(counts.data).reduce((sum, count) => sum + count, 0);

  const categoryChips = (
    <>
      <Chip label="Tout" selected={category === null} onPress={() => setCategory(null)} />
      {CATEGORIES.map((item) => (
        <Chip
          key={item.slug}
          label={item.nameFr}
          icon={item.icon}
          selected={category === item.slug}
          onPress={() => setCategory(category === item.slug ? null : item.slug)}
        />
      ))}
    </>
  );

  const districtPicker = (
    <DistrictPicker value={district} onChange={setDistrict} category={category} allowAll />
  );

  const sortChips = (
    <>
      <Chip
        label="Mieux notés"
        icon="trophy-outline"
        selected={sort === 'rating'}
        onPress={() => setSort('rating')}
      />
      {canSortByDistance && (
        <Chip
          label="Plus proches"
          icon="navigate-outline"
          selected={sort === 'distance'}
          onPress={() => setSort('distance')}
        />
      )}
    </>
  );

  const title = (
    <>
      <Text className="text-[28px] font-bold text-ink dark:text-white lg:text-[36px]">
        Classements
      </Text>
      <Text className="mt-1 text-sm text-ink-500 dark:text-ink-300">
        {total !== undefined ? `${total} lieux` : 'Lieux'} à {district ?? 'Antananarivo'}
      </Text>
    </>
  );

  const emptyState = (
    <EmptyState
      icon="funnel-outline"
      title="Aucun lieu avec ces filtres"
      description="Essayez une autre catégorie ou un autre quartier."
      actionLabel="Réinitialiser"
      onAction={() => {
        setCategory(null);
        setDistrict(null);
      }}
    />
  );

  const footer = ranking.isFetchingNextPage ? (
    <LoadingState className="py-6" />
  ) : results.length > 0 && sort === 'rating' ? (
    <Text className="px-5 pt-4 text-center text-xs leading-4 text-ink-500 dark:text-ink-300">
      Le classement tient compte du nombre d&apos;avis : un lieu noté 5 par une seule personne ne
      devance pas un lieu noté 4,7 par deux cents.
    </Text>
  ) : null;

  const fetchMore = () => {
    if (ranking.hasNextPage && !ranking.isFetchingNextPage) ranking.fetchNextPage();
  };

  // ---------- Grand écran : tout défile ensemble, filtres sur une seule ligne ----------
  if (isDesktop) {
    return (
      <Screen>
        <FlatList
          // Changer le nombre de colonnes exige de remonter la liste.
          key="grille"
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 16 }}
          contentContainerStyle={{
            paddingBottom: 32,
            width: '100%',
            maxWidth: 1280,
            alignSelf: 'center',
            // 16 + les 16 px de `PlaceRow` = la gouttière de 32 px des autres écrans.
            paddingHorizontal: 16,
          }}
          showsVerticalScrollIndicator={showScrollbar}
          onEndReached={fetchMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <View className="px-4 pb-3 pt-8">
              {title}
              <View className="mt-5 flex-row flex-wrap items-center gap-x-2 gap-y-3">
                {categoryChips}
                <View className="mx-1 h-6 w-px bg-ink-200 dark:bg-white/20" />
                {districtPicker}
                <View className="mx-1 h-6 w-px bg-ink-200 dark:bg-white/20" />
                {sortChips}
              </View>
            </View>
          }
          renderItem={({ item, index }) => (
            <View className="flex-1">
              <PlaceRow
                place={item}
                distanceMeters={item.distance}
                rank={sort === 'rating' ? index + 1 : undefined}
              />
            </View>
          )}
          ListEmptyComponent={
            ranking.isPending ? (
              <View className="flex-row flex-wrap">
                {Array.from({ length: 8 }, (_, index) => (
                  <View key={index} className="w-1/2">
                    <PlaceRowSkeleton />
                  </View>
                ))}
              </View>
            ) : ranking.isError ? (
              <ErrorState onRetry={() => ranking.refetch()} />
            ) : (
              emptyState
            )
          }
          ListFooterComponent={footer}
        />
      </Screen>
    );
  }

  // ---------- Mobile ----------
  return (
    <Screen>
      <Container className="pb-1 pt-2">{title}</Container>

      {/* Filtres : défilement horizontal au doigt. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 12 }}>
        {categoryChips}
      </ScrollView>
      <View className="flex-row px-5">{districtPicker}</View>

      {/* Tri */}
      <View className="mt-3 border-t border-ink-100 dark:border-white/10">
        <Container className="py-3">
          <View className="flex-row gap-2">{sortChips}</View>
        </Container>
      </View>

      {ranking.isPending ? (
        <LoadingState />
      ) : ranking.isError ? (
        <ErrorState onRetry={() => ranking.refetch()} />
      ) : (
        <FlatList
          key="liste"
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={showScrollbar}
          // Page suivante un demi-écran avant la fin de la liste.
          onEndReached={fetchMore}
          onEndReachedThreshold={0.5}
          renderItem={({ item, index }) => (
            <PlaceRow
              place={item}
              distanceMeters={item.distance}
              rank={sort === 'rating' ? index + 1 : undefined}
            />
          )}
          ListEmptyComponent={emptyState}
          ListFooterComponent={footer}
        />
      )}
    </Screen>
  );
}
