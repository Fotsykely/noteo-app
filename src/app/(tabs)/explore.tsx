import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';

import { Chip } from '@/components/ui/category-chip';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { PlaceRow } from '@/components/ui/place-card';
import { Screen } from '@/components/ui/screen';
import { CATEGORIES, DISTRICTS } from '@/constants/categories';
import { PLACES, TANA_CENTER } from '@/data/mock';
import { useIsDesktop } from '@/hooks/use-breakpoint';
import { queryPlaces, type SortMode } from '@/lib/places';
import type { CategorySlug } from '@/types';

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const isDesktop = useIsDesktop();

  const [category, setCategory] = useState<CategorySlug | null>(
    (params.category as CategorySlug) ?? null
  );
  const [district, setDistrict] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>('rating');

  const results = useMemo(
    () => queryPlaces(PLACES, TANA_CENTER, { categorySlug: category, district, sort }),
    [category, district, sort]
  );

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

  const districtChips = (
    <>
      <Chip label="Tous quartiers" selected={district === null} onPress={() => setDistrict(null)} />
      {DISTRICTS.map((item) => (
        <Chip
          key={item}
          label={item}
          selected={district === item}
          onPress={() => setDistrict(district === item ? null : item)}
        />
      ))}
    </>
  );

  return (
    <Screen>
      <Container className="pb-1 pt-2 lg:pt-8">
        <Text className="text-[28px] font-bold text-ink dark:text-white lg:text-[36px]">
          Classements
        </Text>
        <Text className="mt-1 text-sm text-ink-500 dark:text-ink-300">
          {results.length} lieux à Antananarivo
        </Text>
      </Container>

      {/* Filtres : défilement horizontal au doigt, retour à la ligne au pointeur. */}
      {isDesktop ? (
        <Container className="pt-5">
          <View className="flex-row flex-wrap gap-x-2 gap-y-3">{categoryChips}</View>
          <View className="mt-3 flex-row flex-wrap gap-x-2 gap-y-3">{districtChips}</View>
        </Container>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 12 }}>
            {categoryChips}
          </ScrollView>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
            {districtChips}
          </ScrollView>
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
            <Chip
              label="Plus proches"
              icon="navigate-outline"
              selected={sort === 'distance'}
              onPress={() => setSort('distance')}
            />
          </View>
        </Container>
      </View>

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
          results.length > 0 ? (
            <Text className="px-5 pt-4 text-center text-xs leading-4 text-ink-500 dark:text-ink-300">
              Le classement tient compte du nombre d&apos;avis : un lieu noté 5 par une seule
              personne ne devance pas un lieu noté 4,7 par deux cents.
            </Text>
          ) : null
        }
      />
    </Screen>
  );
}
