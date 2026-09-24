import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/lib/utils';

type ContainerProps = {
  children: ReactNode;
  /** Mettre à false quand l'enfant porte déjà sa propre marge horizontale. */
  padded?: boolean;
  className?: string;
};

/**
 * Largeur de lecture confortable : pleine largeur sur mobile, plafonnée et
 * centrée sur grand écran pour éviter les lignes qui traversent tout l'écran.
 */
export function Container({ children, padded = true, className }: ContainerProps) {
  return (
    <View
      className={cn(
        'w-full max-w-[1280px] self-center',
        padded && 'px-5 lg:px-8',
        className
      )}>
      {children}
    </View>
  );
}
