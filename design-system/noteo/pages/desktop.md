# Noteo — surcharges desktop (≥ 1024 px)

Ces règles l'emportent sur `../MASTER.md` à partir de 1024 px (`useIsDesktop()`).
Le rendu mobile ne doit jamais changer à cause d'elles.

## Structure

- Barre latérale permanente de 240 px + panneau de contenu détaché (`my-2 mr-2 rounded-2xl`,
  bordure `ink-100` / `white/10` pour rester lisible en sombre).
- Le panneau mesure `fenêtre − 248 px`. **Tous les seuils de colonnes se raisonnent sur cette
  largeur**, pas sur celle de la fenêtre.
- `Container` : 1280 px maximum, gouttière 32 px.

## Grilles

| Largeur de fenêtre | Colonnes de cartes | Largeur utile d'une carte |
|---|---|---|
| 1024–1279 | 3 | ≥ 230 px |
| 1280–1535 | 4 | ≥ 230 px |
| ≥ 1536 | 5 | ≥ 230 px |

Le nombre de lieux affichés est un multiple du nombre de colonnes (jamais de rangée orpheline).
Les listes (classements, recherche, ajout, modération) passent en **2 colonnes**.

## Lecture

- Corps de texte : 15/24, 100 caractères par ligne au plus (`max-w-3xl`).
- Fiche d'un lieu : colonne principale (critères, avis) + colonne latérale de 360 px
  (note, coordonnées, actions).

## Interaction

- Survol et focus visibles partout (voir MASTER).
- Barres de défilement visibles.
- Les entrées de navigation sont de vrais liens (`Link` + `href`) : clic du milieu et copie du lien.
- Raccourci `/` : ouvre la recherche (hors champ de saisie).
- Entrée valide les formulaires.
