# Setup Supabase pour HERAKL

## Statut initial

Votre instance Supabase est déjà **provisionnée et configurée** avec :
- ✅ PostgreSQL database
- ✅ 10 tables avec RLS
- ✅ Edge Function deployed (analyze-property)
- ✅ Auth enabled
- ✅ Storage configured

## 1. Vérifier la configuration

### Vérifier les tables
```sql
-- Connect via Supabase Dashboard
-- Go to SQL Editor

SELECT * FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

**Tables devrait voir :**
- properties
- property_analysis
- property_context
- property_risks
- property_energy
- property_documents
- property_history
- property_verification
- share_links
- property_collaborators

### Vérifier RLS
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## 2. Configuration d'authentification

### Email/Password Auth (déjà configuré)
- ✅ Providers: Email + Password
- ✅ Confirmation email: Disabled (signup immédiat)
- ✅ JWT Expiration: 3600s (1h)
- ✅ Auto refresh tokens: Enabled

### Activer autres providers (optionnel)

**Google OAuth :**
1. Allez à https://console.cloud.google.com
2. Créez OAuth 2.0 Credentials (Web Application)
3. Allez Supabase Dashboard → Authentication → Providers → Google
4. Entrez Client ID et Client Secret

**GitHub OAuth :**
1. https://github.com/settings/developers → OAuth Apps → New OAuth App
2. Supabase Dashboard → Authentication → Providers → GitHub
3. Entrez Client ID et Client Secret

## 3. Configuration Edge Functions

### Edge Function: analyze-property
```
Status: Deployed ✅
URL: https://xxxxx.supabase.co/functions/v1/analyze-property
Require auth: true (JWT)
```

### Tester l'Edge Function
```javascript
import { supabase } from './supabase.js';

const property = {
  address: { city: 'Paris', street: '123 Rue' },
  property_type: 'maison',
  surface: 120,
  rooms: 'T3',
};

const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-property`;
const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ property }),
});
const analysis = await response.json();
console.log(analysis);
```

## 4. Configuration Storage

### property-documents Bucket
```
Name: property-documents
Public: false (private)
File size limit: 50MB
Allowed MIME types: application/pdf, image/*
```

### Permissions RLS
```sql
-- Users can upload to their own property
SELECT auth.uid() IN (
  SELECT user_id FROM properties
  WHERE id = property_id
);
```

## 5. Stratégies de sécurité (RLS)

### Exemple : Voir ses propriétés uniquement
```sql
CREATE POLICY "Users can view their own properties"
  ON properties FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### Exemple : Collaborateurs peuvent éditer
```sql
CREATE POLICY "Editors can update"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM property_collaborators
      WHERE property_collaborators.property_id = properties.id
      AND property_collaborators.collaborator_id = auth.uid()
      AND property_collaborators.role = 'editor'
    )
  )
  WITH CHECK (...);
```

## 6. Environnement

### Variables requises
```env
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw
```

### Production
Ne commitez **JAMAIS** le fichier `.env`. Utilisez :
- Netlify / Vercel: Environment variables dans dashboard
- Docker: Secrets ou .env non versionné
- Docker Compose: .env.production ignoré

## 7. Monitoring & Debugging

### Logs des Edge Functions
```bash
# Via Supabase CLI
supabase functions logs analyze-property --tail
```

### Logs de la base de données
Supabase Dashboard → Database → Logs

### Logs d'authentification
Supabase Dashboard → Authentication → Logs

## 8. Backup & Restore

### Automatic Backups
- ✅ Daily backups (24h retention)
- ✅ Point-in-time recovery

### Manual backup
```bash
# Via pg_dump (requires connection)
pg_dump postgresql://user:pass@db.xxxxx.supabase.co:5432/postgres > backup.sql
```

### Restore
```bash
psql postgresql://user:pass@db.xxxxx.supabase.co:5432/postgres < backup.sql
```

## 9. Scaling Considerations

### Actuel
- ✅ 1 project
- ✅ Max 100 concurrent connections
- ✅ 500MB storage

### Futur (si growth)
- Ajouter replicas read-only
- Cache layer (Redis)
- CDN pour assets
- Partitioning des tables large

## 10. Troubleshooting

### RLS Policy deny all
**Symptôme** : « No rows returned » même après insert
**Solution** : Vérifier policy USING clause

### 401 Unauthorized
**Symptôme** : JWT invalid/expired
**Solution** : Refresh token via `getSession()`

### CORS errors
**Symptôme** : Browser bloque requêtes
**Solution** : Vérifier Edge Function CORS headers

### Edge Function timeout
**Symptôme** : 504 Gateway Timeout
**Solution** : Réduire traitement, ajouter cache

## Contacts & Resources

- Docs: https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions
- Status: https://status.supabase.com

---

**Dernier update** : 2026-03-28
**Statut** : Production ready ✅
