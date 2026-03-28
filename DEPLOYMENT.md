# Déploiement HERAKL

## État actuel

✅ **Production Ready**
- Application complète avec Supabase backend
- Build successful (Vite)
- Edge Functions deployed
- RLS policies configured
- Authentication ready

## Architecture déployée

```
Frontend (HTML/CSS/JS)
    ↓
Supabase Auth
    ↓
Supabase Database (PostgreSQL + RLS)
    ↓
Supabase Storage (Documents)
    ↓
Edge Functions (Property Analysis)
```

## Fichiers critiques

### Application pages
- `index-new.html` - Landing page (remplace index.html)
- `auth.html` - Authentification Supabase
- `onboarding.html` - Onboarding multi-étapes
- `dashboard.html` - Dashboard utilisateur

### Modules JS
- `supabase.js` - Client Supabase réutilisable (10 KB)
- `dashboard-api.js` - Couche API métier

### Edge Functions
- `supabase/functions/analyze-property/index.ts` - Analyse propriété

### Config
- `vite.config.js` - Build config
- `package.json` - Dépendances
- `.env` - Variables d'environnement (⚠️ ne pas commit)

## Déploiement automatique (Recommandé)

### Option 1: Vercel (meilleur)
```bash
# 1. Push vers GitHub
git init
git add .
git commit -m "Initial commit"
git push origin main

# 2. Importer dans Vercel
# Dashboard → Add New → Project → Import Git Repo

# 3. Configurer env vars
# VITE_SUPABASE_URL
# VITE_SUPABASE_SUPABASE_ANON_KEY

# 4. Deploy button → Deploy
```

### Option 2: Netlify
```bash
# 1. Connecter GitHub repo

# 2. Build command: npm run build
# Publish directory: dist

# 3. Environment variables:
# VITE_SUPABASE_URL
# VITE_SUPABASE_SUPABASE_ANON_KEY

# 4. Auto-deploy on push
```

### Option 3: Docker
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV VITE_SUPABASE_URL=$SUPABASE_URL
ENV VITE_SUPABASE_SUPABASE_ANON_KEY=$SUPABASE_KEY

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

```bash
# Build
docker build -t herakl .

# Run
docker run -p 3000:3000 \
  -e SUPABASE_URL=https://... \
  -e SUPABASE_KEY=... \
  herakl
```

## Déploiement manuel

### 1. Préparer le build
```bash
npm install
npm run build
```

Cela crée le dossier `dist/` contenant la version optimisée.

### 2. Déployer sur hébergement statique

**AWS S3 + CloudFront:**
```bash
aws s3 sync dist/ s3://your-bucket/
aws cloudfront create-invalidation --distribution-id E1234 --paths "/*"
```

**Google Cloud Storage:**
```bash
gsutil -m cp -r dist/* gs://your-bucket/
```

**Heroku:**
```bash
# Créer app
heroku create herakl-app

# Deploy
git push heroku main

# Voir logs
heroku logs --tail
```

## Checklist pré-déploiement

- [ ] `npm run build` réussit sans erreur
- [ ] `.env` NOT committed
- [ ] Env vars configurées chez provider
- [ ] VITE_SUPABASE_URL valide
- [ ] VITE_SUPABASE_SUPABASE_ANON_KEY valide
- [ ] Edge Function deployed
- [ ] RLS policies active
- [ ] Storage bucket accessible
- [ ] Test signup/login
- [ ] Test créer propriété
- [ ] Test analyser propriété
- [ ] Test upload document
- [ ] Test share link

## Monitoring post-déploiement

### Application
```
Erreurs JS: Check browser console
Performance: Lighthouse score > 80
Loading time: < 3s
```

### Supabase
```
Dashboard → Database → Logs
Dashboard → Edge Functions → Logs
Dashboard → Authentication → Logs
Storage → property-documents → Usage
```

### Analytics
```
// Optionnel: ajouter Sentry/LogRocket
import * as Sentry from "@sentry/browser";
Sentry.init({ dsn: "..." });
```

## URLs de référence

### Développement local
```
http://localhost:5173/
```

### Production
```
https://herakl-app.vercel.app/
```

### Supabase dashboard
```
https://app.supabase.com/project/0ec90b57d6e95fcbda19832f/
```

## Rollback

Si problème détecté:

**Vercel:**
- Dashboard → Deployments → Click previous build → Redeploy

**Netlify:**
- Site settings → Deploys → Click previous build → Publish

**GitHub Pages:**
```bash
git revert <commit>
git push
```

## Performance optimisations

### Frontend
- ✅ CSS/JS minified (Vite)
- ✅ Tree-shaking unused code
- ✅ Lazy load modules
- ✅ Image optimization

### Backend
- ✅ Database indexes on user_id, property_id
- ✅ RLS optimized queries
- ✅ Edge Function caching potential

### Future
- [ ] Redis cache layer
- [ ] CDN pour assets
- [ ] Image compression (Cloudinary)
- [ ] Database query optimization

## Budgets & Coûts (estimation)

### Vercel
- Free tier: up to 100GB bandwidth
- Pro: $20/month
- Estimated: **$0-20/month**

### Supabase
- Free: up to 500MB storage, 2 projects
- Pro: $25/month per project
- Estimated: **$25/month**

### Total: **$25-45/month**

## Escalade support

| Issue | Contact |
|-------|---------|
| Build fails | Check error logs, npm packages |
| RLS blocks access | Verify policies in Supabase |
| Edge Function timeout | Optimize code, add caching |
| CORS error | Check Edge Function headers |
| Auth not working | Verify env vars, Supabase config |

## Documentation

- MIGRATION.md - How we migrated from localStorage
- SUPABASE_SETUP.md - Supabase configuration
- This file - Deployment guide

---

**Ready to deploy!** Choose your platform and follow the steps above. 🚀
