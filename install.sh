#!/bin/bash

# ─── OS DataPulse — Installation initiale ────────────────────────────────────
# Lance ce script UNE SEULE FOIS avant le premier démarrage

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "📇 OS DataPulse — Installation..."
echo "📁 Dossier : $PROJECT_DIR"
echo ""

# ── Vérifier les prérequis ────────────────────────────────────────────────────
echo "🔍 Vérification des prérequis..."

if ! command -v python3 &> /dev/null; then
  echo "❌ Python3 non trouvé — installe-le avec : brew install python3"
  exit 1
fi
echo "✅ Python3 : $(python3 --version)"

if ! command -v node &> /dev/null; then
  echo "❌ Node.js non trouvé — installe-le avec : brew install node"
  exit 1
fi
echo "✅ Node.js : $(node --version)"

if ! command -v docker &> /dev/null; then
  echo "❌ Docker non trouvé — télécharge Docker Desktop sur https://docker.com"
  exit 1
fi
echo "✅ Docker : $(docker --version)"

if ! docker info &> /dev/null; then
  echo "❌ Docker Desktop n'est pas démarré — ouvre-le et attends la baleine 🐳"
  exit 1
fi
echo "✅ Docker Desktop actif"
echo ""

# ── Backend ───────────────────────────────────────────────────────────────────
echo "🐍 Installation du backend Python..."
cd "$PROJECT_DIR/backend"

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt --quiet
pip install bcrypt==4.0.1 --quiet
echo "✅ Dépendances Python installées"

# Créer le .env
if [ ! -f ".env" ]; then
  cp .env.example .env
  SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/change_moi_avec_secrets_token_hex_32/$SECRET/" .env
  else
    sed -i "s/change_moi_avec_secrets_token_hex_32/$SECRET/" .env
  fi
  echo "✅ Fichier .env créé avec clé secrète générée automatiquement"
else
  echo "ℹ️  .env existe déjà — ignoré"
fi

# Lancer Docker et initialiser la DB
echo ""
echo "🐳 Démarrage de la base de données..."
cd "$PROJECT_DIR"
docker compose up -d
sleep 4

cd "$PROJECT_DIR/backend"
source venv/bin/activate
python3 -c "from database import init_db; init_db()"
echo "✅ Base de données initialisée"

# ── Frontend ──────────────────────────────────────────────────────────────────
echo ""
echo "⚛️  Installation du frontend Next.js..."
cd "$PROJECT_DIR/frontend"
npm install --silent
echo "✅ Dépendances Node.js installées"

if [ ! -f ".env.local" ]; then
  cp .env.local.example .env.local
  echo "✅ Fichier .env.local créé"
else
  echo "ℹ️  .env.local existe déjà — ignoré"
fi

# chmod sur les scripts
chmod +x "$PROJECT_DIR/start.sh" 2>/dev/null
chmod +x "$PROJECT_DIR/stop.sh" 2>/dev/null

# ── Résumé ────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Installation terminée !"
echo ""
echo "Pour lancer DataPulse :"
echo "   ./start.sh"
echo ""
echo "Pour arrêter :"
echo "   ./stop.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
