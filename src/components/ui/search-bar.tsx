import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { useColors } from '@/hooks/use-theme';
import { cn, noWebOutline } from '@/lib/utils';

type SearchBarProps = {
  value?: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  /** Rend la barre non éditable et tapable — utile pour ouvrir l'écran de recherche. */
  onPress?: () => void;
  autoFocus?: boolean;
  className?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Restaurant, dentiste, garage…',
  onPress,
  autoFocus,
  className,
}: SearchBarProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  const content = (
    <View
      className={cn(
        'h-14 flex-row items-center gap-3 rounded-pill border bg-ink-50 px-5 dark:bg-white/10',
        focused ? 'border-brand-500' : 'border-transparent',
        className
      )}>
      <Ionicons name="search" size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        editable={!onPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[noWebOutline, { pointerEvents: onPress ? 'none' : 'auto' }]}
        autoFocus={autoFocus}
        returnKeyType="search"
        className="flex-1 text-base text-ink dark:text-white"
      />
      {!!value && onChangeText && (
        <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityLabel="Effacer">
          <Ionicons name="close-circle" size={18} color={colors.textFaint} />
        </Pressable>
      )}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} accessibilityRole="search" className="active:opacity-70">
      {content}
    </Pressable>
  );
}
