import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/query-state';
import { StarInput } from '@/components/ui/star-rating';
import { CATEGORY_BY_SLUG } from '@/constants/categories';
import { getVisitPosition } from '@/hooks/use-location';
import { useMyReview, usePlace } from '@/hooks/use-places';
import { useColors } from '@/hooks/use-theme';
import { ON_SITE_RADIUS_M, REQUIRED_ON_SITE_REVIEWS } from '@/lib/places';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { noWebOutline } from '@/lib/utils';
import type { Json } from '@/types/database';

const RATING_LABELS = ['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent'];

export default function NewReviewScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const router = useRouter();
  const colors = useColors();
  const user = useSession();
  const queryClient = useQueryClient();

  const { data: place, isPending } = usePlace(placeId);
  const { data: myReview } = useMyReview(placeId, user?.id);
  const [rating, setRating] = useState(0);
  const [criteria, setCriteria] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState<'locating' | 'saving' | null>(null);
  const [error, setError] = useState<string | null>(null);
  // État d'avant l'envoi : le lieu est rechargé ensuite, il faut savoir ce qui a changé.
  const [result, setResult] = useState<{
    onSite: boolean;
    hadPosition: boolean;
    wasPending: boolean;
    wasUpdate: boolean;
  } | null>(null);

  // Un seul avis par lieu : s'il existe, le formulaire le reprend pour le modifier
  // (ajustement pendant le rendu, une seule fois par avis).
  const [prefilledId, setPrefilledId] = useState<string | null>(null);
  if (myReview && prefilledId !== myReview.id) {
    setPrefilledId(myReview.id);
    setRating(myReview.rating);
    setComment(myReview.comment ?? '');
    const saved = myReview.criteria;
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      setCriteria(Object.fromEntries(Object.entries(saved).map(([key, value]) => [key, Number(value)])));
    }
  }

  if (isPending) {
    return (
      <View className="flex-1 justify-center bg-surface dark:bg-surface-dark">
        <LoadingState />
      </View>
    );
  }

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
  const canSubmit = rating > 0 && busy === null;

  async function submit() {
    if (!user || !place) {
      router.push('/auth/sign-in');
      return;
    }
    setError(null);
    const wasPending = place.status === 'pending';

    // La base vérifie si l'avis est donné sur place, puis efface ces coordonnées.
    setBusy('locating');
    const visit = await getVisitPosition();

    setBusy('saving');
    const fields = {
      rating,
      comment: comment.trim() || null,
      criteria: criteria as Json,
      visit_lat: visit?.lat ?? null,
      visit_lng: visit?.lng ?? null,
    };
    const { data, error } = myReview
      ? await supabase.from('reviews').update(fields).eq('id', myReview.id).select('on_site').single()
      : await supabase
          .from('reviews')
          .insert({ ...fields, place_id: place.id })
          .select('on_site')
          .single();
    setBusy(null);

    if (error || !data) {
      setError("Votre avis n'a pas pu être enregistré. Vérifiez votre connexion et réessayez.");
      return;
    }

    // Note moyenne, compteur « sur place », statut du lieu : tout a pu changer.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['place', place.id] }),
      queryClient.invalidateQueries({ queryKey: ['reviews', place.id] }),
      queryClient.invalidateQueries({ queryKey: ['my-review', place.id] }),
      queryClient.invalidateQueries({ queryKey: ['places'] }),
    ]);
    setResult({ onSite: data.on_site, hadPosition: visit !== null, wasPending, wasUpdate: !!myReview });
  }

  if (result) {
    const message = !result.wasPending
      ? 'Merci, votre avis est publié.'
      : place.status === 'published'
        ? 'Grâce à votre avis, le lieu est confirmé : il apparaît désormais dans les classements.'
        : result.onSite
          ? `Votre avis compte pour confirmer ce lieu : ${Math.min(place.onSiteCount, REQUIRED_ON_SITE_REVIEWS)}/${REQUIRED_ON_SITE_REVIEWS} avis donnés sur place.`
          : result.hadPosition
            ? `Votre avis est publié. Vous sembliez à plus de ${ON_SITE_RADIUS_M} m du lieu : il ne compte pas pour le confirmer.`
            : "Votre avis est publié. Votre position n'a pas pu être vérifiée : il ne compte donc pas pour confirmer le lieu.";

    return (
      <View className="flex-1 bg-surface dark:bg-surface-dark">
        <EmptyState
          icon="checkmark-circle-outline"
          title={result.wasUpdate ? 'Avis mis à jour' : 'Merci pour votre avis'}
          description={message}
          actionLabel="Terminer"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface dark:bg-surface-dark"
      behavior={Platform.select({ ios: 'padding', default: undefined })}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          width: '100%',
          maxWidth: 680,
          alignSelf: 'center',
        }}>
        <Text className="text-2xl font-bold text-ink dark:text-white">{place.name}</Text>
        <Text className="mt-1 text-sm text-ink-500 dark:text-ink-300">
          {place.subcategory ?? category.nameFr} · {place.district}
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
          className="mt-3 min-h-32 rounded-card border border-ink-100 focus:border-brand-500 p-4 text-base leading-5 text-ink dark:border-white/10 dark:text-white"
        style={noWebOutline}
        />
        <Text className="mt-1.5 text-right text-xs text-ink-300 dark:text-ink-500">
          {comment.length}/800
        </Text>

        {/* Photos */}
        <View className="mt-6 flex-row items-center gap-3 rounded-card border border-dashed border-ink-200 p-4 dark:border-white/20">
          <Ionicons name="camera-outline" size={20} color={colors.textMuted} />
          <Text className="flex-1 text-sm text-ink-500 dark:text-ink-300">
            Ajouter des photos — bientôt disponible
          </Text>
        </View>

        <Button
          label={
            !user
              ? 'Se connecter pour publier'
              : busy === 'locating'
                ? 'Vérification de votre position…'
                : myReview
                  ? 'Mettre à jour mon avis'
                  : 'Publier mon avis'
          }
          fullWidth
          loading={busy !== null}
          disabled={!canSubmit}
          className="mt-8"
          onPress={submit}
        />
        {error && (
          <Text className="mt-4 text-center text-sm text-red-600 dark:text-red-400">{error}</Text>
        )}
        <Text className="mt-3 text-center text-xs leading-4 text-ink-500 dark:text-ink-300">
          Un seul avis par personne et par lieu. Les avis sont publics et modérés. Votre position
          sert seulement à vérifier que vous êtes sur place ; elle n&apos;est pas conservée.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
