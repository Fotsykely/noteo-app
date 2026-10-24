import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Screen } from '@/components/ui/screen';
import { useModerationQueue } from '@/hooks/use-moderation';
import { useIsModerator } from '@/hooks/use-role';
import { useColors } from '@/hooks/use-theme';
import { signOut, useSession } from '@/lib/session';
import type { IoniconName } from '@/types';
import { showScrollbar } from '@/lib/utils';

function Row({
  icon,
  label,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  onPress?: () => void;
}) {
  const colors = useColors();

  // Pas d'action branchée : on le dit, au lieu d'un clic qui ne fait rien.
  if (!onPress) {
    return (
      <View className="flex-row items-center gap-3 px-5 py-4">
        <Ionicons name={icon} size={20} color={colors.textFaint} />
        <Text className="flex-1 text-base text-ink-500 dark:text-ink-300">{label}</Text>
        <View className="rounded-pill bg-ink-100 px-2.5 py-1 dark:bg-white/10">
          <Text className="text-[11px] font-semibold text-ink-700 dark:text-ink-300">Bientôt</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-xl px-5 py-4 hover:bg-ink-50 active:bg-ink-100 dark:hover:bg-white/5 dark:active:bg-white/10 web:transition-colors web:duration-150">
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <Text className="flex-1 text-base text-ink dark:text-white">{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useSession();
  const isModerator = useIsModerator();
  const queue = useModerationQueue();
  const toReview = queue.data?.length ?? 0;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={showScrollbar}>
        <Container className="pb-4 pt-2 lg:pt-8">
          <Text className="text-[28px] font-bold text-ink dark:text-white lg:text-[36px]">
            Profil
          </Text>
        </Container>

        {user ? (
          <Container>
            <View className="flex-row items-center gap-4 pb-6">
              <Avatar initials={user.initials} size="lg" />
              <View className="flex-1">
                <Text className="text-lg font-semibold text-ink dark:text-white">{user.name}</Text>
                <Text className="text-sm text-ink-500 dark:text-ink-300">{user.email}</Text>
              </View>
            </View>
          </Container>
        ) : (
          <Container>
            <View className="mb-6 w-full max-w-2xl self-center rounded-card border border-ink-100 p-6 dark:border-white/10">
              <Text className="text-center text-lg font-semibold text-ink dark:text-white">
                Rejoignez Noteo
              </Text>
              <Text className="mt-1.5 text-center text-sm leading-5 text-ink-500 dark:text-ink-300">
                La consultation est libre. Un compte n&apos;est nécessaire que pour publier un avis.
              </Text>
              <Button
                label="Se connecter"
                fullWidth
                className="mt-5"
                onPress={() => router.push('/auth/sign-in')}
              />
            </View>
          </Container>
        )}

        {/* Déconnecté : seule la carte de connexion s'affiche. */}
        {user ? (
          <>
            {/* `Row` porte déjà son px-5 : le conteneur n'ajoute une marge que sur grand
                écran, pour aligner les lignes sur le titre. */}
            <Container padded={false} className="lg:px-3">
              <View className="w-full max-w-[760px] border-t border-ink-100 py-1 dark:border-white/10">
                <Row icon="star-outline" label="Mes avis" />
                <Row icon="bookmark-outline" label="Mes favoris" />
                <Row icon="add-circle-outline" label="Lieux que j'ai ajoutés" />
                {isModerator && (
                  <Row
                    icon="flag-outline"
                    label={toReview > 0 ? `Modération (${toReview})` : 'Modération'}
                    onPress={() => router.push('/moderation')}
                  />
                )}
              </View>
            </Container>

            <Container padded={false} className="mt-2 lg:px-3">
              <View className="w-full max-w-[760px] border-t border-ink-100 py-1 dark:border-white/10">
                <Row icon="language-outline" label="Langue — Français" />
                <Row icon="shield-checkmark-outline" label="Règles de publication" />
                <Row icon="information-circle-outline" label="À propos de Noteo" />
              </View>
            </Container>

            <Container className="pt-6">
              <View className="w-full max-w-xs">
                <Button label="Se déconnecter" variant="outline" fullWidth onPress={signOut} />
              </View>
            </Container>
          </>
        ) : null}

        {/* Attribution exigée par la licence ODbL : le catalogue vient d'OpenStreetMap. */}
        <Text className="px-5 py-8 text-center text-xs leading-5 text-ink-500 dark:text-ink-300">
          Noteo — version 1.0.0{'\n'}Données des lieux © les contributeurs d&apos;OpenStreetMap
        </Text>
      </ScrollView>
    </Screen>
  );
}
