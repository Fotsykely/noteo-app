import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { CategoryTile } from '@/components/ui/category-chip';
import { PlaceCard, PlaceRow } from '@/components/ui/place-card';
import { Screen } from '@/components/ui/screen';
import { SearchBar } from '@/components/ui/search-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { CATEGORIES } from '@/constants/categories';
import { PLACES, TANA_CENTER } from '@/data/mock';
import { useColors } from '@/hooks/use-theme';
import { queryPlaces } from '@/lib/places';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();

  const topRated = useMemo(
    () => queryPlaces(PLACES, TANA_CENTER, { sort: 'rating' }).slice(0, 8),
    []
  );
  const nearby = useMemo(
    () => queryPlaces(PLACES, TANA_CENTER, { sort: 'distance' }).slice(0, 5),
    []
  );

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}>
        {/* En-tête : ville active */}
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Pressable
            className="flex-row items-center gap-1.5 active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel="Changer de ville">
            <Ionicons name="location" size={16} color={colors.brand} />
            <Text className="text-sm font-semibold text-ink dark:text-white">Antananarivo</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/profile')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Mon profil">
            <Ionicons name="person-circle-outline" size={28} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Accroche + recherche */}
        <View className="px-5 pt-5">
          <Text className="text-[30px] font-bold leading-9 text-ink dark:text-white">
            Quel service{'\n'}cherchez-vous ?
          </Text>
          <SearchBar className="mt-4" onPress={() => router.push('/search')} />
        </View>

        {/* Catégories */}
        <View className="mt-6 flex-row gap-3 px-5">
          {CATEGORIES.map((category) => (
            <CategoryTile
              key={category.slug}
              label={category.nameFr}
              icon={category.icon}
              tint={category.tint}
              count={PLACES.filter((place) => place.categorySlug === category.slug).length}
              onPress={() => router.push(`/explore?category=${category.slug}`)}
            />
          ))}
        </View>

        {/* Les mieux notés */}
        <View className="mt-8">
          <SectionHeader
            title="Les mieux notés"
            subtitle="Classement pondéré par le nombre d'avis"
            actionLabel="Tout voir"
            onAction={() => router.push('/explore')}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingTop: 14 }}>
            {topRated.map((place) => (
              <PlaceCard key={place.id} place={place} distanceMeters={place.distance} />
            ))}
          </ScrollView>
        </View>

        {/* Près de vous */}
        <View className="mt-8">
          <SectionHeader title="Près de vous" subtitle="À moins de quelques minutes" />
          <View className="mt-2 px-1">
            {nearby.map((place) => (
              <PlaceRow key={place.id} place={place} distanceMeters={place.distance} />
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
