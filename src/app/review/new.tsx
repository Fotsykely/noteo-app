import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StarInput } from '@/components/ui/star-rating';
import { CATEGORY_BY_SLUG } from '@/constants/categories';
import { getPlace } from '@/data/mock';
import { useColors } from '@/hooks/use-theme';
import { useSession } from '@/lib/session';

const RATING_LABELS = ['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent'];

export default function NewReviewScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const router = useRouter();
  const colors = useColors();
  const user = useSession();

  const place = useMemo(() => getPlace(placeId), [placeId]);
  const [rating, setRating] = useState(0);
  const [criteria, setCriteria] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');

  if (!place) {
    return (
      <View className="flex-1 bg-surface dark:bg-surface-dark">
        <EmptyState
          icon="alert-circle-outline"
          title="Lieu introuvable"
          actionLabel="Fermer"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const category = CATEGORY_BY_SLUG[place.categorySlug];
  const canSubmit = rating > 0;

  function submit() {
    if (!user) {
      router.push('/auth/sign-in');
      return;
    }
    // À l'Étape 5, cet appel devient une insertion Supabase.
    Alert.alert(
      'Avis enregistré',
      "L'envoi réel sera branché sur Supabase à l'Étape 5.",
      [{ text: 'OK', onPress: () => router.back() }]
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface dark:bg-surface-dark"
      behavior={Platform.select({ ios: 'padding', default: undefined })}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text className="text-2xl font-bold text-ink dark:text-white">{place.name}</Text>
        <Text className="mt-1 text-sm text-ink-500 dark:text-ink-300">
          {place.subcategory} · {place.district}
        </Text>

        {/* Note globale */}
        <View className="mt-7 items-center rounded-card border border-ink-100 py-7 dark:border-white/10">
          <Text className="text-sm text-ink-500 dark:text-ink-300">Votre note globale</Text>
          <View className="mt-3">
            <StarInput value={rating} onChange={setRating} />
          </View>
          <Text className="mt-3 h-5 text-sm font-semibold text-ink dark:text-white">
            {RATING_LABELS[rating] ?? ''}
          </Text>
        </View>

        {/* Critères du métier */}
        <Text className="mt-8 text-base font-bold text-ink dark:text-white">
          Précisez (facultatif)
        </Text>
        <View className="mt-3 gap-4">
          {category.criteria.map((criterion) => (
            <View
              key={criterion.slug}
              className="flex-row items-center justify-between rounded-card border border-ink-100 px-4 py-3 dark:border-white/10">
              <Text className="flex-1 text-sm text-ink-700 dark:text-ink-200" numberOfLines={2}>
                {criterion.labelFr}
              </Text>
              <StarInput
                size="lg"
                value={criteria[criterion.slug] ?? 0}
                onChange={(value) => setCriteria((prev) => ({ ...prev, [criterion.slug]: value }))}
              />
            </View>
          ))}
        </View>

        {/* Commentaire */}
        <Text className="mt-8 text-base font-bold text-ink dark:text-white">Votre commentaire</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={5}
          maxLength={800}
          placeholder="Racontez votre expérience : ce qui vous a plu, ce qui a manqué…"
          placeholderTextColor={colors.textFaint}
          textAlignVertical="top"
          className="mt-3 min-h-32 rounded-card border border-ink-100 p-4 text-base leading-5 text-ink dark:border-white/10 dark:text-white"
        />
        <Text className="mt-1.5 text-right text-xs text-ink-300 dark:text-ink-500">
          {comment.length}/800
        </Text>

        {/* Photos */}
        <View className="mt-6 flex-row items-center gap-3 rounded-card border border-dashed border-ink-200 p-4 dark:border-white/20">
          <Ionicons name="camera-outline" size={20} color={colors.textMuted} />
          <Text className="flex-1 text-sm text-ink-500 dark:text-ink-300">
            Ajouter des photos — disponible à l&apos;Étape 5
          </Text>
        </View>

        <Button
          label={user ? 'Publier mon avis' : 'Se connecter pour publier'}
          fullWidth
          disabled={!canSubmit}
          className="mt-8"
          onPress={submit}
        />
        <Text className="mt-3 text-center text-xs leading-4 text-ink-500 dark:text-ink-300">
          Un seul avis par personne et par lieu. Les avis sont publics et modérés.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
