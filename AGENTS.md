# Noteo

Application mobile d'avis sur les services locaux à Madagascar (« note-le » en malgache).
MVP : Antananarivo, trois catégories — restaurants, santé, garages. Elle répond à une question
précise : « quel est le mieux noté près de moi, dans cette catégorie ? »

Expo / React Native. Priorité aux patterns mobile, à la performance et à la compatibilité
iOS + Android. Cible principale : **Android** (part de marché dominante à Madagascar).

## État actuel

Étapes 0 et 1 terminées : squelette Expo, design system NativeWind et tous les écrans
navigables **sur des données factices** (`src/data/mock.ts`). Aucun backend n'est branché.

Prochaine étape : Supabase (schéma, RLS, triggers, RPC géo) — voir « Feuille de route ».

## Conventions du projet

- **Langue de l'interface : français.** Les libellés malgaches existent déjà dans
  `src/constants/categories.ts` (`nameMg`, `labelMg`) mais ne sont pas encore affichés.
  Ils sont **à faire valider par un locuteur natif** avant toute mise en production.
- **Styles : NativeWind** (Tailwind v3). Les jetons de marque sont dans `tailwind.config.js`
  et dupliqués en JS dans `src/constants/theme.ts` pour les API qui exigent une couleur
  (icônes, navigation, barre de statut). Modifier les deux en même temps.
- Les composants d'icônes (`Ionicons`) **n'acceptent pas `className`** : passer `color`,
  résolu via le hook `useColors()` (`src/hooks/use-theme.ts`).
- Mode sombre géré par les variantes `dark:`, suivant le réglage système.
- **Classement : moyenne bayésienne** (`bayesianScore` dans `src/lib/utils.ts`). Ne jamais
  trier « les mieux notés » sur la moyenne brute : un lieu noté 5 par une personne ne doit pas
  devancer un lieu noté 4,7 par deux cents.

## Feuille de route

| Étape | Contenu | État |
|---|---|---|
| 0 | Squelette Expo + NativeWind | fait |
| 1 | Design system + écrans sur données factices | fait |
| 2 | Supabase : schéma, RLS, triggers, RPC `nearby_places` | à faire |
| 3 | Catalogue réel d'Antananarivo (import OpenStreetMap) | à faire |
| 4 | Branchement en lecture (React Query, géolocalisation) | à faire |
| 5 | Auth (Google, Facebook, e-mail) + dépôt d'avis + photos | à faire |
| 6 | Signalements et modération | à faire |
| 7 | Build EAS : APK Android, TestFlight iOS | à faire |

Hors périmètre v1 : espace professionnel, réponses des pros, notifications push, monétisation,
version web SEO, autres villes, interface intégralement en malgache, connexion par SMS.

---

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Structure

```
src/
  app/              routes Expo Router (un fichier = un écran)
    (tabs)/         Accueil · Classements · Noter · Profil
    place/[id]      fiche d'un lieu
    review/new      formulaire de notation
    place/new       ajout d'un lieu
    auth/sign-in    connexion
    search          recherche plein écran
  components/ui/    design system (cartes, étoiles, chips, boutons…)
  constants/        catégories + critères métier, jetons de thème
  data/mock.ts      données FICTIVES — supprimées à l'Étape 3
  hooks/            useColors, useIsDark
  lib/              utilitaires purs (distance, score bayésien, requêtes, session)
  types/            modèle de domaine
```
