"use client"
import { useEffect, useState } from "react"
import { useRequireAuth, useAuth } from "@/lib/auth-context"
import { enrichAPI } from "@/lib/api"

const PLANS = [
  { key: "payg", label: "Pay-as-you-go", price: "19€", credits: "1 000 crédits", note: "Sans abonnement", color: "#8a7a66" },
  { key: "starter", label: "Starter", price: "49€/mois", credits: "5 000 crédits/mois", note: "0.010€ / crédit", color: "#2b5cff" },
  { key: "pro", label: "Pro", price: "149€/mois", credits: "25 000 crédits/mois", note: "0.006€ / crédit", color: "#ff6b2b" },
  { key: "business", label: "Business", price: "399€/mois", credits: "100 000 crédits/mois", note: "0.004€ / crédit", color: "#00a86b" },
]

const PACKS = [
  { credits: 1000, price: 19, label: "1 000 crédits" },
  { credits: 5000, price: 44, label: "5 000 crédits", badge: "-8%" },
  { credits: 15000, price: 114, label: "15 000 crédits", badge: "-20%" },
  { credits: 50000, price: 299, label: "50 000 crédits", badge: "-37%" },
]

export default function BillingPage() {
  useRequireAuth()
  const { client, refreshClient } = useAuth()
  const [creditHistory, setCreditHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    enrichAPI.creditHistory()
      .then(d => setCreditHistory(d.transactions))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: "2rem", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
      <h1 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "0.3rem" }}>Crédits & Facturation</h1>
      <p style={{ fontSize: "0.82rem", color: "#8a7a66", marginBottom: "1.8rem" }}>Gérez vos crédits et votre abonnement</p>

      {/* Solde actuel */}
      <div style={{ background: "#1a1206", borderRadius: 16, padding: "1.8rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "2rem" }}>
        <div>
          <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>Solde actuel</div>
          <div style={{ fontSize: "3.5rem", fontWeight: 800, fontFamily: "monospace", color: "#ff6b2b" }}>
            {client?.credits ?? 0}
          </div>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "0.2rem" }}>crédits disponibles</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.3rem" }}>Plan actuel</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", textTransform: "uppercase" }}>{client?.plan}</div>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", marginTop: "0.3rem" }}>
            {client?.total_requests} enrichissements au total
          </div>
        </div>
      </div>

      {/* Packs de crédits */}
      <div style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: "1.2rem" }}>Acheter des crédits</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
          {PACKS.map(p => (
            <div key={p.credits} style={{ border: "1.5px solid #e8e0d0", borderRadius: 10, padding: "1.2rem", textAlign: "center", cursor: "pointer", transition: "all 0.2s", position: "relative" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#ff6b2b")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#e8e0d0")}>
              {p.badge && (
                <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#ff6b2b", color: "#fff", fontSize: "0.62rem", fontWeight: 800, padding: "0.15rem 0.5rem", borderRadius: 999 }}>
                  {p.badge}
                </div>
              )}
              <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "monospace" }}>{p.credits.toLocaleString()}</div>
              <div style={{ fontSize: "0.72rem", color: "#8a7a66", margin: "0.2rem 0 0.8rem" }}>crédits</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>{p.price}€</div>
              <button style={{ width: "100%", marginTop: "0.8rem", background: "#1a1206", color: "#fff", border: "none", borderRadius: 100, padding: "0.6rem", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                Acheter
              </button>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#8a7a66", textAlign: "center" }}>
          💳 Paiement sécurisé via Stripe · Crédits disponibles instantanément
        </div>
      </div>

      {/* Plans */}
      <div style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: "1.2rem" }}>Plans mensuels</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
          {PLANS.map(p => (
            <div key={p.key} style={{ border: `1.5px solid ${client?.plan === p.key ? p.color : "#e8e0d0"}`, borderRadius: 10, padding: "1.2rem", position: "relative" }}>
              {client?.plan === p.key && (
                <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: p.color, color: "#fff", fontSize: "0.62rem", fontWeight: 800, padding: "0.15rem 0.5rem", borderRadius: 999, whiteSpace: "nowrap" }}>
                  Plan actuel
                </div>
              )}
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: p.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>{p.label}</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "monospace" }}>{p.price}</div>
              <div style={{ fontSize: "0.78rem", color: "#8a7a66", margin: "0.3rem 0 0.5rem" }}>{p.credits}</div>
              <div style={{ fontSize: "0.72rem", color: "#c8bfb0" }}>{p.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Historique crédits */}
      <div style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "1.2rem 1.5rem", borderBottom: "1.5px solid #e8e0d0", fontWeight: 800, fontSize: "0.9rem" }}>
          Historique des mouvements
        </div>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#8a7a66", fontFamily: "monospace" }}>Chargement...</div>
        ) : creditHistory.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#8a7a66" }}>Aucun mouvement</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Type", "Description", "Montant", "Date"].map(h => (
                  <th key={h} style={{ textAlign: "left", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a7a66", padding: "0.7rem 1rem", borderBottom: "1.5px solid #e8e0d0", fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {creditHistory.map((t, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f5f0e8" }}>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <span style={{
                      background: t.type === "usage" ? "rgba(255,107,43,0.1)" : "rgba(0,168,107,0.1)",
                      color: t.type === "usage" ? "#ff6b2b" : "#00a86b",
                      padding: "0.2rem 0.6rem", borderRadius: 4, fontSize: "0.7rem", fontWeight: 700, fontFamily: "monospace"
                    }}>
                      {t.type}
                    </span>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem", color: "#8a7a66" }}>{t.description}</td>
                  <td style={{ padding: "0.85rem 1rem", fontFamily: "monospace", fontWeight: 700, color: t.amount > 0 ? "#00a86b" : "#ff6b2b" }}>
                    {t.amount > 0 ? `+${t.amount}` : t.amount}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontSize: "0.72rem", color: "#8a7a66" }}>
                    {new Date(t.created_at).toLocaleString("fr")}
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
