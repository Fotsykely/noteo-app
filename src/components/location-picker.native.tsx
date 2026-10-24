import { useImperativeHandle, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { buildMapHtml, MAP_BASE_URL } from '@/lib/map-html';
import type { LocationPickerProps } from './location-picker.types';

/** Carte MapLibre dans une WebView : un toucher pose le repère (voir `buildMapHtml`). */
export function LocationPicker({
  initialCenter,
  initialZoom = 16,
  initialPin,
  onChange,
  ref,
}: LocationPickerProps) {
  const webView = useRef<WebView>(null);

  // Le HTML ne doit pas changer après le premier rendu : la WebView le rechargerait.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => buildMapHtml(initialCenter, initialZoom, initialPin), []);

  useImperativeHandle(ref, () => ({
    placeAt: (coords, zoom) =>
      webView.current?.injectJavaScript(
        `window.__place(${coords.lat}, ${coords.lng}, ${zoom ?? 'null'}); true;`
      ),
  }));

  function onMessage(event: WebViewMessageEvent) {
    try {
      const { lat, lng } = JSON.parse(event.nativeEvent.data);
      if (typeof lat === 'number' && typeof lng === 'number') onChange({ lat, lng });
    } catch {
      // Message étranger à la carte : ignoré.
    }
  }

  return (
    <View className="flex-1">
      <WebView
        ref={webView}
        source={{ html, baseUrl: MAP_BASE_URL }}
        originWhitelist={['*']}
        onMessage={onMessage}
        javaScriptEnabled
        // La page ne défile pas : sans cela, Android capte le geste de la carte.
        nestedScrollEnabled
        overScrollMode="never"
        style={{ flex: 1 }}
      />
    </View>
  );
}
