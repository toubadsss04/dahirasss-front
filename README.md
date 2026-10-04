# dahirasss-front

Interface du Dahira Sant Serigne Saliou, Touba unité 4. Elle couvre deux espaces :

- **la Dahira** : membres et catégories, rencontres et cotisations du Gamou, Barkélou, dépenses,
  projets, exercices, journal et état financier ;
- **la location** : catalogue de matériel, stock, bons de commande, factures, paiements, tableau
  de bord et état financier de la location.

Stack : React 18, Vite 5, JavaScript (pas de TypeScript), Material UI 6 pour les composants riches,
Lucide pour les icônes, TanStack Query pour le cache serveur, Zustand pour l'état global, i18next
pour le français et l'arabe. L'application est une PWA installable.

L'API correspondante est le dépôt `dahirasss-api`.

---

## Mise en route

Prérequis : Node.js 20.

```bash
npm install
cp .env.example .env.development   # renseigner VITE_API_BASE_URL
npm run dev
```

Par défaut, l'interface appelle `http://127.0.0.1:8000/api/v1`. L'API doit tourner en parallèle et
l'origine de l'interface (`http://localhost:5173` en local) doit figurer dans son `ALLOWED_ORIGINS`.

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | build de production dans `dist/` |
| `npm run preview` | servir le build localement |
| `npm run lint` | ESLint puis vérification des traductions |
| `npm run i18n:check` | vérification des traductions seule |

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `VITE_API_BASE_URL` | Adresse de l'API, `/api/v1` compris. |

Elle est incluse dans le bundle envoyé au navigateur : ce n'est pas un secret. En local, elle vit
dans `.env.development` ; en production, dans `render.yaml`.

## Architecture

```
src/
  components/
    layout/       coquille : barre latérale, barre supérieure, sélecteur d'exercice
    ui/           composants de présentation (tableaux, cartes, badges, dialogues)
    forms/        champs communs : AppSelect, MemberPicker
    projects/     composants des projets
    rental/       composants de la location (formulaires, lignes, totaux, retours)
  pages/          écrans ; pages/rental/ pour la location
  routes/         arbre des routes et gardes d'accès par rôle
  services/       appels API et logique front, un fichier par domaine
  store/          état global Zustand (session, exercice choisi, notifications, thème)
  hooks/          hooks réutilisables (permissions, mutations, recherche différée)
  constants/      routes, navigation et rôles, libellés, clés de cache, constantes métier
  utils/          fonctions pures : formatage, validation, erreurs API
  i18n/           traductions fr.js et ar.js
  theme/          jetons CSS, styles globaux, thème Material UI
```

Les composants restent de présentation : les appels réseau et les calculs vivent dans
`src/services/`, l'état partagé dans `src/store/`, les données serveur dans TanStack Query.

## Session et authentification

- Le jeton d'accès vit en mémoire. Quand il expire, `services/apiClient.js` le renouvelle en
  silence avec le jeton de renouvellement puis rejoue la requête ; plusieurs requêtes en échec
  attendent un seul renouvellement. La déconnexion n'a lieu que si le serveur refuse ce
  renouvellement, jamais sur une simple coupure réseau.
- Le jeton de renouvellement est gardé par onglet (`services/tokenStorage.js`), avec une copie
  partagée pour qu'un nouvel onglet reprenne la dernière session. Deux comptes peuvent donc être
  connectés dans deux onglets sans se déconnecter l'un l'autre.
- La connexion se fait en trois branches décidées par l'API : saisir son mot de passe, en créer
  un, ou attendre l'autorisation de l'administrateur.

## Rôles et navigation

| Rôle | Voit |
|---|---|
| Super administrateur | tout, y compris utilisateurs et journal d'audit |
| Gestionnaire | l'espace Dahira |
| Gestionnaire location | l'espace location uniquement ; l'accueil le mène au tableau de bord location |

