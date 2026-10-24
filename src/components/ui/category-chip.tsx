import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import { useColors } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

/** Filtre horizontal, style Vinted. */
export function Chip({ label, selected = false, onPress, icon }: ChipProps) {
  const colors = useColors();
  // Sélectionné, le fond est noir en clair et blanc en sombre : l'icône prend l'inverse.
  const iconColor = selected
    ? colors.isDark
      ? palette.ink.DEFAULT
      : '#FFFFFF'
    : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        'h-10 flex-row items-center gap-1.5 rounded-pill px-4 web:transition-colors web:duration-150',
        selected
          ? 'bg-ink hover:opacity-90 dark:bg-white'
          : 'border border-ink-200 bg-transparent hover:border-ink-300 hover:bg-ink-50 active:bg-ink-100 dark:border-white/20 dark:hover:border-white/40 dark:hover:bg-white/5 dark:active:bg-white/10'
      )}>
      {icon && <Ionicons name={icon} size={15} color={iconColor} />}
      <Text
        className={cn(
          'text-sm font-medium',
          selected ? 'text-white dark:text-ink' : 'text-ink-700 dark:text-ink-300'
        )}>
        {label}
      </Text>
    </Pressable>
  );
}

type CategoryTileProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: { bgClass: string; color: string };
  count?: number;
  onPress?: () => void;
};

/** Grande tuile de catégorie de l'accueil. */
export function CategoryTile({ label, icon, tint, count, onPress }: CategoryTileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-1 rounded-card border border-ink-100 bg-surface p-4 hover:border-ink-300 hover:bg-ink-50 active:opacity-70 dark:border-white/10 dark:bg-surface-darkMuted dark:hover:bg-white/10 web:transition-colors web:duration-150 lg:flex-row lg:items-center lg:gap-4">
      <View className={cn('h-11 w-11 items-center justify-center rounded-full', tint.bgClass)}>
        <Ionicons name={icon} size={21} color={tint.color} />
      </View>
      <View className="mt-3 lg:mt-0 lg:flex-1">
        <Text className="text-sm font-semibold text-ink dark:text-white lg:text-base" numberOfLines={1}>
          {label}
        </Text>
        {count !== undefined && (
          <Text className="mt-0.5 text-xs text-ink-500 dark:text-ink-300">{count} lieux</Text>
        )}
      </View>
    </Pressable>
  );
}
