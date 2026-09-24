import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { CategoryTile } from '@/components/ui/category-chip';
import { Container } from '@/components/ui/container';
import { PlaceCard, PlaceRow } from '@/components/ui/place-card';
import { Screen } from '@/components/ui/screen';
import { SearchBar } from '@/components/ui/search-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { CATEGORIES } from '@/constants/categories';
import { PLACES, TANA_CENTER } from '@/data/mock';
import { useIsDesktop } from '@/hooks/use-breakpoint';
import { useColors } from '@/hooks/use-theme';
import { queryPlaces } from '@/lib/places';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDesktop = useIsDesktop();

  const topRated = useMemo(
    () => queryPlaces(PLACES, TANA_CENTER, { sort: 'rating' }).slice(0, 8),
    []
  );
  const nearby = useMemo(
    () => queryPlaces(PLACES, TANA_CENTER, { sort: 'distance' }).slice(0, 6),
    []
  );

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}>
        {/* En-tête mobile : sur desktop, la barre latérale porte déjà ville et profil. */}
        {!isDesktop && (
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
        )}

        {/* Accroche + recherche */}
        <Container className="pt-5 lg:pt-10">
          <Text className="text-[30px] font-bold leading-9 text-ink dark:text-white lg:text-[40px] lg:leading-[48px]">
            Quel service{'\n'}cherchez-vous ?
          </Text>
          <View className="mt-4 w-full max-w-xl lg:mt-6">
            <SearchBar onPress={() => router.push('/search')} />
          </View>
        </Container>

        {/* Catégories */}
        <Container className="mt-6 lg:mt-10">
          <View className="flex-row gap-3 lg:gap-4">
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
        </Container>

        {/* Les mieux notés — carrousel sur mobile, grille sur grand écran */}
        <View className="mt-8 lg:mt-12">
          <Container>
            <SectionHeader
              title="Les mieux notés"
              subtitle="Classement pondéré par le nombre d'avis"
              actionLabel="Tout voir"
              onAction={() => router.push('/explore')}
            />
          </Container>

          {isDesktop ? (
            <Container className="mt-4">
              <View className="-mx-2 flex-row flex-wrap">
                {topRated.map((place) => (
                  <View key={place.id} className="w-1/4 p-2 xl:w-1/5">
                    <PlaceCard place={place} distanceMeters={place.distance} width="fill" />
                  </View>
                ))}
              </View>
            </Container>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingTop: 14 }}>
              {topRated.map((place) => (
                <PlaceCard key={place.id} place={place} distanceMeters={place.distance} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Près de vous — une colonne sur mobile, deux sur grand écran */}
        <View className="mt-8 lg:mt-12">
          <Container>
            <SectionHeader title="Près de vous" subtitle="À moins de quelques minutes" />
          </Container>
          <Container padded={false} className="mt-2 px-1 lg:mt-4 lg:px-6">
            <View className="flex-row flex-wrap">
              {nearby.map((place) => (
                <View key={place.id} className="w-full lg:w-1/2 lg:px-2">
                  <PlaceRow place={place} distanceMeters={place.distance} />
                </View>
              ))}
            </View>
          </Container>
        </View>
      </ScrollView>
    </Screen>
  );
}