Le modèle de navigation (`constants/navigation.js`) et les gardes de routes
(`routes/AppRouter.jsx`, `routes/ProtectedRoute.jsx`) reprennent les mêmes règles que l'API.
Masquer un menu n'est jamais la sécurité : c'est l'API qui refuse.

## Données et cache

Chaque écriture passe par `useDomainMutation(domaine, appel)`. Ce que chaque domaine rafraîchit
est déclaré une fois dans `constants/queryKeys.js` (`INVALIDATION`) : un nouvel écran ne peut pas
laisser une liste périmée ailleurs.

## Espace location

| Écran | Rôle |
|---|---|
| Tableau de bord | facturé, encaissé, reste à recouvrer, bons du jour, articles les plus loués |
| État financier | sur le mois en cours ou une période libre : facturation, encaissements par mode, reste dû, chiffre par article, factures de la période |
| Bons de commande | liste, création, modification, confirmation, sortie, retour, annulation, PDF |
| Factures | émises depuis un bon, paiements partiels, annulation, PDF |
| Articles et stock | catalogue, fiche article, mouvements de stock |
| Catégories et unités | paramétrage du catalogue |

Le formulaire d'un bon de commande affiche, pour chaque article, ce qui est libre sur la période,
et calcule les totaux comme l'API les stockera (`services/rental.service.js` : `priceLine`,
`priceOrder`, arrondi au franc identique). Les PDF sont générés par l'API et téléchargés avec le
jeton de session.

## Conventions

- **Aucune liste déroulante native** : toute liste passe par `AppSelect` (hauteur du panneau
  plafonnée, la liste défile). Le choix d'un membre passe par `MemberPicker`.
- **Aucun texte en dur** : tout ce qui s'affiche est dans `src/i18n/fr.js` et `src/i18n/ar.js`.
  `npm run lint` refuse un texte écrit dans un composant, une clé présente dans une seule langue,
  ou une valeur arabe restée en français. Les pluriels arabes déclarent leurs six formes.
- **Erreurs** : l'API renvoie un code stable ; `utils/apiErrors.js` affiche sa traduction
  (`errors.api.<code>`) et, à défaut, la phrase française de l'API.
- **Vocabulaire** : les dons s'appellent Barkélou, les « entities » de l'API sont des catégories.
  Un membre sans catégorie s'affiche « Sans catégorie ».
- **Montants et dates** : francs CFA entiers, dates au fuseau de Dakar
  (`utils/format.js`).
- **Documentation** : JSDoc en anglais, pas de commentaires en ligne.

## Thème

Clair, sombre, ou réglage du système. Les jetons vivent dans `src/theme/tokens.css` ; le thème
Material UI reprend les mêmes valeurs. L'interface passe de gauche à droite en droite à gauche
avec l'arabe.

## Application installable

Sur Android, Chrome propose l'installation depuis le menu ; sur iOS, Safari l'installe par
Partager puis « Sur l'écran d'accueil ». Seule la coquille est mise en cache : les chiffres
financiers ne le sont jamais. Les mises à jour sont proposées par une notice, jamais appliquées
d'office, pour ne pas perdre une saisie en cours.

Les icônes se régénèrent depuis le logo avec `python scripts/generate_icons.py` (demande Pillow,
qui n'est pas une dépendance de l'application).

## Déploiement sur Render

Le site répond sur `https://dssstouba04.onrender.com`. L'adresse découle du nom du service dans
`render.yaml` : ne pas le renommer.

1. Pousser sur la branche `main`.
2. Sur Render, créer un Blueprint à partir du dépôt. Site statique, aucune variable secrète.
3. `VITE_API_BASE_URL` est fixée dans `render.yaml`.

Trois réglages de `render.yaml` sont à conserver : la réécriture de toute adresse inconnue vers
`index.html` (sinon un rechargement sur une page interne échoue), le service worker jamais mis en
cache (sinon une nouvelle version met des jours à atteindre un téléphone), et le manifeste servi
avec son type (sinon le navigateur cesse de proposer l'installation).
