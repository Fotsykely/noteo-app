import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { buildMapHtml } from '@/lib/map-html';
import type { LocationPickerProps } from './location-picker.types';

/** Version web : la même page MapLibre dans une iframe (voir location-picker.native.tsx). */
export function LocationPicker({
  initialCenter,
  initialZoom = 16,
  initialPin,
  onChange,
  ref,
}: LocationPickerProps) {
  const frame = useRef<HTMLIFrameElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => buildMapHtml(initialCenter, initialZoom, initialPin), []);

  // Page servie par une URL `blob:` et non par `srcDoc` : dans une iframe `srcDoc`, MapLibre
  // charge le style mais n'obtient jamais ses tuiles (carte vide).
  const [src] = useState(() => URL.createObjectURL(new Blob([html], { type: 'text/html' })));
  // Libérée avec un délai : l'iframe doit avoir fini de lire l'URL (remontage compris).
  useEffect(() => () => void setTimeout(() => URL.revokeObjectURL(src), 2000), [src]);

  useImperativeHandle(ref, () => ({
    placeAt: (coords, zoom) =>
      frame.current?.contentWindow?.postMessage(
        JSON.stringify({ type: 'place', lat: coords.lat, lng: coords.lng, zoom }),
        '*'
      ),
  }));

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // Seule notre iframe peut parler : le reste de la page émet d'autres messages.
      if (event.source !== frame.current?.contentWindow || typeof event.data !== 'string') return;
      try {
        const { lat, lng } = JSON.parse(event.data);
        if (typeof lat === 'number' && typeof lng === 'number') onChange({ lat, lng });
      } catch {
        // Message étranger à la carte : ignoré.
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onChange]);

  return (
    <iframe
      ref={frame}
      src={src}
      title="Carte"
      style={{ flex: 1, width: '100%', height: '100%', border: 0 }}
    />
  );
}
