import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/category-chip';
import { useIsDesktop } from '@/hooks/use-breakpoint';
import { useColors } from '@/hooks/use-theme';
import {
  PLACE_REPORT_REASONS,
  REVIEW_REPORT_REASONS,
  type ReportReason,
} from '@/lib/reports';
import { supabase } from '@/lib/supabase';
import { cn, noWebOutline } from '@/lib/utils';

export type ReportTarget =
  | { kind: 'place'; placeId: string }
  | { kind: 'review'; placeId: string; reviewId: string };

type ReportSheetProps = {
  target: ReportTarget | null;
  onClose: () => void;
};

/** Code Postgres « violation d'unicité » : le signalement ouvert existe déjà. */
const UNIQUE_VIOLATION = '23505';

/**
 * Signaler un lieu (fermé, erroné, doublon) ou un avis (insultant, faux, hors sujet).
 * Rien n'est retiré automatiquement : un modérateur examine chaque signalement.
 */
export function ReportSheet({ target, onClose }: ReportSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDesktop = useIsDesktop();
  const queryClient = useQueryClient();

  const [reason, setReason] = useState<ReportReason | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const isReview = target?.kind === 'review';
  const reasons = isReview ? REVIEW_REPORT_REASONS : PLACE_REPORT_REASONS;

  function close() {
    onClose();
    // Après l'animation de fermeture, pour ne pas voir le formulaire se vider.
    setTimeout(() => {
      setReason(null);
      setComment('');
      setError(null);
      setSent(false);
    }, 300);
  }

  async function submit() {
    if (!target || !reason) return;

    setBusy(true);
    setError(null);
    const { error } = await supabase.from('reports').insert({
      place_id: target.placeId,
      review_id: target.kind === 'review' ? target.reviewId : null,
      reason,
      comment: comment.trim() || null,
    });
    setBusy(false);

    if (error) {
      setError(
        error.code === UNIQUE_VIOLATION
          ? `Vous avez déjà signalé ${isReview ? 'cet avis' : 'ce lieu'} : un modérateur va l'examiner.`
          : "Le signalement n'a pas pu être envoyé. Vérifiez votre connexion et réessayez."
      );
      return;
    }

    // Les modérateurs voient la file se remplir dès leur prochain passage.
    queryClient.invalidateQueries({ queryKey: ['moderation'] });
    setSent(true);
  }

  return (
    <Modal
      visible={target !== null}
      transparent
      animationType={isDesktop ? 'fade' : 'slide'}
      onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        className={cn('flex-1 bg-black/50', isDesktop ? 'items-center justify-center p-6' : 'justify-end')}>
        <Pressable className="absolute inset-0" onPress={close} accessibilityLabel="Fermer" />

        <View
          style={{ paddingBottom: isDesktop ? 0 : insets.bottom }}
          className={cn(
            'overflow-hidden bg-surface dark:bg-surface-dark',
            isDesktop ? 'max-h-full w-full max-w-md rounded-2xl' : 'max-h-[90%] rounded-t-3xl'
          )}>
          <View className="flex-row items-center justify-between px-5 pb-2 pt-5">
            <Text className="text-lg font-bold text-ink dark:text-white">
              {isReview ? 'Signaler cet avis' : 'Signaler ce lieu'}
            </Text>
            <Pressable
              onPress={close}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              className="h-9 w-9 items-center justify-center rounded-full active:opacity-60 hover:bg-ink-50 dark:hover:bg-white/10">
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {sent ? (
            <View className="items-center px-6 pb-8 pt-4">
              <Ionicons name="checkmark-circle-outline" size={44} color={colors.brand} />
              <Text className="mt-3 text-center text-base font-semibold text-ink dark:text-white">
                Merci pour votre signalement
              </Text>
              <Text className="mt-1.5 text-center text-sm leading-5 text-ink-500 dark:text-ink-300">
                Un modérateur va l&apos;examiner. Rien n&apos;est retiré automatiquement.
              </Text>
              <Button label="Fermer" variant="outline" className="mt-6" onPress={close} />
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 8 }}>
              <Text className="text-sm text-ink-500 dark:text-ink-300">Quel est le problème ?</Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {reasons.map((item) => (
                  <Chip
                    key={item.value}
                    label={item.label}
                    selected={reason === item.value}
                    onPress={() => setReason(item.value)}
                  />
                ))}
              </View>

              <Text className="mt-6 text-sm font-semibold text-ink dark:text-white">
                Précisions{' '}
                <Text className="font-normal text-ink-500 dark:text-ink-300">(facultatif)</Text>
              </Text>
              <TextInput
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                maxLength={500}
                placeholder={
                  isReview
                    ? 'Ce qui pose problème dans cet avis…'
                    : 'Par exemple : remplacé par un autre commerce, nouvelle adresse…'
                }
                placeholderTextColor={colors.textFaint}
                textAlignVertical="top"
                className="mt-2 min-h-24 rounded-card border border-ink-100 p-4 text-base leading-5 text-ink focus:border-brand-500 dark:border-white/10 dark:text-white"
                style={noWebOutline}
              />

              <Button
                label="Envoyer le signalement"
                fullWidth
                loading={busy}
                disabled={!reason}
                className="mt-5"
                onPress={submit}
              />
              {error && (
                <Text className="mt-3 text-center text-sm text-red-600 dark:text-red-400">{error}</Text>
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
