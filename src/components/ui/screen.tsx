import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { cn } from '@/lib/utils';

type ScreenProps = {
  children: ReactNode;
  /** Bords où appliquer la marge de sécurité (haut par défaut). */
  edges?: readonly Edge[];
  muted?: boolean;
  className?: string;
};

/** Conteneur d'écran : fond thémé + zone sûre. */
export function Screen({ children, edges = ['top'], muted = false, className }: ScreenProps) {
  return (
    <View className={cn('flex-1', muted ? 'bg-surface-muted dark:bg-surface-dark' : 'bg-surface dark:bg-surface-dark')}>
      <SafeAreaView edges={edges} className={cn('flex-1', className)}>
        {children}
      </SafeAreaView>
    </View>
  );
}
