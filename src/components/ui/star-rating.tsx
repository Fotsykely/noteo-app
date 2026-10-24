import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { palette } from '@/constants/theme';

const SIZES = { sm: 12, md: 16, lg: 20, xl: 34 } as const;

type StarRatingProps = {
  value: number;
  size?: keyof typeof SIZES;
  /** Nombre d'étoiles affichées (5 par défaut). */
  count?: number;
};

/** Affichage en lecture seule, avec demi-étoiles. */
export function StarRating({ value, size = 'md', count = 5 }: StarRatingProps) {
  const pixels = SIZES[size];

  return (
    <View className="flex-row" accessibilityLabel={`Note de ${value} sur 5`}>
      {Array.from({ length: count }, (_, index) => {
        const position = index + 1;
        const name =
          value >= position ? 'star' : value >= position - 0.5 ? 'star-half' : 'star-outline';

        return (
          <Ionicons
            key={index}
            name={name}
            size={pixels}
            color={name === 'star-outline' ? palette.ink[200] : palette.star}
            style={{ marginRight: pixels * 0.12 }}
          />
        );
      })}
    </View>
  );
}

type StarInputProps = {
  value: number;
  onChange: (value: number) => void;
  size?: keyof typeof SIZES;
};

/** Cible de clic minimale par étoile : `hitSlop` n'est pas appliqué sur le web. */
const TARGET = { sm: 24, md: 32, lg: 36, xl: 44 } as const;

/**
 * Saisie d'une note : cinq étoiles tapables. Groupe de radios : au clavier, un seul arrêt de
 * tabulation et les flèches changent la note.
 */
export function StarInput({ value, onChange, size = 'xl' }: StarInputProps) {
  const pixels = SIZES[size];
  const target = TARGET[size];
  const refs = useRef<(View | null)[]>([]);
  // Un seul arrêt de tabulation : l'étoile choisie, ou la première sans note.
  const stop = Math.max(1, value);

  function onKeyDown(event: { key?: string; preventDefault?: () => void }) {
    const key = event.key;
    const delta =
      key === 'ArrowRight' || key === 'ArrowUp' ? 1 : key === 'ArrowLeft' || key === 'ArrowDown' ? -1 : 0;
    if (!delta) return;
    event.preventDefault?.();
    const next = Math.min(5, Math.max(1, (value || 0) + delta));
    onChange(next);
    refs.current[next - 1]?.focus?.();
  }

  return (
    <View className="flex-row" accessibilityRole="radiogroup" accessibilityLabel="Note sur 5">
      {Array.from({ length: 5 }, (_, index) => {
        const position = index + 1;
        const filled = value >= position;

        return (
          <Pressable
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            onPress={() => onChange(position)}
            focusable={Platform.OS !== 'web' || position === stop}
            // @ts-expect-error `onKeyDown` n'existe que sur react-native-web.
            onKeyDown={Platform.OS === 'web' ? onKeyDown : undefined}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === position }}
            accessibilityLabel={`${position} étoile${position > 1 ? 's' : ''}`}
            className="items-center justify-center rounded-full hover:bg-ink-50 active:opacity-60 dark:hover:bg-white/10"
            style={{ minWidth: target, minHeight: target }}>
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={pixels}
              color={filled ? palette.star : palette.ink[200]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
