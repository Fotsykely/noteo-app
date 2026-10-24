# Design system Noteo — MASTER

Source de vérité du design de Noteo. Elle décrit ce que l'app utilise **déjà** ; toute évolution
commence ici. Les surcharges par page vivent dans `pages/` et l'emportent sur ce fichier.

- Jetons : `tailwind.config.js` (classes NativeWind) et `src/constants/theme.ts` (API qui exigent
  une couleur JS : icônes, navigation, barre de statut). **Les modifier ensemble.**
- Cible principale : Android. iOS et web desktop doivent rester propres.
- Interface en français ; libellés malgaches non affichés (voir `AGENTS.md`).

## Identité

Application d'avis sur les services locaux d'Antananarivo. Ton : **confiance, clarté, sobriété**.
Vert de marque sur fond blanc, encre quasi noire, peu d'ornements. Le vert signale la confiance
(note, action principale) ; il ne décore pas.

## Couleurs

### Marque

| Jeton | Hex | Usage |
|---|---|---|
| `brand-50` | `#E6F7F1` | fond d'avatar, pastille |
| `brand-100` | `#C2ECDD` | texte d'avatar en sombre |
| `brand-400` | `#2FBB8E` | texte de marque et anneau de focus en sombre |
| `brand-500` | `#00A676` | icônes, décor, barres de critères, tracé de carte — **jamais** en texte ni sous un texte blanc |
| `brand-600` | `#00805A` | **fond** des boutons principaux et des pastilles de note (blanc dessus : 4,9:1) |
| `brand-700` | `#007352` | **texte** de marque en clair (5,9:1), survol des boutons, focus en clair |
| `brand-800` | `#005A40` | état pressé des boutons |

### Encre et surfaces

| Jeton | Hex | Usage |
|---|---|---|
| `ink` | `#0E1116` | texte principal en clair, fond du bouton secondaire |
| `ink-700` | `#3A4048` | corps secondaire |
| `ink-500` | `#6B7280` | texte secondaire en clair (4,8:1) |
| `ink-300` | `#A8AFB8` | texte secondaire **en sombre** ; icônes discrètes en clair |
| `ink-200` | `#D7DBE0` | bordures de puces et de boutons, étoile vide |
| `ink-100` | `#EDEFF2` | bordures de cartes, séparateurs, pistes de barres |
| `ink-50` | `#F7F8FA` | fond de champ, de bloc, survol |
| `surface` | `#FFFFFF` | fond d'écran clair |
| `surface-dark` | `#0B0D10` | fond d'écran sombre |
| `surface-darkMuted` | `#15181D` | carte en sombre |
| `star` | `#FFB800` | étoiles (décor : toujours accompagné de la note en chiffres) |

### Catégories (`src/constants/categories.ts`)

Restaurants `#EA580C` sur `orange-100` · Santé `#0284C7` sur `sky-100` · Garages `#7C3AED` sur
`violet-100`. En sombre, le fond devient `*-500/20`.

### Sémantiques

| Rôle | Clair | Sombre |
|---|---|---|
| Texte principal | `text-ink` | `dark:text-white` |
| Texte secondaire | `text-ink-500` | `dark:text-ink-300` |
| Texte de marque / lien | `text-brand-700` | `dark:text-brand-400` |
| Bordure | `border-ink-100` | `dark:border-white/10` |
| Fond de bloc / champ | `bg-ink-50` | `dark:bg-white/5` ou `/10` |
| Danger | `text-red-700`, `border-red-300` | `dark:text-red-400` |
| Attente (lieu à confirmer) | `bg-amber-100 text-amber-800` | `dark:bg-amber-500/20 dark:text-amber-300` |

### Règles de contraste (mesurées)

- Texte blanc sur `brand-500` : **3,1:1 — interdit**. Sur `brand-600` : 4,9:1.
- `text-brand-500` sur blanc : 3,1:1 — **interdit en texte**. Utiliser `brand-700`.
- `text-ink-300` sur blanc : 2,2:1 — interdit en texte. `dark:text-ink-500` sur `surface-dark` :
  4,0:1 — interdit en texte.
- Les icônes et séparateurs discrets (`useColors().textFaint`) restent permis : ce sont des
  éléments décoratifs doublés d'un libellé.
- L'information ne passe jamais par la couleur seule (la note est toujours écrite).

## Typographie

Police **système** (Roboto sur Android, SF sur iOS, pile système sur le web) : rendu natif, aucun
poids ajouté. Corps minimum 14 px ; 12 px pour les légendes ; 11 px réservé aux badges.

| Rôle | Mobile | Desktop (`lg`) | Classes |
|---|---|---|---|
| Accroche d'accueil | 30/36 gras | 40/48 | `text-[30px] leading-9 font-bold lg:text-[40px] lg:leading-[48px]` |
| Titre de page | 28 gras | 36 | `text-[28px] font-bold lg:text-[36px]` |
| Nom de lieu (fiche) | 26/32 gras | 44/52 | `text-[26px] leading-8 font-bold lg:text-[44px] lg:leading-[52px]` |
| Titre de formulaire | 24 gras | — | `text-2xl font-bold` |
| Titre de section | 20 gras | — | `text-xl font-bold` |
| Sous-titre de section | 18 gras | — | `text-lg font-bold` |
| Titre de carte / ligne | 16 semi-gras | — | `text-base font-semibold` |
| Corps | 14/20 | 15/24 pour les avis | `text-sm leading-5` |
| Légende | 12/16 | — | `text-xs leading-4` |
| Badge | 11 semi-gras | — | `text-[11px] font-semibold` |

