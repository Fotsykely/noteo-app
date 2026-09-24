import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import { useIsDark } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
};

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-brand-500 active:bg-brand-600',
  secondary: 'bg-ink dark:bg-white active:opacity-80',
  outline: 'border border-ink-200 dark:border-white/20 active:bg-ink-50 dark:active:bg-white/10',
  ghost: 'active:bg-ink-50 dark:active:bg-white/10',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-white dark:text-ink',
  outline: 'text-ink dark:text-white',
  ghost: 'text-ink dark:text-white',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  className,
}: ButtonProps) {
  const isDark = useIsDark();
  const inactive = disabled || loading;

  const contentColor =
    variant === 'primary'
      ? '#FFFFFF'
      : variant === 'secondary'
        ? isDark
          ? palette.ink.DEFAULT
          : '#FFFFFF'
        : isDark
          ? '#FFFFFF'
          : palette.ink.DEFAULT;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      className={cn(
        'h-14 flex-row items-center justify-center rounded-pill px-6',
        CONTAINER[variant],
        fullWidth && 'w-full',
        inactive && 'opacity-50',
        className
      )}>
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon && <Ionicons name={icon} size={18} color={contentColor} />}
          <Text className={cn('text-base font-semibold', LABEL[variant])}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
