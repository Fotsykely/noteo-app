/** Lecture de la file de modération et actions des modérateurs (fonctions SQL `moderate_*`). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useIsModerator } from '@/hooks/use-role';
import { supabase } from '@/lib/supabase';
import type { PlaceStatus } from '@/types';

export type QueueItem = {
  /** Clé unique : un lieu peut apparaître à la fois signalé et en attente. */
  key: string;
  kind: 'place_report' | 'review_report' | 'place_pending';
  placeId: string;
  placeName: string;
  placeStatus: PlaceStatus;
  district: string;
  categorySlug: string;
  reviewId: string | null;
  reviewRating: number | null;
  reviewComment: string | null;
  reviewAuthor: string | null;
  reviewHidden: boolean;
  reportCount: number;
  reasons: string[];
  comments: string[];
};

const QUEUE_KEY = ['moderation', 'queue'];

/** Cibles à traiter, la plus signalée d'abord. Vide pour qui n'est pas modérateur. */
export function useModerationQueue() {
  const isModerator = useIsModerator();

  return useQuery({
    queryKey: QUEUE_KEY,
    queryFn: async (): Promise<QueueItem[]> => {
      const { data, error } = await supabase.rpc('moderation_queue');
      if (error) throw error;
      return data.map((row) => ({
        key: `${row.kind}:${row.place_id}:${row.review_id ?? ''}`,
        kind: row.kind as QueueItem['kind'],
        placeId: row.place_id,
        placeName: row.place_name,
        placeStatus: row.place_status as PlaceStatus,
        district: row.district,
        categorySlug: row.category_slug,
        reviewId: row.review_id,
        reviewRating: row.review_rating,
        reviewComment: row.review_comment,
        reviewAuthor: row.review_author,
        reviewHidden: row.review_hidden ?? false,
        reportCount: row.report_count,
        reasons: row.reasons,
        comments: row.comments,
      }));
    },
    enabled: isModerator,
    // Les signalements arrivent à tout moment : on relit au retour sur l'écran.
    staleTime: 30_000,
  });
}

/** Une action change l'état du catalogue : tout ce qui en dépend est relu. */
function useRefreshAfterAction() {
  const queryClient = useQueryClient();

  return (placeId: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['moderation'] }),
      queryClient.invalidateQueries({ queryKey: ['places'] }),
      queryClient.invalidateQueries({ queryKey: ['place', placeId] }),
      queryClient.invalidateQueries({ queryKey: ['reviews', placeId] }),
      queryClient.invalidateQueries({ queryKey: ['districts'] }),
    ]);
}

export function useModeratePlace() {
  const refresh = useRefreshAfterAction();

  return useMutation({
    mutationFn: async ({ placeId, status }: { placeId: string; status: PlaceStatus }) => {
      const { error } = await supabase.rpc('moderate_place', { p_place_id: placeId, p_status: status });
      if (error) throw error;
    },
    onSuccess: (_data, { placeId }) => refresh(placeId),
  });
}

export function useModerateReview() {
  const refresh = useRefreshAfterAction();

  return useMutation({
    mutationFn: async ({ reviewId, hidden }: { reviewId: string; placeId: string; hidden: boolean }) => {
      const { error } = await supabase.rpc('moderate_review', { p_review_id: reviewId, p_hidden: hidden });
      if (error) throw error;
    },
    onSuccess: (_data, { placeId }) => refresh(placeId),
  });
}

export function useDismissReports() {
  const refresh = useRefreshAfterAction();

  return useMutation({
    mutationFn: async ({ placeId, reviewId }: { placeId: string; reviewId?: string | null }) => {
      const { error } = await supabase.rpc('dismiss_reports', {
        p_place_id: placeId,
        p_review_id: reviewId ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: (_data, { placeId }) => refresh(placeId),
  });
}
