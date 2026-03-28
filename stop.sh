#!/bin/bash

# ─── OS DataPulse — Arrêt complet ───────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "📇 OS DataPulse — Arrêt en cours..."
echo ""

# ── 1. Tuer le backend (port 8001) ───────────────────────────────────────────
echo "🐍 Arrêt du backend..."
BACKEND_PID=$(lsof -ti:8001)
if [ -n "$BACKEND_PID" ]; then
  kill -9 $BACKEND_PID 2>/dev/null
  echo "✅ Backend arrêté"
else
  echo "ℹ️  Backend déjà arrêté"
fi

# ── 2. Tuer le frontend (port 3001) ──────────────────────────────────────────
echo "⚛️  Arrêt du frontend..."
FRONTEND_PID=$(lsof -ti:3001)
if [ -n "$FRONTEND_PID" ]; then
  kill -9 $FRONTEND_PID 2>/dev/null
  echo "✅ Frontend arrêté"
else
  echo "ℹ️  Frontend déjà arrêté"
fi

# ── 3. Arrêter Docker ────────────────────────────────────────────────────────
echo "🐳 Arrêt de la base de données..."
cd "$PROJECT_DIR"
docker compose down
echo "✅ Base de données arrêtée"

echo ""
echo "✅ DataPulse complètement arrêté !"
echo ""
echo "   🌐 http://localhost:3001 → hors ligne"
echo "   📡 http://localhost:8001 → hors ligne"
