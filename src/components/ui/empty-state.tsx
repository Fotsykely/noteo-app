import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/use-theme';
import type { IoniconName } from '@/types';

type EmptyStateProps = {
  icon?: IoniconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = 'search',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const colors = useColors();

  return (
    <View className="items-center px-8 py-14">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-ink-50 dark:bg-white/10">
        <Ionicons name={icon} size={26} color={colors.textFaint} />
      </View>
      <Text className="mt-4 text-center text-lg font-semibold text-ink dark:text-white">
        {title}
      </Text>
      {description && (
        <Text className="mt-1.5 text-center text-sm leading-5 text-ink-500 dark:text-ink-300">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="outline" className="mt-6" />
      )}
    </View>
  );
}
