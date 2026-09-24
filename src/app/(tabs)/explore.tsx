import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';

import { Chip } from '@/components/ui/category-chip';
import { EmptyState } from '@/components/ui/empty-state';
import { PlaceRow } from '@/components/ui/place-card';
import { Screen } from '@/components/ui/screen';
import { CATEGORIES, DISTRICTS } from '@/constants/categories';
import { PLACES, TANA_CENTER } from '@/data/mock';
import { queryPlaces, type SortMode } from '@/lib/places';
import type { CategorySlug } from '@/types';

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();

  const [category, setCategory] = useState<CategorySlug | null>(
    (params.category as CategorySlug) ?? null
  );
  const [district, setDistrict] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>('rating');

  const results = useMemo(
    () => queryPlaces(PLACES, TANA_CENTER, { categorySlug: category, district, sort }),
    [category, district, sort]
  );

  return (
    <Screen>
      <View className="px-5 pb-1 pt-2">
        <Text className="text-[28px] font-bold text-ink dark:text-white">Classements</Text>
        <Text className="mt-1 text-sm text-ink-500 dark:text-ink-300">
          {results.length} lieux à Antananarivo
        </Text>
      </View>

      {/* Filtre catégorie */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 12 }}>
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
      </ScrollView>

      {/* Filtre quartier */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
        <Chip label="Tous quartiers" selected={district === null} onPress={() => setDistrict(null)} />
        {DISTRICTS.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={district === item}
            onPress={() => setDistrict(district === item ? null : item)}
          />
        ))}
      </ScrollView>

      {/* Tri */}
      <View className="flex-row gap-2 border-t border-ink-100 px-5 py-3 dark:border-white/10">
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

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <PlaceRow
            place={item}
            distanceMeters={item.distance}
            rank={sort === 'rating' ? index + 1 : undefined}
          />
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
