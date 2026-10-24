import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState, LoadingState } from '@/components/ui/query-state';
import { StarRating } from '@/components/ui/star-rating';
import { CATEGORY_BY_SLUG } from '@/constants/categories';
import {
  type QueueItem,
  useDismissReports,
  useModeratePlace,
  useModerateReview,
  useModerationQueue,
} from '@/hooks/use-moderation';
import { useIsModerator } from '@/hooks/use-role';
import { summarizeReasons } from '@/lib/reports';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/utils';
import type { CategorySlug } from '@/types';

type Tone = 'neutral' | 'danger';

/**
 * Bouton compact. Une action destructrice demande une seconde pression (« Confirmer ? »),
 * car `Alert.alert` ne fait rien sur le web.
 */
function ActionButton({
  label,
  onPress,
  tone = 'neutral',
  confirm = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  tone?: Tone;
  confirm?: boolean;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);

  // Sans seconde pression, l'action est désarmée au bout de quelques secondes.
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  function press() {
    if (confirm && !armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    onPress();
  }

  return (
    <Pressable
      onPress={press}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={cn(
        'h-10 items-center justify-center rounded-pill border px-4',
        armed
          ? 'border-red-600 bg-red-600'
          : tone === 'danger'
            ? 'border-red-300 active:bg-red-50 dark:border-red-500/50 dark:active:bg-red-500/10'
            : 'border-ink-200 active:bg-ink-50 dark:border-white/20 dark:active:bg-white/10',
        disabled && 'opacity-50'
      )}>
      <Text
        className={cn(
          'text-sm font-semibold',
          armed
            ? 'text-white'
            : tone === 'danger'
              ? 'text-red-700 dark:text-red-400'
              : 'text-ink dark:text-white'
        )}>
        {armed ? 'Confirmer ?' : label}
      </Text>
    </Pressable>
  );
}

const KIND_LABEL: Record<QueueItem['kind'], string> = {
  place_report: 'Lieu signalé',
  review_report: 'Avis signalé',
  place_pending: 'Lieu proposé sans position',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'à confirmer',
  closed: 'fermé',
  rejected: 'retiré',
};

function QueueCard({
  item,
  busy,
  onError,
}: {
  item: QueueItem;
  busy: boolean;
  onError: (message: string | null) => void;
}) {
  const router = useRouter();
  const moderatePlace = useModeratePlace();
  const moderateReview = useModerateReview();
  const dismiss = useDismissReports();

  const category = CATEGORY_BY_SLUG[item.categorySlug as CategorySlug];
  const disabled = busy || moderatePlace.isPending || moderateReview.isPending || dismiss.isPending;
  const fail = () => onError("L'action n'a pas abouti. Vérifiez votre connexion et réessayez.");

  const setStatus = (status: 'closed' | 'rejected') => {
    onError(null);
    moderatePlace.mutate({ placeId: item.placeId, status }, { onError: fail });
  };
  const ignore = () => {
    onError(null);
    dismiss.mutate({ placeId: item.placeId, reviewId: item.reviewId }, { onError: fail });
  };

  return (
    <View className="rounded-card border border-ink-100 p-4 dark:border-white/10">
      <Text className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-300">
        {KIND_LABEL[item.kind]}
      </Text>

      <Pressable
        onPress={() => router.push(`/place/${item.placeId}`)}
        accessibilityRole="button"
        className="mt-1 active:opacity-70">
        <Text className="text-base font-semibold text-ink dark:text-white">{item.placeName}</Text>
        <Text className="mt-0.5 text-xs text-ink-500 dark:text-ink-300">
          {category?.nameFr ?? item.categorySlug} · {item.district}
          {STATUS_LABEL[item.placeStatus] ? ` · ${STATUS_LABEL[item.placeStatus]}` : ''}
        </Text>
      </Pressable>

      {item.kind === 'review_report' && (
        <View className="mt-3 rounded-xl bg-ink-50 p-3 dark:bg-white/5">
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 text-sm font-semibold text-ink dark:text-white" numberOfLines={1}>
              {item.reviewAuthor}
            </Text>
            {item.reviewRating !== null && <StarRating value={item.reviewRating} size="sm" />}
          </View>
          <Text className="mt-1.5 text-sm leading-5 text-ink-700 dark:text-ink-200">
            {item.reviewComment ?? '(avis sans commentaire)'}
          </Text>
          {item.reviewHidden && (
            <Text className="mt-1.5 text-xs font-semibold text-red-700 dark:text-red-400">
              Déjà masqué
            </Text>
          )}
        </View>
      )}

      {item.reportCount > 0 && (
        <View className="mt-3">
          <Text className="text-sm font-semibold text-ink dark:text-white">
            {item.reportCount} signalement{item.reportCount > 1 ? 's' : ''}
            <Text className="font-normal text-ink-500 dark:text-ink-300">
              {' · '}
              {summarizeReasons(item.reasons)}
            </Text>
          </Text>
          {item.comments.map((comment, index) => (
            <Text key={index} className="mt-1 text-sm italic leading-5 text-ink-700 dark:text-ink-300">
              « {comment} »
            </Text>
          ))}
        </View>
      )}

      {item.kind === 'place_pending' && (
        <Text className="mt-3 text-sm leading-5 text-ink-500 dark:text-ink-300">
          Ce lieu n&apos;a pas de position : ajoutez-la depuis « Corriger la fiche » pour qu&apos;il puisse
          être confirmé, ou refusez-le.
        </Text>
      )}

      <View className="mt-4 flex-row flex-wrap gap-2">
        {item.kind === 'review_report' ? (
          <ActionButton
            label={item.reviewHidden ? 'Rétablir l’avis' : 'Masquer l’avis'}
            tone={item.reviewHidden ? 'neutral' : 'danger'}
            confirm={!item.reviewHidden}
            disabled={disabled}
            onPress={() => {
              onError(null);
              moderateReview.mutate(
                { reviewId: item.reviewId!, placeId: item.placeId, hidden: !item.reviewHidden },
                { onError: fail }
              );
            }}
          />
        ) : (
          <>
            <ActionButton
              label="Corriger la fiche"
              disabled={disabled}
              onPress={() => router.push(`/place/new?id=${item.placeId}`)}
            />
            {item.kind === 'place_report' && (
              <ActionButton label="Marquer fermé" tone="danger" confirm disabled={disabled} onPress={() => setStatus('closed')} />
            )}
            <ActionButton
              label={item.kind === 'place_pending' ? 'Refuser' : 'Retirer'}
              tone="danger"
              confirm
              disabled={disabled}
              onPress={() => setStatus('rejected')}
            />
          </>
        )}
        {item.kind !== 'place_pending' && (
          <ActionButton label="Ignorer" disabled={disabled} onPress={ignore} />
        )}
      </View>
    </View>
  );
}

export default function ModerationScreen() {
  const router = useRouter();
  const user = useSession();
  const isModerator = useIsModerator();
  const queue = useModerationQueue();
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <View className="flex-1 bg-surface dark:bg-surface-dark">
        <EmptyState
          icon="person-circle-outline"
          title="Connectez-vous"
          description="La modération est réservée aux administrateurs et aux modérateurs."
          actionLabel="Se connecter"
          onAction={() => router.push('/auth/sign-in')}
        />
      </View>
    );
  }

  if (!isModerator) {
    return (
      <View className="flex-1 bg-surface dark:bg-surface-dark">
        <EmptyState
          icon="lock-closed-outline"
          title="Réservé aux modérateurs"
          description="Seuls les administrateurs et les modérateurs voient cet écran."
          actionLabel="Retour"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      {queue.isPending ? (
        <LoadingState />
      ) : queue.isError ? (
        <ErrorState onRetry={() => queue.refetch()} />
      ) : (
        <FlatList
          data={queue.data}
          keyExtractor={(item) => item.key}
          refreshing={queue.isRefetching}
          onRefresh={() => queue.refetch()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListHeaderComponent={
            <Container className="pb-3">
              {queue.data.length > 0 && (
                <Text className="text-sm text-ink-500 dark:text-ink-300">
                  {queue.data.length} à traiter, les plus signalés d&apos;abord. Aucun retrait
                  n&apos;est automatique : vous décidez.
                </Text>
              )}
              {error && (
                <Text className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</Text>
              )}
            </Container>
          }
          renderItem={({ item }) => (
            <Container>
              <View className="w-full max-w-2xl">
                <QueueCard item={item} busy={queue.isRefetching} onError={setError} />
              </View>
            </Container>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="checkmark-circle-outline"
              title="Tout est à jour"
              description="Aucun signalement ni lieu en attente de validation."
            />
          }
        />
      )}
    </View>
  );
}
