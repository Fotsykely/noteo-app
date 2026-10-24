import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { CategoryTile } from '@/components/ui/category-chip';
import { Container } from '@/components/ui/container';
import { PlaceCard, PlaceRow } from '@/components/ui/place-card';
import { ErrorState, LoadingState } from '@/components/ui/query-state';
import { Screen } from '@/components/ui/screen';
import { SearchBar } from '@/components/ui/search-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { CATEGORIES } from '@/constants/categories';
import { useIsDesktop } from '@/hooks/use-breakpoint';
import { useEnableLocation, useLocation } from '@/hooks/use-location';
import { useCategoryCounts, useNearbyPlaces } from '@/hooks/use-places';
import { useColors } from '@/hooks/use-theme';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDesktop = useIsDesktop();

  const location = useLocation();
  const enableLocation = useEnableLocation();
  const topRated = useNearbyPlaces({ sort: 'rating' }, { limit: 8 });
  // « Près de vous » n'a de sens qu'avec la position réelle de l'appareil.
  const hasPosition = location?.source === 'device';
  const nearby = useNearbyPlaces(
    { sort: 'distance', includePending: true },
    { limit: 6, enabled: hasPosition }
  );
  const counts = useCategoryCounts();

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
                count={counts.data?.[category.slug]}
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

          {topRated.isPending ? (
            <LoadingState className="h-56" />
          ) : topRated.isError ? (
            <ErrorState onRetry={() => topRated.refetch()} />
          ) : isDesktop ? (
            <Container className="mt-4">
              <View className="-mx-2 flex-row flex-wrap">
                {topRated.data.map((place) => (
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
              {topRated.data.map((place) => (
                <PlaceCard key={place.id} place={place} distanceMeters={place.distance} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Près de vous — une colonne sur mobile, deux sur grand écran.
            Sans position réelle, ni lieux ni distances : on invite à activer la localisation. */}
        <View className="mt-8 lg:mt-12">
          <Container>
            <SectionHeader
              title="Près de vous"
              subtitle={hasPosition ? 'Autour de votre position' : undefined}
            />
          </Container>

          {!hasPosition ? (
            location && (
              <Container className="mt-3">
                <View className="flex-row items-center gap-3 rounded-card bg-ink-50 p-3 dark:bg-white/5">
                  <Ionicons name="location-outline" size={18} color={colors.textMuted} />
                  <Text className="flex-1 text-xs leading-4 text-ink-700 dark:text-ink-300">
                    {location.source === 'outside'
                      ? "Vous semblez hors d'Antananarivo : les lieux proches ne sont pas disponibles."
                      : 'Activez la localisation pour voir les lieux près de vous.'}
                  </Text>
                  {location.source === 'denied' && (
                    <Pressable
                      onPress={enableLocation}
                      accessibilityRole="button"
                      hitSlop={8}
                      className="active:opacity-60">
                         <Text className="text-sm font-semibold text-brand-500">Activer</Text>
                    </Pressable>
                  )}
                </View>
              </Container>
            )
          ) : nearby.isPending ? (
            <LoadingState />
          ) : nearby.isError ? (
            <ErrorState onRetry={() => nearby.refetch()} />
          ) : (
            <Container padded={false} className="mt-2 px-1 lg:mt-4 lg:px-6">
              <View className="flex-row flex-wrap">
                {nearby.data.map((place) => (
                  <View key={place.id} className="w-full lg:w-1/2 lg:px-2">
                    <PlaceRow place={place} distanceMeters={place.distance} />
                  </View>
                ))}
              </View>
            </Container>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
