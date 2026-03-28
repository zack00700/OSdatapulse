"use client"
import { useEffect, useState } from "react"
import { useRequireAuth } from "@/lib/auth-context"
import { enrichAPI } from "@/lib/api"

export default function HistoryPage() {
  useRequireAuth()
  const [history, setHistory] = useState<any[]>([])
  const [filter, setFilter] = useState("")
  const [loading, setLoading] = useState(true)

  const load = (type = "") => {
    setLoading(true)
    enrichAPI.history(100, type || undefined)
      .then(d => setHistory(d.history))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const typeColor = (t: string) =>
    t === "company" ? "#2b5cff" : t === "contact" ? "#ff6b2b" : "#00a86b"

  return (
    <div style={{ padding: "2rem", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Historique</h1>
          <p style={{ fontSize: "0.82rem", color: "#8a7a66", marginTop: "0.2rem" }}>Tous vos enrichissements</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["", "company", "contact", "batch"].map(f => (
            <button key={f} onClick={() => { setFilter(f); load(f) }} style={{
              background: filter === f ? "#1a1206" : "transparent",
              border: "1.5px solid",
              borderColor: filter === f ? "#1a1206" : "#e8e0d0",
              color: filter === f ? "#fff" : "#8a7a66",
              padding: "0.35rem 0.9rem", borderRadius: 100, fontSize: "0.75rem",
              cursor: "pointer", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600
            }}>
              {f || "Tous"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#8a7a66", fontFamily: "monospace" }}>Chargement...</div>
        ) : history.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "#8a7a66" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.8rem" }}>📭</div>
            <div style={{ fontWeight: 700 }}>Aucun enrichissement</div>
            <div style={{ fontSize: "0.82rem", marginTop: "0.3rem" }}>
              Allez dans <strong>Enrichir</strong> pour commencer
            </div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Type", "Requête", "Confiance", "Sources", "Cache", "Crédits", "Date"].map(h => (
                  <th key={h} style={{ textAlign: "left", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a7a66", padding: "0.8rem 1rem", borderBottom: "1.5px solid #e8e0d0", fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(r => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f5f0e8" }}>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <span style={{ background: `${typeColor(r.type)}15`, color: typeColor(r.type), padding: "0.2rem 0.6rem", borderRadius: 4, fontSize: "0.7rem", fontWeight: 700, fontFamily: "monospace" }}>
                      {r.type}
                    </span>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 600, fontSize: "0.85rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.query}
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <div style={{ width: 50, height: 4, background: "#f5f0e8", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${r.confidence_score * 100}%`, background: r.confidence_score > 0.7 ? "#00a86b" : r.confidence_score > 0.4 ? "#d4a000" : "#8a7a66", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{r.confidence_score}</span>
                    </div>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontSize: "0.72rem", color: "#8a7a66" }}>
                    {r.sources_used.join(", ") || "—"}
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <span style={{ fontSize: "0.75rem", color: r.from_cache ? "#00a86b" : "#c8bfb0" }}>
                      {r.from_cache ? "✓ cache" : "—"}
                    </span>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontFamily: "monospace", fontSize: "0.78rem", fontWeight: 700, color: r.credits_used === 0 ? "#00a86b" : "#ff6b2b" }}>
                    {r.credits_used === 0 ? "gratuit" : `-${r.credits_used}`}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontSize: "0.72rem", color: "#8a7a66" }}>
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
