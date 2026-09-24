import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

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

/** Saisie d'une note : cinq étoiles tapables. */
export function StarInput({ value, onChange, size = 'xl' }: StarInputProps) {
  const pixels = SIZES[size];

  return (
    <View className="flex-row">
      {Array.from({ length: 5 }, (_, index) => {
        const position = index + 1;
        const filled = value >= position;

        return (
          <Pressable
            key={index}
            onPress={() => onChange(position)}
            hitSlop={6}
            accessibilityRole="radio"
            accessibilityState={{ selected: filled }}
            accessibilityLabel={`${position} étoile${position > 1 ? 's' : ''}`}
            className="active:opacity-60"
            style={{ paddingHorizontal: pixels * 0.12 }}>
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
