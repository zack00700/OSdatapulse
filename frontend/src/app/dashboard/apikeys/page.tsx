"use client"
import { useEffect, useState } from "react"
import { useRequireAuth } from "@/lib/auth-context"
import { apiKeysAPI } from "@/lib/api"

export default function APIKeysPage() {
  useRequireAuth()
  const [keys, setKeys] = useState<any[]>([])
  const [newKey, setNewKey] = useState<string | null>(null)
  const [label, setLabel] = useState("")
  const [env, setEnv] = useState("production")
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    apiKeysAPI.list().then(d => setKeys(d.api_keys)).finally(() => setLoading(false))
  }, [])

  const create = async () => {
    if (!label.trim()) return
    try {
      const data = await apiKeysAPI.create(label, env)
      setNewKey(data.api_key)
      setLabel("")
      apiKeysAPI.list().then(d => setKeys(d.api_keys))
    } catch (e: any) { alert(e.message) }
  }

  const revoke = async (id: string) => {
    if (!confirm("Révoquer cette clé ? Elle ne fonctionnera plus immédiatement.")) return
    await apiKeysAPI.revoke(id)
    setKeys(k => k.filter(x => x.id !== id))
  }

  const copy = (val: string) => {
    navigator.clipboard.writeText(val)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
      <h1 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "0.3rem" }}>Clés API</h1>
      <p style={{ fontSize: "0.82rem", color: "#8a7a66", marginBottom: "1.5rem" }}>Gérez vos accès à l'API DataPulse</p>

      {/* Nouvelle clé affichée une seule fois */}
      {newKey && (
        <div style={{ background: "rgba(0,168,107,0.08)", border: "1.5px solid rgba(0,168,107,0.25)", borderRadius: 12, padding: "1.2rem", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#00a86b", marginBottom: "0.6rem" }}>
            ⚠️ Sauvegardez cette clé maintenant — elle ne sera plus jamais affichée
          </div>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <div style={{ flex: 1, fontFamily: "monospace", fontSize: "0.78rem", color: "#1a1206", background: "#f5f0e8", border: "1.5px solid #e8e0d0", padding: "0.7rem 0.9rem", borderRadius: 8, wordBreak: "break-all" }}>
              {newKey}
            </div>
            <button onClick={() => copy(newKey)} style={{ background: "#1a1206", border: "none", color: "#fff", borderRadius: 8, padding: "0.6rem 1.2rem", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", whiteSpace: "nowrap" }}>
              {copied ? "✓ Copié" : "Copier"}
            </button>
          </div>
        </div>
      )}

      {/* Créer une clé */}
      <div style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: "1rem" }}>Créer une nouvelle clé</div>
        <div style={{ display: "flex", gap: "0.8rem", alignItems: "flex-end" }}>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#8a7a66", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.4rem" }}>Nom</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Production app, Pipeline ETL..." style={{ width: "100%", background: "#f5f0e8", border: "1.5px solid #e8e0d0", borderRadius: 8, padding: "0.7rem 1rem", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#8a7a66", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.4rem" }}>Environnement</label>
            <select value={env} onChange={e => setEnv(e.target.value)} style={{ width: "100%", background: "#f5f0e8", border: "1.5px solid #e8e0d0", borderRadius: 8, padding: "0.7rem 1rem", fontSize: "0.875rem", outline: "none" }}>
              <option value="production">Production</option>
              <option value="test">Test</option>
            </select>
          </div>
          <button onClick={create} disabled={!label.trim()} style={{ background: !label.trim() ? "#c8bfb0" : "#ff6b2b", border: "none", color: "#fff", borderRadius: 100, padding: "0.75rem 1.5rem", fontWeight: 800, fontSize: "0.875rem", cursor: !label.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
            Créer
          </button>
        </div>
      </div>

      {/* Liste des clés */}
      <div style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "1.2rem 1.5rem", borderBottom: "1.5px solid #e8e0d0", fontWeight: 800, fontSize: "0.9rem" }}>
          Clés actives ({keys.length}/5)
        </div>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#8a7a66", fontFamily: "monospace" }}>Chargement...</div>
        ) : keys.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#8a7a66" }}>
            <div>Aucune clé active</div>
          </div>
        ) : (
          <div>
            {keys.map((k, i) => (
              <div key={k.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.5rem", borderBottom: i < keys.length - 1 ? "1px solid #f5f0e8" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{k.label}</div>
                  <div style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#8a7a66", marginTop: "0.2rem" }}>{k.key_preview}</div>
                  <div style={{ fontSize: "0.68rem", color: "#c8bfb0", marginTop: "0.2rem" }}>
                    {k.last_used_at ? `Utilisée le ${new Date(k.last_used_at).toLocaleDateString("fr")}` : "Jamais utilisée"} · Créée le {new Date(k.created_at).toLocaleDateString("fr")}
                  </div>
                </div>
                <span style={{
                  background: k.environment === "production" ? "rgba(43,92,255,0.1)" : "rgba(212,160,0,0.1)",
                  color: k.environment === "production" ? "#2b5cff" : "#d4a000",
                  padding: "0.2rem 0.6rem", borderRadius: 4, fontSize: "0.68rem", fontWeight: 700, fontFamily: "monospace"
                }}>
                  {k.environment}
                </span>
                <button onClick={() => revoke(k.id)} style={{ background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.2)", color: "#ff6b2b", borderRadius: 6, padding: "0.35rem 0.8rem", fontSize: "0.75rem", cursor: "pointer" }}>
                  Révoquer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Code example */}
      <div style={{ background: "#1a1206", borderRadius: 12, padding: "1.5rem", marginTop: "1.5rem" }}>
        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.8rem", fontFamily: "monospace" }}>Exemple d'utilisation</div>
        <pre style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, overflowX: "auto", margin: 0 }}>
{`import requests

r = requests.post(
    "http://localhost:8001/v1/enrich/company",
    headers={"x-api-key": "dp_prod_..."},
    json={"name": "Wave Mobile Money", "country": "SN"}
)
print(r.json())
# → {"name": "Wave", "industry": "Fintech", "confidence_score": 0.88}`}
        </pre>
      </div>
    </div>
  )
}
