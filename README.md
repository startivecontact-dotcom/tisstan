# ⚡ TisStan

Application mobile privée de coaching fitness & vie pour **Stanne** et **Tissam**.
Nutrition, poids, sommeil, sport, habitudes, hydratation, projets, mur de motivation,
coach IA 24h/24, gamification — le tout dans une interface sombre premium
(noir / blanc / vert / bleu), style Apple × Whoop × Notion.

## 🚀 Lancement en 30 secondes (Expo Go)

```bash
npm install
npx expo start
```

Scannez le QR code avec **Expo Go** (iOS/Android). C'est tout.

> **Mode démo intégré** : sans aucune configuration, l'app démarre avec des
> données locales réalistes (3 semaines d'historique pour Stanne et Tissam)
> et une IA hors-ligne. Sur l'écran de connexion, choisissez un profil et
> entrez n'importe quel code à 4 chiffres.

## 🧱 Stack

| Domaine | Techno |
|---|---|
| Framework | React Native + Expo SDK 53 (Expo Router) |
| Langage | TypeScript strict |
| Style | NativeWind (Tailwind CSS) |
| Données serveur | Firebase — Firestore, Storage, Authentication |
| Cache & fetching | TanStack React Query |
| État global | Zustand (persisté AsyncStorage) |
| Formulaires | React Hook Form |
| IA | Gemini API (`gemini-2.0-flash`) avec fallback hors-ligne |
| Animations | Reanimated 3 + SVG (anneaux Apple Fitness, courbes, barres) |
| Notifications | Expo Notifications (rappels locaux quotidiens) |

> Note : les graphiques sont des composants SVG maison animés avec Reanimated
> (`src/components/charts/`) plutôt que Victory/Skia — même rendu, zéro
> dépendance native fragile, 100 % compatible Expo Go.

## 📱 Fonctionnalités

- **Dashboard** : score du jour (0-100), anneaux façon Apple Fitness
  (calories, eau, sommeil), macros, streak, citation, insight IA, défi du jour, niveau/XP.
- **Poids** : historique, graphique avec objectif, IMC, masse grasse estimée
  (Deurenberg), poids idéal (Lorentz), commentaire IA à chaque pesée.
- **Nutrition** : 4 types de repas, aliments détaillés (kcal, protéines, glucides,
  lipides, fibres, sucre, sodium), analyse IA de chaque repas,
  **scan photo** (Gemini Vision reconnaît les aliments et estime les macros).
- **Sommeil** : coucher/réveil, durée auto (passage de minuit géré), qualité,
  fatigue, graphique 7 nuits, conseils IA.
- **Sport** : programmes réutilisables, séances datées, séries/reps/charges,
  timer de repos + chronomètre de séance, records personnels automatiques,
  volume hebdomadaire.
- **Habitudes** : coche quotidienne, grille semaine, streak par habitude.
- **Hydratation** : compteur de verres, anneau animé, historique 7 jours.
- **Projets** : objectifs, kanban (à faire / en cours / terminé), sous-tâches,
  deadlines, commentaires — partagés entre les deux.
- **Mur de motivation** : posts privés (texte + photo), réactions ❤️🔥💪, commentaires.
- **Coach IA** : chat 24h/24 qui connaît poids, repas du jour, sommeil et séances.
- **Calendrier** : vue mensuelle avec pastilles par type d'activité.
- **Statistiques** : tous les graphiques (poids, calories, sommeil, eau, sport, habitudes).
- **Photos** : avant/après, repas, motivation, entraînement (Firebase Storage).
- **Gamification** : XP, niveaux, 5 badges, défis quotidiens/hebdo,
  classement Stanne vs Tissam.
- **Notifications** : 6 rappels quotidiens (pesée, repas ×2, eau, sport, sommeil),
  activables dans Profil.

## 🔥 Configuration Firebase (optionnelle)

1. Créez un projet sur [console.firebase.google.com](https://console.firebase.google.com)
   et une app **Web** (les clés Web servent au SDK JS utilisé par Expo).
2. Activez **Authentication → Email/Password** et créez les deux comptes
   (ex. `stanne@tisstan.app`, `tissam@tisstan.app`).
3. Activez **Firestore** et **Storage**.
4. Copiez `.env.example` → `.env` et remplissez les clés.
5. Déployez les règles et indexes :

```bash
cd firebase
firebase deploy --only firestore:rules,firestore:indexes,storage
```

6. Créez la collection `emailMap` (une fois, via la console) pour mapper les
   emails vers les identifiants applicatifs :

```
emailMap/stanne@tisstan.app  → { userId: "stanne" }
emailMap/tissam@tisstan.app  → { userId: "tissam" }
```

### Collections Firestore

`users`, `weight`, `meals`, `sleep`, `hydration`, `workouts`, `habits`,
`projects` (tâches/kanban imbriquées), `posts` (mur + réactions + commentaires),
`photos`, `aiHistory`, `emailMap`.
Les indexes composites (`userId + createdAt`, `userId + date + createdAt`)
sont dans `firebase/firestore.indexes.json`.

## 🤖 Configuration IA (optionnelle)

Créez une clé sur [Google AI Studio](https://aistudio.google.com/apikey) et
renseignez `EXPO_PUBLIC_GEMINI_API_KEY` dans `.env`. Sans clé, un coach
hors-ligne à base d'heuristiques répond (analyse de repas, commentaires de
pesée, conseils sommeil, chat).

## 🗂 Architecture

```
app/                    # Écrans (Expo Router, file-based)
  (tabs)/               #   Accueil · Nutrition · Sport · Coach IA · Plus
  projects/, workout/   #   Détails (kanban, séance en cours)
  weight, sleep, …      #   Écrans secondaires
src/
  components/           # UI réutilisable (Card, Ring, ProgressBar, charts…)
  constants/            # Thème, utilisateurs, citations, objectifs par défaut
  hooks/                # useData (CRUD React Query), useDashboard (agrégats)
  services/
    firebase/           # Init conditionnelle (mode démo si .env vide)
    data/               # Repo générique Firestore ⇄ AsyncStorage + seed démo
    ai/                 # Service IA unique (chat, repas, photo, poids, sommeil)
    notifications.ts    # Rappels quotidiens locaux
    photos.ts           # Picker + upload Storage
  stores/               # Zustand (auth persistée)
  types/                # Modèles TypeScript
  utils/                # nutrition, score, streak, gamification, dates (+ tests)
firebase/               # firestore.rules · storage.rules · indexes
```

## ✅ Tests & qualité

```bash
npm test           # Jest (logique métier : score, streaks, XP, nutrition, dates)
npm run typecheck  # TypeScript strict
```
