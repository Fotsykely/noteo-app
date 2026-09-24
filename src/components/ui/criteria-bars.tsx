import { Text, View } from 'react-native';

import { formatRating } from '@/lib/utils';
import type { Criterion } from '@/types';

type CriteriaBarsProps = {
  criteria: Criterion[];
  values: Record<string, number>;
};

/** Détail de la note par critère métier (goût, prix, délai…). */
export function CriteriaBars({ criteria, values }: CriteriaBarsProps) {
  return (
    <View className="gap-3">
      {criteria.map((criterion) => {
        const value = values[criterion.slug] ?? 0;
        const ratio = Math.max(0, Math.min(1, value / 5));

        return (
          <View key={criterion.slug} className="flex-row items-center gap-3">
            <Text
              className="w-36 text-sm text-ink-700 dark:text-ink-300"
              numberOfLines={1}>
              {criterion.labelFr}
            </Text>
            <View className="h-2 flex-1 overflow-hidden rounded-pill bg-ink-100 dark:bg-white/10">
              <View
                className="h-full rounded-pill bg-brand-500"
                style={{ width: `${ratio * 100}%` }}
              />
            </View>
            <Text className="w-8 text-right text-sm font-semibold text-ink dark:text-white">
              {formatRating(value)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
