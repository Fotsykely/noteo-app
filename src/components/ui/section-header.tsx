import { Pressable, Text, View } from 'react-native';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, subtitle, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View className="flex-row items-end justify-between">
      <View className="flex-1">
        <Text className="text-xl font-bold text-ink dark:text-white">{title}</Text>
        {subtitle && (
          <Text className="mt-0.5 text-sm text-ink-500 dark:text-ink-300">{subtitle}</Text>
        )}
      </View>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          className="-mr-2 rounded-lg px-2 py-2 hover:bg-ink-50 active:opacity-60 dark:hover:bg-white/5 web:transition-colors web:duration-150">
          <Text className="text-sm font-semibold text-brand-700 dark:text-brand-400">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
