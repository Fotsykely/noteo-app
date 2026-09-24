import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';

type AvatarProps = {
  initials: string;
  size?: 'md' | 'lg';
  className?: string;
};

/** Pastille d'initiales, en attendant les photos de profil. */
export function Avatar({ initials, size = 'md', className }: AvatarProps) {
  return (
    <View
      className={cn(
        'items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/20',
        size === 'lg' ? 'h-16 w-16' : 'h-10 w-10',
        className
      )}>
      <Text
        className={cn(
          'font-bold text-brand-700 dark:text-brand-100',
          size === 'lg' ? 'text-xl' : 'text-sm'
        )}>
        {initials.toUpperCase()}
      </Text>
    </View>
  );
}
