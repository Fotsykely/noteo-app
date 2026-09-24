import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { palette } from '@/constants/theme';

type RatingDistributionProps = {
  /** index 0 = 1 étoile … index 4 = 5 étoiles */
  distribution: [number, number, number, number, number];
};

/** Histogramme des notes, de 5 étoiles en haut à 1 en bas. */
export function RatingDistribution({ distribution }: RatingDistributionProps) {
  const total = distribution.reduce((a, b) => a + b, 0) || 1;

  return (
    <View className="gap-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star - 1];
        const ratio = count / total;

        return (
          <View key={star} className="flex-row items-center gap-2">
            <Text className="w-3 text-xs text-ink-500 dark:text-ink-300">{star}</Text>
            <Ionicons name="star" size={11} color={palette.star} />
            <View className="h-1.5 flex-1 overflow-hidden rounded-pill bg-ink-100 dark:bg-white/10">
              <View
                className="h-full rounded-pill bg-star"
                style={{ width: `${ratio * 100}%`, backgroundColor: palette.star }}
              />
            </View>
            <Text className="w-8 text-right text-xs text-ink-500 dark:text-ink-300">{count}</Text>
          </View>
        );
      })}
    </View>
  );
}