Graisses : `font-bold` (titres), `font-semibold` (libellés, liens), `font-medium` (navigation,
puces). Ligne de lecture : **100 caractères au plus** (`max-w-3xl` pour le corps de texte).

## Espacement (base 4 px)

| Usage | Valeur |
|---|---|
| Gouttière d'écran | 20 px mobile, 32 px `lg` — **via `Container`**, jamais de `px-5` en dur |
| Padding de carte / bloc | 16 px (`p-4`) ; 12 px pour les cartes compactes (`p-3`) |
| Écart entre éléments liés | 8 px (`gap-2`), 12 px (`gap-3`) |
| Entre blocs d'une section | 16–24 px |
| Entre sections | 32 px mobile, 48 px `lg` (`mt-8 lg:mt-12`) |
| Champ de saisie / bouton | hauteur 56 px (`h-14`) ; puce et bouton compact 40 px (`h-10`) |

Éviter les paddings imbriqués : `PlaceRow` et `Row` portent déjà leur marge (`padded={false}` sur
`Container`).

## Rayons

| Jeton | Valeur | Usage |
|---|---|---|
| `rounded-card` | 18 px | cartes, blocs, champs |
| `rounded-pill` | 999 px | boutons, puces, barre de recherche, badges |
| `rounded-2xl` | 16 px | panneau desktop, vignettes, fenêtres |
| `rounded-xl` | 12 px | entrées de navigation latérale |
| `rounded-lg` | 8 px | pastille de note |
| `rounded-full` | cercle | avatars, boutons ronds |

## États et interaction

Tout élément pressable porte **les quatre états** :

| État | Règle |
|---|---|
| Repos | style de base |
| Survol (pointeur) | `hover:` — changement de fond, bordure ou soulignement visible, jamais seul le curseur |
| Pressé | `active:` — plus foncé ou `opacity-60/80` |
| Focus clavier | anneau de 2 px `brand-700` (`brand-400` en sombre), posé globalement dans `src/global.css` |
| Désactivé | `opacity-50`, `disabled` réel |

- Transitions web : `web:transition-colors web:duration-150`. Respecter `prefers-reduced-motion`.
- **Cibles :** 44 px sur mobile, 24 px minimum au pointeur. `hitSlop` n'est pas appliqué sur le
  web : donner la taille réelle au composant (`p-*`, `min-h-*`).
- Champs de saisie : `style={noWebOutline}` **et** `focus:border-brand-500`.
- Retour : `goBack()` (`src/lib/navigation.ts`), jamais `router.back()` seul — sur le web, un accès
  direct par URL n'a pas d'historique.
- Barres de défilement : `showScrollbar` (`src/lib/utils.ts`), visibles sur le web.

## Composants

| Composant | Fichier | Règles |
|---|---|---|
| `Button` | `ui/button.tsx` | primary `bg-brand-600` ; secondary encre ; outline ; ghost. Hauteur 56, pill. |
| `Chip` | `ui/category-chip.tsx` | filtre pill 40 px ; sélectionné = encre pleine |
| `CategoryTile` | `ui/category-chip.tsx` | tuile d'accueil ; horizontale en `lg` |
| `PlaceCard` / `PlaceRow` | `ui/place-card.tsx` | carte verticale (grille) / ligne (classement) ; rôle `link` |
| `RatingBadge` | `ui/rating-badge.tsx` | pastille `bg-brand-600`, blanc dessus |
| `StarRating` / `StarInput` | `ui/star-rating.tsx` | `radiogroup` ; flèches au clavier ; étoile `lg` ≥ 36 px de cible |
| `SearchBar` | `ui/search-bar.tsx` | pill 56 px, focus `border-brand-500` |
| `Container` | `ui/container.tsx` | largeur de lecture 1280 px, gouttière responsive |
| `EmptyState`, `LoadingState`, `ErrorState` | `ui/empty-state.tsx`, `ui/query-state.tsx` | états vides et d'erreur avec action |

## Anti-patterns

- Texte ou fond de bouton en `brand-500` ; texte `ink-300` en clair.
- `router.back()` direct ; `hitSlop` comme seule zone de clic ; `showsVerticalScrollIndicator={false}`
  inconditionnel.
- Pressable sans `hover:` ; liens de navigation sans `href` (utiliser `Link`).
- Mises en page desktop pilotées par la largeur de fenêtre sans tenir compte de la barre
  latérale (248 px).
- Emoji en guise d'icône (utiliser `Ionicons`) ; valeurs hexadécimales en dur dans les composants
  (utiliser `palette` / `useColors()`).
- Information portée par la couleur seule.

## Checklist avant livraison

- [ ] Contraste ≥ 4,5:1 pour tout texte, en clair **et** en sombre
- [ ] Hover, pressé, focus visibles sur chaque élément interactif
- [ ] Cibles ≥ 44 px mobile / 24 px pointeur
- [ ] Gouttières via `Container` ; alignement sur 20/32 px
- [ ] Rendu à 375, 1024, 1280 et 1536 px, clair et sombre
- [ ] Navigation clavier : tabulation logique, Entrée valide les formulaires
- [ ] `npx tsc --noEmit` et `npx expo lint` passent
