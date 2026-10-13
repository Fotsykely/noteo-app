import { Text, View } from 'react-native';

import { REQUIRED_ON_SITE_REVIEWS } from '@/lib/places';
import { cn } from '@/lib/utils';

/** « À confirmer · 1/3 » : lieu proposé, publié après 3 avis donnés sur place. */
export function PendingBadge({ onSiteCount, className }: { onSiteCount: number; className?: string }) {
  return (
    <View className={cn('self-start rounded-pill bg-amber-100 px-2.5 py-1 dark:bg-amber-500/20', className)}>
      <Text className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
        À confirmer · {Math.min(onSiteCount, REQUIRED_ON_SITE_REVIEWS)}/{REQUIRED_ON_SITE_REVIEWS}
      </Text>
    </View>
  );
}
