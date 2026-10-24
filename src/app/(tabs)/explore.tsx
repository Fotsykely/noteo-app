import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';

import { DistrictPicker } from '@/components/district-picker';
import { Chip } from '@/components/ui/category-chip';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { PlaceRow } from '@/components/ui/place-card';
import { ErrorState, LoadingState } from '@/components/ui/query-state';
import { Screen } from '@/components/ui/screen';
import { CATEGORIES } from '@/constants/categories';
import { useIsDesktop } from '@/hooks/use-breakpoint';
import { useLocation } from '@/hooks/use-location';
import { useCategoryCounts, useDistricts, useRankedPlaces } from '@/hooks/use-places';
import type { SortMode } from '@/lib/places';
import type { CategorySlug } from '@/types';

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

  return (
    <Screen>
      <Container className="pb-1 pt-2 lg:pt-8">
        <Text className="text-[28px] font-bold text-ink dark:text-white lg:text-[36px]">
          Classements
        </Text>
        <Text className="mt-1 text-sm text-ink-500 dark:text-ink-300">
          {total !== undefined ? `${total} lieux` : 'Lieux'} à {district ?? 'Antananarivo'}
        </Text>
      </Container>

      {/* Filtres : défilement horizontal au doigt, retour à la ligne au pointeur. */}
      {isDesktop ? (
        <Container className="pt-5">
          <View className="flex-row flex-wrap gap-x-2 gap-y-3">{categoryChips}</View>
          <View className="mt-3 flex-row">{districtPicker}</View>
        </Container>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, flexShrink: 0 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 12 }}>
            {categoryChips}
          </ScrollView>
          <View className="flex-row px-5">{districtPicker}</View>
        </>
      )}

      {/* Tri */}
      <View className="mt-3 border-t border-ink-100 dark:border-white/10">
        <Container className="py-3">
          <View className="flex-row gap-2">
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
          </View>
        </Container>
      </View>

      {ranking.isPending ? (
        <LoadingState />
      ) : ranking.isError ? (
        <ErrorState onRetry={() => ranking.refetch()} />
      ) : (
        <FlatList
          // Changer le nombre de colonnes exige de remonter la liste.
          key={isDesktop ? 'grille' : 'liste'}
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={isDesktop ? 2 : 1}
          columnWrapperStyle={isDesktop ? { gap: 16 } : undefined}
          contentContainerStyle={{
            paddingBottom: 32,
            width: '100%',
            maxWidth: 1280,
            alignSelf: 'center',
            paddingHorizontal: isDesktop ? 20 : 0,
          }}
          showsVerticalScrollIndicator={false}
          // Page suivante un demi-écran avant la fin de la liste.
          onEndReached={() => {
            if (ranking.hasNextPage && !ranking.isFetchingNextPage) ranking.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          renderItem={({ item, index }) => (
            <View className={isDesktop ? 'flex-1' : undefined}>
              <PlaceRow
                place={item}
                distanceMeters={item.distance}
                rank={sort === 'rating' ? index + 1 : undefined}
              />
            </View>
          )}
          ListEmptyComponent={
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
          }
          ListFooterComponent={
            ranking.isFetchingNextPage ? (
              <LoadingState className="py-6" />
            ) : results.length > 0 && sort === 'rating' ? (
              <Text className="px-5 pt-4 text-center text-xs leading-4 text-ink-500 dark:text-ink-300">
                Le classement tient compte du nombre d&apos;avis : un lieu noté 5 par une seule
                personne ne devance pas un lieu noté 4,7 par deux cents.
              </Text>
            ) : null
          }
        />
      )}
    </Screen>
  );
}
