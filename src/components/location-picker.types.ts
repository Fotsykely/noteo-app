import type { Coordinates } from '@/types';

export type LocationPickerHandle = {
  /** Pose le repère et recentre la carte (bouton « Ma position »). */
  placeAt: (coords: Coordinates, zoom?: number) => void;
};

export type LocationPickerProps = {
  /** Centre de la carte à l'ouverture. Les changements ultérieurs de cette valeur sont ignorés : utiliser `placeAt`. */
  initialCenter: Coordinates;
  initialZoom?: number;
  /** Repère déjà connu, posé à l'ouverture. `null` : aucun repère tant que l'utilisateur n'a pas touché la carte. */
  initialPin: Coordinates | null;
  /** Appelé quand le repère est posé ou déplacé. */
  onChange: (coords: Coordinates) => void;
  ref?: React.Ref<LocationPickerHandle>;
};
