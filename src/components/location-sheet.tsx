import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocationPicker } from '@/components/location-picker';
import type { LocationPickerHandle } from '@/components/location-picker.types';
import { Button } from '@/components/ui/button';
import { SERVICE_RADIUS_M, TANA_CENTER } from '@/constants/geo';
import { getVisitPosition } from '@/hooks/use-location';
import { useColors } from '@/hooks/use-theme';
import { distanceMeters } from '@/lib/utils';
import type { Coordinates } from '@/types';

type LocationSheetProps = {
  visible: boolean;
  /** Position déjà connue du lieu ; sans elle, la carte s'ouvre sur Antananarivo. */
  initial: Coordinates | null;
  onClose: () => void;
  onConfirm: (coords: Coordinates) => void;
};

/**
 * Carte plein écran pour situer un lieu sans y être : on déplace la carte jusqu'à ce
 * que le repère fixe soit au bon endroit. Plein écran, pour que le geste de la carte
 * ne se dispute pas avec le défilement du formulaire.
 */
export function LocationSheet({ visible, initial, onClose, onConfirm }: LocationSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SheetContent initial={initial} onClose={onClose} onConfirm={onConfirm} />
    </Modal>
  );
}

function SheetContent({ initial, onClose, onConfirm }: Omit<LocationSheetProps, 'visible'>) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const picker = useRef<LocationPickerHandle>(null);

  // Sans position connue, la carte s'ouvre sur le centre-ville, sans repère : rien n'est
  // validable tant que l'utilisateur n'a pas touché la carte.
  const [pin, setPin] = useState<Coordinates | null>(initial);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = useCallback((coords: Coordinates) => {
    setPin(coords);
    setError(null);
  }, []);

  async function locateMe() {
    setLocating(true);
    setError(null);
    const coords = await getVisitPosition();
    setLocating(false);
    if (!coords) {
      setError("Position indisponible. Activez la localisation ou touchez la carte.");
      return;
    }
    picker.current?.placeAt(coords, 17);
  }

  function confirm() {
    if (!pin) return;
    if (distanceMeters(pin, TANA_CENTER) > SERVICE_RADIUS_M) {
      setError("Ce repère est hors du Grand Antananarivo, seule zone couverte pour l'instant.");
      return;
    }
    onConfirm(pin);
  }

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <View
        className="flex-row items-center gap-3 border-b border-ink-100 px-4 pb-3 dark:border-white/10"
        style={{ paddingTop: Math.max(insets.top, 12) }}>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Fermer la carte"
          className="active:opacity-60">
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-base font-semibold text-ink dark:text-white">Placer le lieu</Text>
          <Text className="text-xs text-ink-500 dark:text-ink-300">
            Touchez la carte pour placer le repère, faites-le glisser pour l&apos;ajuster.
          </Text>
        </View>
      </View>

      <View className="flex-1">
        <LocationPicker
          ref={picker}
          initialCenter={initial ?? TANA_CENTER}
          initialZoom={initial ? 17 : 13}
          initialPin={initial}
          onChange={onChange}
        />
        <Pressable
          onPress={locateMe}
          disabled={locating}
          accessibilityRole="button"
          accessibilityLabel="Utiliser ma position"
          className="absolute bottom-4 right-4 h-12 w-12 items-center justify-center rounded-full bg-white shadow-md active:opacity-80 dark:bg-surface-darkMuted">
          {locating ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <Ionicons name="locate" size={22} color={colors.brand} />
          )}
        </Pressable>
      </View>

      <View
        className="border-t border-ink-100 px-5 pt-4 dark:border-white/10"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        {error && (
          <Text className="mb-3 text-center text-sm text-red-600 dark:text-red-400">{error}</Text>
        )}
        <Button
          label={pin ? 'Valider cette position' : 'Touchez la carte pour placer le lieu'}
          fullWidth
          disabled={!pin}
          onPress={confirm}
        />
      </View>
    </View>
  );
}
