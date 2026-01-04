# Vercel Deployment Instructies

Deze guide helpt je om de AI Literacy Platform te deployen naar Vercel met automatische database seeding.

## Wat gebeurt er tijdens deployment?

Wanneer je naar Vercel deploy, gebeurt het volgende automatisch:

1. ✅ **Database Setup** - Maakt tabellen aan in je Neon database
2. ✅ **Data Seeding** - Vult de database met startdata (14 users, 37 content items, etc.)
3. ✅ **Frontend Build** - Bouwt je React applicatie
4. ✅ **Deployment** - Deploy naar Vercel

## Stap 1: Push Code naar GitHub

```bash
git add .
git commit -m "Add Vercel auto-seeding configuration"
git push origin claude/seed-neon-database-zBmqK
```

## Stap 2: Connect Project naar Vercel

### Via Vercel Dashboard:

1. Ga naar [vercel.com](https://vercel.com)
2. Klik op **"New Project"**
3. Import je GitHub repository: `ai-literacy-platform`
4. Vercel detecteert automatisch de configuratie

### Via Vercel CLI:

```bash
# Installeer Vercel CLI (als nog niet geïnstalleerd)
npm install -g vercel

# Login
vercel login

# Deploy
cd /path/to/ai-literacy-platform
vercel
```

## Stap 3: Environment Variables Instellen

In je Vercel project dashboard, ga naar **Settings > Environment Variables** en voeg toe:

### PostgreSQL (Neon) Credentials:
```
PG_HOST=ep-curly-lake-agc8n0as-pooler.c-2.eu-central-1.aws.neon.tech
PG_USER=neondb_owner
PG_PASSWORD=npg_l4bztWmo6xkE
PG_NAME=neondb
PG_PORT=5432
```

### JWT Configuration:
```
JWT_SECRET=your-production-secret-key-change-this-to-something-secure
JWT_EXPIRE=30d
```

### Server Configuration:
```
NODE_ENV=production
PORT=5002
```

**Belangrijk:**
- ✅ Zorg dat alle environment variables zijn ingesteld voor **Production**, **Preview** én **Development**
- ✅ Voor `JWT_SECRET` gebruik een sterke, unieke waarde in productie

## Stap 4: Deploy Triggers

### Automatische Deployment:

Elke keer dat je pusht naar GitHub, zal Vercel automatisch:
- De database seeden (alleen als deze nog leeg is)
- De frontend bouwen
- Deployen

### Handmatige Deployment:

```bash
vercel --prod
```

## Stap 5: Database Seeding

### Eerste Keer:

Bij de eerste deployment wordt automatisch:
- Het database schema aangemaakt
- Alle tabellen gevuld met startdata

### Updates:

Als je later opnieuw wilt seeden:

```bash
# Lokaal uitvoeren (met je Neon credentials in server/config/config.env)
cd server
npm run setup
```

## Verificatie

Na succesvolle deployment:

1. **Check Build Logs** - Zoek naar:
   ```
   🌱 [Vercel Build] Starting database seeding...
   ✅ Database seeded successfully!
   ```

2. **Test de Applicatie** - Login met:
   - Admin: `admin@ailiteracy.nl` / `password123`
   - Student: `student@student.nl` / `password123`
   - Teacher: `teacher@teacher.nl` / `password123`

## Troubleshooting

### Build Fails met "Cannot find module 'pg'"

**Oplossing:** Zorg dat `pg` in de root `package.json` dependencies staat:
```json
{
  "dependencies": {
    "pg": "^8.16.3"
  }
}
```

### Database Connection Timeout

**Mogelijke oorzaken:**
1. Environment variables niet correct ingesteld
2. Neon database niet bereikbaar (check Neon dashboard)
3. IP whitelisting op Neon (schakel uit of voeg Vercel IPs toe)

**Check Logs:**
```bash
vercel logs [deployment-url]
```

### Tables Already Exist Error

Dit is normaal - het script controleert eerst of tabellen bestaan en slaat schema creation over indien nodig.

### Data Niet Zichtbaar

1. Check of seeding succesvol was in de build logs
2. Verifieer database credentials
3. Test de connection vanaf je lokale machine:
   ```bash
   cd server
   npm run test:connection
   ```

## Backend API (Optioneel)

Deze setup deploy alleen de frontend naar Vercel. Voor de backend heb je twee opties:

### Optie 1: Separate Backend Deployment

Deploy de backend naar een andere service zoals:
- **Railway** (aanbevolen voor Node.js backends)
- **Render**
- **Heroku**

Update dan de frontend API URL in je React app.

### Optie 2: Vercel Serverless Functions

Converteer je Express routes naar Vercel serverless functions (meer complex, aparte guide nodig).

## Nuttige Commando's

```bash
# Deploy naar production
vercel --prod

# Deploy naar preview
vercel

# Bekijk deployment logs
vercel logs

# Bekijk alle deployments
vercel ls

# Environment variables beheren
vercel env add PG_HOST
vercel env ls
```

## Post-Deployment Checklist

- [ ] Database seeding succesvol (check build logs)
- [ ] Frontend toegankelijk via Vercel URL
- [ ] Login werkt met default credentials
- [ ] Data zichtbaar (modules, content, etc.)
- [ ] Environment variables ingesteld
- [ ] Custom domain geconfigureerd (optioneel)
- [ ] Backend API gehost (als separate service)

## Volgende Stappen

1. **Custom Domain** - Koppel je eigen domain in Vercel settings
2. **Backend Hosting** - Host de backend API op Railway/Render
3. **Environment Secrets** - Wijzig `JWT_SECRET` naar een sterke productie waarde
4. **Monitoring** - Setup Vercel Analytics en logging

---

**Succes met je deployment! 🚀**

Voor vragen of problemen, check de Vercel documentation of Neon documentation.
