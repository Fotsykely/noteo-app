import { palette } from '@/constants/theme';
import type { Coordinates } from '@/types';

/**
 * Origine déclarée à la WebView : la page est chargée depuis du HTML en ligne, il lui
 * faut une origine https pour requêter les tuiles. À remplacer par le domaine réel de
 * l'app.
 */
export const MAP_BASE_URL = 'https://noteo.app';

/**
 * Style vectoriel OpenFreeMap (données OpenStreetMap, gratuit, sans clé). Vectoriel, car
 * c'est ce qui permet de faire pivoter la carte en gardant les noms de rue à l'endroit,
 * et de retirer les commerces d'OSM, souvent périmés (voir `buildMapHtml`).
 */
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * Page autonome qui affiche une carte MapLibre pour placer un lieu : un toucher ou un
 * clic pose le repère, qu'on peut ensuite faire glisser. La carte pivote (deux doigts ;
 * clic droit ou Ctrl + glisser sur web, en suivant la souris autour du centre) mais ne
 * s'incline pas ; la boussole remet le nord en haut.
 *
 * Le style est chargé puis filtré avant de créer la carte : plus de commerces ni
 * d'adresses (couche `poi`), qui ne sont pas fiables, et plus de bâtiments en 3D.
 *
 * Échanges avec l'app :
 * - page → app : `{ lat, lng }` (JSON) quand le repère est posé ou déplacé, via
 *   `ReactNativeWebView.postMessage` (mobile) ou `parent.postMessage` (iframe web) ;
 * - app → page : `window.__place(lat, lng, zoom)` (mobile) ou un message
 *   `{ type: 'place', lat, lng, zoom }` (web) : pose le repère et recentre la carte.
 *
 * `pin` : repère déjà connu, posé à l'ouverture sans rien envoyer à l'app.
 *
 * Attention : MapLibre range les coordonnées en `[lng, lat]`, l'inverse de l'app.
 */
export function buildMapHtml(view: Coordinates, zoom: number, pin: Coordinates | null): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
<style>
  html, body, #map { height: 100%; margin: 0; background: ${palette.ink[50]}; }
  #error {
    display: none; position: absolute; inset: 0; align-items: center; justify-content: center;
    font: 14px sans-serif; color: ${palette.ink[500]}; text-align: center; padding: 24px;
  }
  .pin {
    width: 36px; height: 48px; cursor: grab;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35));
  }
</style>
</head>
<body>
<div id="map"></div>
<div id="error">La carte n'a pas pu être chargée. Vérifiez votre connexion.</div>
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<script>
  var map = null;
  var marker = null;
  var queued = null;

  function send(payload) {
    var message = JSON.stringify(payload);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(message);
    else if (window.parent !== window) window.parent.postMessage(message, '*');
  }

  function putMarker(lat, lng) {
    if (!marker) {
      var el = document.createElement('div');
      el.className = 'pin';
      el.innerHTML =
        '<svg viewBox="0 0 36 48" width="36" height="48" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="${palette.brand[500]}" />' +
        '<circle cx="18" cy="18" r="7" fill="#fff" /></svg>';
      marker = new maplibregl.Marker({ element: el, anchor: 'bottom', draggable: true })
        .setLngLat([lng, lat])
        .addTo(map);
      marker.on('dragend', function () {
        var p = marker.getLngLat();
        send({ lat: p.lat, lng: p.lng });
      });
    } else {
      marker.setLngLat([lng, lat]);
    }
  }

  // App → page : pose le repère et recentre la carte, en gardant son orientation.
  window.__place = function (lat, lng, zoom) {
    if (!map) { queued = [lat, lng, zoom]; return; }
    putMarker(lat, lng);
    send({ lat: lat, lng: lng });
    map.easeTo({ center: [lng, lat], zoom: zoom || map.getZoom(), duration: 400 });
  };

  window.addEventListener('message', function (event) {
    try {
      var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data && data.type === 'place') window.__place(data.lat, data.lng, data.zoom);
    } catch (e) {}
  });

  // Rotation à la souris (web) : la carte suit la souris autour du centre, comme si on
  // la saisissait. Clic droit, ou Ctrl + clic gauche. Remplace celle de MapLibre, qui
  // ne réagit qu'au mouvement horizontal.
  function enableMouseRotation() {
    var el = document.getElementById('map');
    var start = null;

    function angle(e) {
      var r = el.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
    }

    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    el.addEventListener('mousedown', function (e) {
      if (e.button !== 2 && !(e.button === 0 && e.ctrlKey)) return;
      e.preventDefault();
      e.stopPropagation();
      start = { angle: angle(e), bearing: map.getBearing() };
    }, true);
    window.addEventListener('mousemove', function (e) {
      if (!start) return;
      var r = el.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      // Trop près du centre, l'angle saute au moindre mouvement.
      if (Math.sqrt(dx * dx + dy * dy) < 30) return;
      map.setBearing(start.bearing - (angle(e) - start.angle));
    });
    window.addEventListener('mouseup', function () { start = null; });
  }

  fetch('${STYLE_URL}')
    .then(function (response) { return response.json(); })
    .then(function (style) {
      style.layers = style.layers.filter(function (layer) {
        return layer['source-layer'] !== 'poi' && layer.id !== 'building-3d';
      });

      map = new maplibregl.Map({
        container: 'map',
        style: style,
        center: ${JSON.stringify([view.lng, view.lat])},
        zoom: ${zoom},
        maxZoom: 19,
        pitchWithRotate: false,
        dragRotate: false,
        attributionControl: { compact: true }
      });
      map.touchPitch.disable();
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: true, showZoom: true, visualizePitch: false }),
        'top-right'
      );
      enableMouseRotation();

      map.on('click', function (e) {
        putMarker(e.lngLat.lat, e.lngLat.lng);
        send({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });

      var initialPin = ${JSON.stringify(pin ? [pin.lat, pin.lng] : null)};
      if (initialPin) putMarker(initialPin[0], initialPin[1]);
      if (queued) window.__place(queued[0], queued[1], queued[2]);
    })
    .catch(function () {
      document.getElementById('error').style.display = 'flex';
    });
</script>
</body>
</html>`;
}
