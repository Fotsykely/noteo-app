import { Text, View } from 'react-native';

import { cn, formatRating } from '@/lib/utils';

type RatingBadgeProps = {
  value: number;
  count?: number;
  size?: 'sm' | 'md';
  className?: string;
};

/** Pastille verte « 4,6 » — repère de confiance visible d'un coup d'œil. */
export function RatingBadge({ value, count, size = 'md', className }: RatingBadgeProps) {
  const hasRating = value > 0;

  return (
    <View className={cn('flex-row items-center gap-1.5', className)}>
      <View
        className={cn(
          'flex-row items-center rounded-lg',
          hasRating ? 'bg-brand-600' : 'bg-ink-200 dark:bg-white/15',
          size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1'
        )}>
        <Text
          className={cn(
            'font-bold text-white',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}>
          {hasRating ? formatRating(value) : '—'}
        </Text>
      </View>
      {count !== undefined && (
        <Text
          className={cn(
            'text-ink-500 dark:text-ink-300',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}>
          ({count})
        </Text>
      )}
    </View>
  );
}
