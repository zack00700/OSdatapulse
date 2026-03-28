# 📇 OS DataPulse — Guide d'installation (Mac)

API d'enrichissement de données B2B.
**Backend** FastAPI (Python) + **Frontend** Next.js + **DB** PostgreSQL via Docker

---

## 🏗️ Ce qui se lance où

```
Terminal 1 → Docker (PostgreSQL + Redis)
Terminal 2 → Backend Python  → http://localhost:8001
Terminal 3 → Frontend Next.js → http://localhost:3001
```

---

## ⚙️ Étape 0 — Vérifier les prérequis

```bash
python3 --version   # doit afficher 3.10 ou plus
node --version      # doit afficher 18 ou plus
docker --version    # doit afficher 24 ou plus
```

### Si quelque chose manque

```bash
# Installer Homebrew si pas déjà fait
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Python
brew install python3

# Node.js
brew install node
```

Docker Desktop → https://www.docker.com/get-started
Ouvrir l'app après installation → attendre la baleine 🐳 dans la barre de menu.

---

## 🚀 Lancement rapide (recommandé)

Une fois les scripts installés, tout se lance en une commande :

```bash
cd ~/Documents/GitHub/OSDataPulse
chmod +x start.sh stop.sh
./start.sh
```

---

## 📁 Structure du projet

```
datapulse-full/
├── start.sh                      ← Lance tout automatiquement
├── stop.sh                       ← Arrête tout automatiquement
├── .gitignore                    ← Fichiers à exclure de Git
├── docker-compose.yml            ← Lance PostgreSQL + Redis
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── enrich.py
│   │   └── apikeys.py
│   └── scrapers/
│       └── enrichment_engine.py  ← Sources gratuites actives
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── .env.local.example
    └── src/
        ├── app/
        │   ├── (auth)/login/
        │   ├── (auth)/register/
        │   └── dashboard/
        │       ├── page.tsx          ← Stats réelles
        │       ├── enrich/           ← Enrichissement live
        │       ├── history/          ← Historique
        │       ├── apikeys/          ← Clés API
        │       └── billing/          ← Crédits
        └── lib/
            ├── api.ts
            └── auth-context.tsx
```

---

## 🐳 Terminal 1 — Base de données

```bash
cd ~/Documents/GitHub/OSDataPulse
```

Ouvrir `docker-compose.yml` et supprimer la ligne `version: "3.9"` si elle existe.

```bash
docker compose up -d
docker compose ps
```

Tu dois voir `db` et `redis` avec le statut `running` ✅

> Note : DataPulse utilise les ports **5433** et **6380** pour ne pas
> entrer en conflit avec FraudShield si les deux tournent en même temps.

---

## 🐍 Terminal 2 — Backend Python

```bash
cd ~/Documents/GitHub/OSDataPulse/backend
```

### Créer l'environnement virtuel (une seule fois)

```bash
python3 -m venv venv
source venv/bin/activate
```

> Tu dois voir `(venv)` au début de la ligne ✅

### Installer les dépendances (une seule fois)

```bash
pip install -r requirements.txt

# Fix compatibilité bcrypt sur Mac
pip install bcrypt==4.0.1
```

### Configurer les variables d'environnement (une seule fois)

```bash
cp .env.example .env
```

Générer une clé secrète :

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Ouvrir `.env` et remplacer `SECRET_KEY` :

```bash
nano .env
```

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/datapulse
REDIS_URL=redis://localhost:6380
SECRET_KEY=colle_ta_cle_ici
CACHE_TTL_SECONDS=86400

# Sources payantes — laisser vide pour l'instant
HUNTER_API_KEY=
PROXYCURL_API_KEY=
```

Sauvegarder : `Ctrl+O` → `Enter` → `Ctrl+X`

### Initialiser la base de données (une seule fois)

```bash
python3 -c "from database import init_db; init_db()"
```

### Lancer le backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

Tu dois voir :

```
✅ DataPulse API v1.0.0 démarré
INFO: Uvicorn running on http://0.0.0.0:8001
```

→ http://localhost:8001/docs ✅

---

## ⚛️ Terminal 3 — Frontend Next.js

```bash
cd ~/Documents/GitHub/OSDataPulse/frontend
```

### Installer les dépendances (une seule fois)

```bash
npm install
```

### Configurer l'URL du backend (une seule fois)

```bash
cp .env.local.example .env.local
```

Le fichier `.env.local` doit contenir :

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Lancer le frontend

```bash
npm run dev
```

→ http://localhost:3001 ✅

---

## ✅ Vérification finale

| Terminal | URL |
|---|---|
| Docker | — |
| Backend | http://localhost:8001/docs |
| Frontend | http://localhost:3001 |

---

## 🔄 Tester l'enrichissement

### 1. Créer un compte

Aller sur http://localhost:3001/register
→ 50 crédits offerts à l'inscription ✅

### 2. Tester depuis le terminal

```bash
curl -X POST http://localhost:8001/v1/enrich/company \
  -H "x-api-key: dp_prod_TA_CLE_ICI" \
  -H "Content-Type: application/json" \
  -d '{"name": "Wave Mobile Money", "country": "SN"}'
```

Réponse attendue :

```json
{
  "name": "Wave Mobile Money",
  "domain": "wave.com",
  "industry": "Fintech",
  "confidence_score": 0.75,
  "sources_used": ["clearbit", "duckduckgo"],
  "credits_used": 1
}
```

---

## 🔁 Relancer les prochaines fois

```bash
# Terminal 1
cd ~/Documents/GitHub/OSDataPulse
docker compose up -d

# Terminal 2
cd ~/Documents/GitHub/OSDataPulse/backend
source venv/bin/activate
uvicorn main:app --reload --port 8001

# Terminal 3
cd ~/Documents/GitHub/OSDataPulse/frontend
npm run dev
```

> `init_db`, `npm install` et `pip install` ne sont à faire qu'une seule fois.

---

## 🌍 Sources de données actives

| Source | Données | Limite |
|---|---|---|
| Clearbit Autocomplete | Domaine, logo | Illimitée |
| OpenCorporates | Données légales | 500 req/jour |
| DuckDuckGo | Description | Illimitée |

### Activer Hunter.io (emails)

```env
# Dans backend/.env
HUNTER_API_KEY=ta_cle_hunter
```

Gratuit jusqu'à 25 req/mois sur https://hunter.io

---

## 🐛 Problèmes fréquents

### `command not found: python` → utiliser `python3`

```bash
python3 -m venv venv
python3 -c "from database import init_db; init_db()"
```

### Erreur bcrypt

```bash
pip install bcrypt==4.0.1
```

### `(venv)` n'apparaît pas

```bash
source venv/bin/activate
```

### Docker daemon not running

Ouvrir Docker Desktop et attendre la baleine 🐳

### Port déjà utilisé

```bash
lsof -ti:8001 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### CORS error

Vérifier que `.env.local` contient :
```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```
Puis redémarrer le frontend.

### Conflit avec FraudShield

DataPulse utilise des ports différents exprès :
- PostgreSQL → **5433** (FraudShield utilise 5432)
- Redis → **6380** (FraudShield utilise 6379)
- Backend → **8001** (FraudShield utilise 8000)
- Frontend → **3001** (FraudShield utilise 3000)

Les deux peuvent tourner en même temps sans conflit ✅

---

*OS DataPulse — OpenSID Software Development — v1.0.0*
