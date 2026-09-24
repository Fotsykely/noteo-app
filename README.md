# Noteo

Application mobile d'avis sur les services locaux à Madagascar — « note-le » en malgache.

MVP : **Antananarivo**, trois catégories (restaurants, santé, garages). L'app répond à une
question simple : *quel est le mieux noté près de moi, dans cette catégorie ?*

## Démarrer

```bash
npm install
npm start
```

Puis scannez le QR code avec **Expo Go** (Android ou iOS). Aucun Xcode ni Android Studio
n'est nécessaire.

## Où en est le projet

Les écrans sont complets et navigables, mais alimentés par des **données factices**
(`src/data/mock.ts`) : aucun backend n'est encore branché. La suite (Supabase, catalogue réel,
authentification, dépôt d'avis) est décrite dans [AGENTS.md](AGENTS.md).

## Stack

- Expo SDK 57 · React Native 0.86 · TypeScript
- Expo Router (routage par fichiers)
- NativeWind v4 (Tailwind)
- Supabase — Postgres + PostGIS, Auth, Storage (à partir de l'Étape 2)

## Vérifications

```bash
npx tsc --noEmit    # typecheck
npx expo export --platform android   # vérifie que l'app bundle réellement
```
