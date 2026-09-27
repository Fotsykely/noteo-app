import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/ui/category-chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState, LoadingState } from '@/components/ui/query-state';
import { SearchBar } from '@/components/ui/search-bar';
import { useIsDesktop } from '@/hooks/use-breakpoint';
import { useDistricts } from '@/hooks/use-places';
import { useColors } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import type { CategorySlug } from '@/types';

type DistrictPickerProps = {
  value: string | null;
  onChange: (district: string | null) => void;
  /** Ne proposer que les quartiers ayant des lieux dans cette catégorie. */
  category?: CategorySlug | null;
  /** Ajoute l'option « Tous les quartiers » (filtres) ; absente dans un formulaire. */
  allowAll?: boolean;
  placeholder?: string;
};

/** Sans accents ni casse : « tsaralalana » trouve « Tsaralalàna ». */
const normalize = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Choix d'un quartier parmi ceux du catalogue (170 environ, trop pour des puces) :
 * feuille du bas sur mobile, fenêtre centrée sur grand écran.
 */
export function DistrictPicker({
  value,
  onChange,
  category,
  allowAll = false,
  placeholder = 'Tous quartiers',
}: DistrictPickerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const districts = useDistricts(category);

  const filtered = useMemo(() => {
    const needle = normalize(search);
    const list = districts.data ?? [];
    return needle ? list.filter((district) => normalize(district.name).includes(needle)) : list;
  }, [districts.data, search]);

  function close() {
    setOpen(false);
    setSearch('');
  }

  function select(district: string | null) {
    onChange(district);
    close();
  }

  const row = (label: string, selected: boolean, onPress: () => void, count?: number) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="flex-row items-center gap-3 px-5 py-3.5 active:bg-ink-50 hover:bg-ink-50 dark:active:bg-white/5 dark:hover:bg-white/5">
      <Text
        className={cn(
          'flex-1 text-base text-ink dark:text-white',
          selected && 'font-semibold text-brand-600 dark:text-brand-500'
        )}>
        {label}
      </Text>
      {count !== undefined && (
        <Text className="text-sm text-ink-500 dark:text-ink-300">{count}</Text>
      )}
      {selected && <Ionicons name="checkmark" size={20} color={colors.brand} />}
    </Pressable>
  );

  return (
    <>
      <Chip
        label={value ?? placeholder}
        icon="location-outline"
        selected={value !== null}
        onPress={() => setOpen(true)}
      />

      <Modal visible={open} transparent animationType={isDesktop ? 'fade' : 'slide'} onRequestClose={close}>
        <View className={cn('flex-1 bg-black/50', isDesktop ? 'items-center justify-center p-6' : 'justify-end')}>
          {/* Toucher le fond ferme la fenêtre. */}
          <Pressable className="absolute inset-0" onPress={close} accessibilityLabel="Fermer" />

          <View
            style={{ paddingBottom: isDesktop ? 0 : insets.bottom }}
            className={cn(
              'overflow-hidden bg-surface dark:bg-surface-dark',
              isDesktop ? 'h-[640px] max-h-full w-full max-w-md rounded-2xl' : 'h-[85%] rounded-t-3xl'
            )}>
            <View className="flex-row items-center justify-between px-5 pb-2 pt-5">
              <Text className="text-lg font-bold text-ink dark:text-white">Quartier</Text>
              <Pressable
                onPress={close}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                className="h-9 w-9 items-center justify-center rounded-full active:opacity-60 hover:bg-ink-50 dark:hover:bg-white/10">
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <View className="px-5 pb-3">
              <SearchBar value={search} onChangeText={setSearch} placeholder="Rechercher un quartier" />
            </View>

            {districts.isPending ? (
              <LoadingState />
            ) : districts.isError ? (
              <ErrorState onRetry={() => districts.refetch()} />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.name}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={
                  allowAll && !search ? row('Tous les quartiers', value === null, () => select(null)) : null
                }
                renderItem={({ item }) =>
                  row(item.name, item.name === value, () => select(item.name), item.placeCount)
                }
                ListEmptyComponent={
                  <EmptyState icon="location-outline" title={`Aucun quartier « ${search} »`} />
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
