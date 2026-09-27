import { ActivityIndicator, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { useColors } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

/** Indicateur de chargement centré ; `className` fixe la hauteur réservée. */
export function LoadingState({ className }: { className?: string }) {
  const colors = useColors();

  return (
    <View className={cn('items-center justify-center py-14', className)}>
      <ActivityIndicator color={colors.brand} />
    </View>
  );
}

/** Échec de chargement : le réseau mobile est souvent en cause, on propose de réessayer. */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title="Chargement impossible"
      description="Vérifiez votre connexion internet, puis réessayez."
      actionLabel="Réessayer"
      onAction={onRetry}
    />
  );
}
