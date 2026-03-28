# HERAKL - Migration vers Supabase

## Vue d'ensemble

HERAKL a été migré de localStorage (client-side) vers **Supabase** pour la production avec authentification réelle, base de données, stockage de documents et Edge Functions.

## Qu'est-ce qui a changé

### Avant (localStorage)
- ❌ Données stockées localement seulement
- ❌ Authentification simulée (Google OAuth mocké)
- ❌ Pas de persistence multi-device
- ❌ Analyse hardcodée
- ❌ Documents stockés en localStorage

### Après (Supabase)
- ✅ Base de données PostgreSQL centralisée
- ✅ Authentification réelle Supabase (email/password)
- ✅ Données accessibles partout
- ✅ Edge Functions pour analyses intelligentes
- ✅ Supabase Storage pour les documents
- ✅ Row Level Security pour protéger les données
- ✅ Sessions persistantes server-side

## Architecture

### Base de données (10 tables)
```
properties                  → Propriétés principales
├── property_analysis       → Scores et résultats d'analyse
├── property_context        → Contexte marché
├── property_risks          → Évaluation des risques
├── property_energy         → Performance énergétique
├── property_documents      → Métadonnées documents
├── property_history        → Historique de travaux
├── property_verification   → Vérification propriétaire
├── share_links             → Liens partageables
└── property_collaborators  → Gestion des accès
```

**Sécurité** : Row Level Security (RLS) activé sur toutes les tables
- Users accèdent seulement à leurs propriétés
- Collaborateurs accèdent selon rôle (owner, editor, viewer)
- Share links accessibles par token public

### Authentification
- **Méthode** : Email + Mot de passe (via Supabase Auth)
- **Endpoints** :
  - Signup : `/auth.html`
  - Login : `/auth.html`
  - Callback gérée automatiquement
- **Session** : JWT (persiste côté client + server-side)

### Edge Functions
- **analyze-property** : Analyse intelligente d'une propriété
  - Agrège données officielles
  - Calcule scores (structure, énergie, risques, global)
  - Génère recommandations personnalisées
  - Retourne valeur estimée

### Stockage
- **Supabase Storage** : Documents des propriétés
- **Bucket** : `property-documents`
- **Chemin** : `{property_id}/{timestamp}-{filename}`

## Fichiers clés

### Nouveaux fichiers de production
```
supabase.js              → Client Supabase réutilisable
dashboard-api.js         → Couche d'abstraction API
auth.html                → Authentification Supabase
onboarding.html          → Onboarding moderne
dashboard.html           → Dashboard moderne
index-new.html           → Landing page nouvelle
```

### Edge Functions
```
supabase/functions/analyze-property/index.ts
```

### Configuration
```
vite.config.js           → Configuration Vite
package.json             → Dépendances npm
.env                     → Clés Supabase
```

## Guide d'utilisation

### 1. Authentification
```javascript
import { signUp, signIn, getSession } from './supabase.js';

// Inscription
const { data, error } = await signUp(email, password, firstName, lastName);

// Connexion
const { data, error } = await signIn(email, password);

// Vérifier session
const { session, error } = await getSession();
```

### 2. Gestion des propriétés
```javascript
import { createNewProperty, loadUserProperties } from './dashboard-api.js';

// Créer une propriété
const { data: property, error } = await createNewProperty(
  addressData,
  'maison',
  120,
  'T3'
);

// Charger toutes les propriétés
const { data: properties, error } = await loadUserProperties();
```

### 3. Analyse
```javascript
// Call Edge Function
const response = await fetch(
  `${supabaseUrl}/functions/v1/analyze-property`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ property }),
  }
);
const analysis = await response.json();
```

### 4. Documents
```javascript
import { uploadDocument, getDocuments } from './supabase.js';

// Upload
const { data, error } = await uploadDocument(propertyId, file, 'DPE');

// Récupérer
const { data: docs, error } = await getDocuments(propertyId);
```

## Variables d'environnement

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_SUPABASE_ANON_KEY=eyJhbGci...
```

⚠️ **Important** : Ne commitez jamais `.env` en production. Utilisez les secrets Supabase.

## Flow utilisateur

```
Landing (index-new.html)
  ↓
Auth (auth.html)
  - Signup/Login email
  - JWT session créée
  ↓
Onboarding (onboarding.html)
  - Formulaire multi-étapes
  - Crée property en DB
  - Call analyze-property Edge Function
  - Affiche résultats
  ↓
Dashboard (dashboard.html)
  - Affiche propriétés user
  - Gère collaborateurs
  - Partage links
  - Gère documents
```

## Sécurité

### RLS (Row Level Security)
- **Properties** : User ne voit que ses propriétés + collaborations
- **Documents** : Accessible selon accès à property
- **Share links** : Accessibles par token public
- **Verification** : Admin only

### Authentification
- Passwords hashés (bcrypt via Supabase)
- JWT expiration configurable
- Refresh tokens automatiques
- Support future : 2FA

### Données
- All data chiffré in transit (HTTPS)
- Backup automatique (Supabase)
- No plaintext credentials

## Performances

### Optimisations
- Lazy loading des modules
- Compression gzip (Vite)
- Images optimisées (Pexels CDN)
- Caching côté client via localStorage

### Limites actuelles
- Pas de pagination (assume < 100 propriétés par user)
- Pas d'indexing spécial RLS (peut ralentir à scale)

## Tests

### Checklist de test
- [ ] Signup nouveau compte
- [ ] Login compte existant
- [ ] Créer propriété
- [ ] Analyser propriété (edge function)
- [ ] Upload document
- [ ] Créer share link
- [ ] Accéder shared link
- [ ] Inviter collaborateur
- [ ] Accès RLS (user ne voit pas autre user's data)

## Déploiement

### Production (Vercel / Netlify / Supabase Hosting)
```bash
# Build
npm run build

# Deploy dist/ folder
# Environment vars:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_SUPABASE_ANON_KEY
```

### Supabase CLI (optionnel)
```bash
# Init Supabase
supabase init

# Deploy functions
supabase functions deploy analyze-property
```

## Prochaines étapes

### Court terme
- [ ] Intégrer vraies APIs (DVF, Géorisques, DPE)
- [ ] Améliorer UX onboarding
- [ ] Add pagination dashboard

### Moyen terme
- [ ] Social login (Google, GitHub)
- [ ] 2FA
- [ ] Export PDF dossier
- [ ] Notifications email

### Long terme
- [ ] Mobile app (React Native)
- [ ] AI recommendations
- [ ] Predictive analytics
- [ ] Marketplace des services

## Support

Pour toute question sur la migration :
1. Consultez cette doc
2. Vérifiez logs Supabase
3. Testez RLS policies
4. Check environment variables

Bonne chance! 🚀
