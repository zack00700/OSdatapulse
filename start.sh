#!/bin/bash

# ─── OS DataPulse — Script de lancement automatique ─────────────────────────

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "📇 OS DataPulse — Démarrage..."
echo "📁 Dossier : $PROJECT_DIR"

# ── 1. Lancer Docker ──────────────────────────────────────────────────────────
echo ""
echo "🐳 Lancement de la base de données..."
cd "$PROJECT_DIR"
docker compose up -d

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Erreur Docker — Vérifie que Docker Desktop est ouvert (baleine 🐳)"
  read -p "Appuie sur Entrée pour quitter..."
  exit 1
fi

echo "✅ Base de données prête"
sleep 2

# ── 2. Lancer le Backend ──────────────────────────────────────────────────────
echo ""
echo "🐍 Lancement du backend Python..."

osascript <<EOF
tell application "Terminal"
  activate
  tell application "System Events" to keystroke "t" using command down
  delay 0.5
  do script "cd '$PROJECT_DIR/backend' && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8001" in front window
end tell
EOF

sleep 2

# ── 3. Lancer le Frontend ─────────────────────────────────────────────────────
echo ""
echo "⚛️  Lancement du frontend Next.js..."

osascript <<EOF
tell application "Terminal"
  activate
  tell application "System Events" to keystroke "t" using command down
  delay 0.5
  do script "cd '$PROJECT_DIR/frontend' && npm run dev" in front window
end tell
EOF

# ── 4. Ouvrir le navigateur ───────────────────────────────────────────────────
echo ""
echo "⏳ Ouverture du navigateur dans 5 secondes..."
sleep 5

open "http://localhost:3001"

echo ""
echo "✅ DataPulse est lancé !"
echo ""
echo "   🌐 App       → http://localhost:3001"
echo "   📡 API       → http://localhost:8001"
echo "   📖 Swagger   → http://localhost:8001/docs"
echo ""
echo "Pour tout arrêter : ./stop.sh"
