# Archives Concept Store Treasure Hunt

Application web Next.js pour une chasse au tresor premium a Rennes, concue pour les 2 ans d'Archives Concept Store.

## Stack

- Next.js App Router
- React
- Tailwind CSS
- Leaflet + React Leaflet
- API Next.js + fichier JSON partage pour la progression

## Installation

```bash
npm install
```

Si vous voulez activer la vraie synchronisation multi-utilisateur avec Supabase, copiez aussi:

```bash
cp .env.example .env.local
```

## Lancement en local

```bash
npm run dev
```

Le site sera accessible sur [http://localhost:3000](http://localhost:3000).

Sans variables Supabase, le projet utilise `data/shared-progress.json` en local.

Avec Supabase configure, le projet utilise la base partagee automatiquement.

## Build de production

```bash
npm run build
npm run start
```

## Deploiement

### Vercel

- Importer le repository dans Vercel
- Conserver les commandes par defaut: `npm install`, `npm run build`
- Framework detecte: Next.js
- Ajouter les variables `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROGRESS_TABLE` et `SUPABASE_EVENT_KEY`
- Executer le SQL de [schema.sql](/Users/sho/Documents/New%20project%203/supabase/schema.sql) dans l'editeur SQL Supabase
- Une fois les variables definies, la progression partagee fonctionne sur Vercel

### Netlify

- Build command: `npm run build`
- Publish directory: `.next`
- Utiliser le connecteur Next.js de Netlify
- Ajouter les memes variables Supabase que pour Vercel
- Executer le SQL de [schema.sql](/Users/sho/Documents/New%20project%203/supabase/schema.sql)

### VPS

- Installer Node.js 20+
- Executer `npm install`
- Lancer `npm run build`
- Servir l'application avec `npm run start`
- Option recommande: reverse proxy Nginx
- Soit garder le fichier JSON partage sur le serveur
- Soit brancher Supabase avec les variables d'environnement

## Configuration Supabase

1. Creez un projet sur [Supabase](https://supabase.com).
2. Ouvrez l'editeur SQL et executez [schema.sql](/Users/sho/Documents/New%20project%203/supabase/schema.sql).
3. Recuperez l'URL du projet et la `service_role key`.
4. Remplissez [/.env.example](/Users/sho/Documents/New%20project%203/.env.example) dans votre `.env.local`.

Variables utilisees:

- `SUPABASE_URL`: URL du projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: cle serveur, a ne jamais exposer cote client
- `SUPABASE_PROGRESS_TABLE`: nom de la table, par defaut `treasure_hunt_progress`
- `SUPABASE_EVENT_KEY`: identifiant de l'evenement, utile si vous gerez plusieurs chasses

## Structure

```text
app/
  globals.css
  layout.tsx
  page.tsx
components/
  map-view.tsx
  treasure-hunt-app.tsx
data/
  hunt-config.ts
lib/
  utils.ts
public/
  brand/
    archives-logo.svg
```

## Modifier le logo, les lieux et les codes

Tout est centralise dans [hunt-config.ts](/Users/sho/Documents/New%20project%203/data/hunt-config.ts).

Vous pouvez y changer:

- le reset admin via `admin.resetPassword`
- le logo via `huntConfig.logo.src`
- les textes de l'evenement
- la ville et le centrage de la carte
- les lieux
- les indices
- les codes de validation a 4 chiffres
- le code secret final
- le message final affiche apres validation

Le logo par defaut est dans [archives-logo.svg](/Users/sho/Documents/New%20project%203/public/brand/archives-logo.svg). Remplacez ce fichier par votre vrai logo, ou changez simplement le chemin `huntConfig.logo.src`.

Chaque etape contient:

- `name`
- `address`
- `lat`
- `lng`
- `hint`
- `description`
- `validationCode`

L'ordre du tableau definit l'ordre de debloquage.

## Fonctionnalites incluses

- Hero premium avec CTA "Commencer"
- Carte interactive centree sur Rennes
- Markers personnalises selon l'etat de progression
- Systeme verrouille / deverrouille / valide
- Validation d'etape par code a 4 chiffres
- Progression partagee via `/api/progress`
- Reset interne via `/wowlepaneldefou`
- Ecran final avec code secret
- Interface responsive mobile et desktop

## Evolution possible

L'architecture est volontairement simple pour faciliter une evolution vers:

- Supabase
- Firebase
- API REST ou headless CMS
- Authentification participant
- Tableau d'administration
