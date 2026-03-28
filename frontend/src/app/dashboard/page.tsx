"use client"
import { useEffect, useState } from "react"
import { useRequireAuth } from "@/lib/auth-context"
import { enrichAPI } from "@/lib/api"

function KPI({ label, value, sub, accent }: any) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: 12, padding: "1.5rem" }}>
      <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a7a66", marginBottom: "0.4rem", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: "2.2rem", fontWeight: 800, fontFamily: "monospace", color: accent || "#1a1206" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: "#8a7a66", marginTop: "0.3rem" }}>{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  useRequireAuth()
  const [stats, setStats] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([enrichAPI.stats(), enrichAPI.history(10)])
      .then(([s, h]) => { setStats(s); setHistory(h.history) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const typeColor = (t: string) => t === "company" ? "#2b5cff" : t === "contact" ? "#ff6b2b" : "#00a86b"

  if (loading) return (
    <div style={{ padding: "4rem", textAlign: "center", color: "#8a7a66", fontFamily: "monospace" }}>Chargement...</div>
  )

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "0.2rem" }}>Vue d'ensemble</h1>
        <p style={{ fontSize: "0.82rem", color: "#8a7a66" }}>Données réelles depuis votre compte DataPulse</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.2rem", marginBottom: "2rem" }}>
        <KPI label="Total enrichissements" value={stats?.total_requests ?? 0} sub="Depuis la création du compte" />
        <KPI label="Entreprises" value={stats?.companies_enriched ?? 0} accent="#2b5cff" sub="Fiches enrichies" />
        <KPI label="Contacts" value={stats?.contacts_enriched ?? 0} accent="#ff6b2b" sub="Contacts enrichis" />
        <KPI label="Crédits restants" value={stats?.credits_remaining ?? 0} accent="#00a86b" sub={`Confiance moy: ${stats?.avg_confidence ?? 0}`} />
      </div>

      {/* Cache hit rate */}
      {stats?.cache_hit_rate > 0 && (
        <div style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: 12, padding: "1.2rem 1.5rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "1.5rem" }}>💡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{stats.cache_hit_rate}% de vos requêtes servies depuis le cache</div>
            <div style={{ fontSize: "0.78rem", color: "#8a7a66" }}>Ces enrichissements ne consomment pas de crédits</div>
          </div>
        </div>
      )}

      {/* Recent history */}
      <div style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: 12, padding: "1.5rem" }}>
        <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: "1.2rem" }}>Derniers enrichissements</div>

        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#8a7a66" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.8rem" }}>✨</div>
            <div style={{ fontWeight: 700 }}>Aucun enrichissement pour l'instant</div>
            <div style={{ fontSize: "0.82rem", marginTop: "0.3rem" }}>
              Allez dans <strong>Enrichir</strong> pour tester ou envoyez une requête à <code style={{ color: "#ff6b2b" }}>POST /v1/enrich/company</code>
            </div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Type", "Requête", "Confiance", "Sources", "Cache", "Crédits", "Date"].map(h => (
                  <th key={h} style={{ textAlign: "left", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a7a66", padding: "0.6rem 0.8rem", borderBottom: "1.5px solid #e8e0d0", fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(r => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f5f0e8" }}>
                  <td style={{ padding: "0.85rem 0.8rem" }}>
                    <span style={{ background: `${typeColor(r.type)}18`, color: typeColor(r.type), padding: "0.2rem 0.6rem", borderRadius: 4, fontSize: "0.7rem", fontWeight: 700, fontFamily: "monospace" }}>
                      {r.type}
                    </span>
                  </td>
                  <td style={{ padding: "0.85rem 0.8rem", fontWeight: 600, fontSize: "0.85rem", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.query}</td>
                  <td style={{ padding: "0.85rem 0.8rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <div style={{ width: 60, height: 4, background: "#f5f0e8", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${r.confidence_score * 100}%`, background: r.confidence_score > 0.7 ? "#00a86b" : r.confidence_score > 0.4 ? "#d4a000" : "#8a7a66", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{r.confidence_score}</span>
                    </div>
                  </td>
                  <td style={{ padding: "0.85rem 0.8rem", fontSize: "0.72rem", color: "#8a7a66" }}>{r.sources_used.join(", ") || "—"}</td>
                  <td style={{ padding: "0.85rem 0.8rem" }}>
                    <span style={{ fontSize: "0.72rem", color: r.from_cache ? "#00a86b" : "#8a7a66" }}>{r.from_cache ? "✓ cache" : "—"}</span>
                  </td>
                  <td style={{ padding: "0.85rem 0.8rem", fontFamily: "monospace", fontSize: "0.78rem", color: r.credits_used === 0 ? "#00a86b" : "#ff6b2b", fontWeight: 700 }}>
                    {r.credits_used === 0 ? "0 (cache)" : `-${r.credits_used}`}
                  </td>
                  <td style={{ padding: "0.85rem 0.8rem", fontSize: "0.72rem", color: "#8a7a66" }}>
                    {new Date(r.created_at).toLocaleString("fr")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
