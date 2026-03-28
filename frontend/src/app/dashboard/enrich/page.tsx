"use client"
import { useState } from "react"
import { useRequireAuth, useAuth } from "@/lib/auth-context"
import { enrichAPI } from "@/lib/api"

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#f5f0e8", border: "1.5px solid #e8e0d0",
  borderRadius: "8px", padding: "0.7rem 1rem", fontSize: "0.875rem",
  outline: "none", boxSizing: "border-box",
  fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1a1206"
}
const labelStyle: React.CSSProperties = {
  fontSize: "0.7rem", fontWeight: 700, color: "#8a7a66",
  textTransform: "uppercase", letterSpacing: "0.1em",
  display: "block", marginBottom: "0.4rem"
}

function ResultField({ label, value }: { label: string; value: any }) {
  if (!value) return null
  return (
    <div style={{ display: "flex", gap: "0.5rem", padding: "0.5rem 0", borderBottom: "1px solid #f5f0e8" }}>
      <div style={{ fontSize: "0.72rem", color: "#8a7a66", fontFamily: "monospace", minWidth: 140 }}>{label}</div>
      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a1206" }}>{String(value)}</div>
    </div>
  )
}

export default function EnrichPage() {
  useRequireAuth()
  const { refreshClient } = useAuth()

  const [activeTab, setActiveTab] = useState<"company" | "contact">("company")
  const [companyForm, setCompanyForm] = useState({ name: "", country: "", website: "" })
  const [contactForm, setContactForm] = useState({ email: "", first_name: "", last_name: "", company: "" })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const enrichCompany = async () => {
    if (!companyForm.name.trim()) return
    setLoading(true); setError(""); setResult(null)
    try {
      const data = await enrichAPI.company(companyForm.name, companyForm.country || undefined, companyForm.website || undefined)
      setResult(data)
      await refreshClient()
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const enrichContact = async () => {
    if (!contactForm.email && !(contactForm.first_name && contactForm.last_name)) {
      setError("Renseignez un email ou un prénom + nom")
      return
    }
    setLoading(true); setError(""); setResult(null)
    try {
      const data = await enrichAPI.contact(contactForm)
      setResult(data)
      await refreshClient()
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const tabs = [
    { key: "company", label: "🏢 Entreprise" },
    { key: "contact", label: "👤 Contact" },
  ] as const

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "0.3rem" }}>Enrichir des données</h1>
      <p style={{ fontSize: "0.82rem", color: "#8a7a66", marginBottom: "1.8rem" }}>Chaque enrichissement coûte 1 crédit (gratuit si déjà en cache)</p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1.5px solid #e8e0d0", paddingBottom: "0" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setResult(null); setError("") }} style={{
            background: "transparent", border: "none", padding: "0.6rem 1.2rem",
            fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
            color: activeTab === t.key ? "#1a1206" : "#8a7a66",
            borderBottom: activeTab === t.key ? "2px solid #ff6b2b" : "2px solid transparent",
            fontFamily: "'Bricolage Grotesque', sans-serif",
            marginBottom: "-1.5px"
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Form */}
        <div style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: 12, padding: "1.5rem" }}>
          <div style={{ fontWeight: 800, marginBottom: "1.2rem" }}>
            {activeTab === "company" ? "Enrichir une entreprise" : "Enrichir un contact"}
          </div>

          {error && (
            <div style={{ background: "rgba(255,107,43,0.1)", border: "1px solid rgba(255,107,43,0.3)", borderRadius: "8px", padding: "0.7rem 1rem", marginBottom: "1rem", color: "#ff6b2b", fontSize: "0.82rem" }}>
              {error}
            </div>
          )}

          {activeTab === "company" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Nom de l'entreprise *</label>
                <input value={companyForm.name} onChange={e => setCompanyForm(f => ({ ...f, name: e.target.value }))} placeholder="Wave Mobile Money" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Pays (code ISO)</label>
                <input value={companyForm.country} onChange={e => setCompanyForm(f => ({ ...f, country: e.target.value }))} placeholder="SN, MA, CI, FR..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Site web (optionnel)</label>
                <input value={companyForm.website} onChange={e => setCompanyForm(f => ({ ...f, website: e.target.value }))} placeholder="https://wave.com" style={inputStyle} />
              </div>
              <button onClick={enrichCompany} disabled={loading || !companyForm.name.trim()} style={{
                background: loading ? "#c8bfb0" : "#ff6b2b", color: "#fff", border: "none",
                borderRadius: "100px", padding: "0.8rem", fontWeight: 800,
                fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Bricolage Grotesque', sans-serif"
              }}>
                {loading ? "Enrichissement en cours..." : "Enrichir →"}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Email professionnel</label>
                <input type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} placeholder="jean@acme.com" style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                <div>
                  <label style={labelStyle}>Prénom</label>
                  <input value={contactForm.first_name} onChange={e => setContactForm(f => ({ ...f, first_name: e.target.value }))} placeholder="Jean" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Nom</label>
                  <input value={contactForm.last_name} onChange={e => setContactForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Dupont" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Entreprise</label>
                <input value={contactForm.company} onChange={e => setContactForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Corp" style={inputStyle} />
              </div>
              <button onClick={enrichContact} disabled={loading} style={{
                background: loading ? "#c8bfb0" : "#ff6b2b", color: "#fff", border: "none",
                borderRadius: "100px", padding: "0.8rem", fontWeight: 800,
                fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Bricolage Grotesque', sans-serif"
              }}>
                {loading ? "Enrichissement en cours..." : "Enrichir →"}
              </button>
            </div>
          )}
        </div>

        {/* Result */}
        <div style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: 12, padding: "1.5rem" }}>
          <div style={{ fontWeight: 800, marginBottom: "1.2rem" }}>Résultat</div>

          {!result && !loading && (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#c8bfb0" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.8rem" }}>🔍</div>
              <div style={{ fontSize: "0.85rem" }}>Remplissez le formulaire et cliquez sur Enrichir</div>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#8a7a66" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.8rem", animation: "spin 1s linear infinite" }}>⚡</div>
              <div style={{ fontSize: "0.85rem" }}>Interrogation des sources...</div>
            </div>
          )}

          {result && (
            <div>
              {/* Header résultat */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1.5px solid #e8e0d0" }}>
                <div style={{ fontWeight: 800 }}>{result.name || result.full_name || result.email}</div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {result.from_cache && (
                    <span style={{ background: "rgba(0,168,107,0.1)", color: "#00a86b", padding: "0.2rem 0.6rem", borderRadius: 4, fontSize: "0.68rem", fontWeight: 700 }}>
                      ✓ Cache
                    </span>
                  )}
                  <span style={{
                    background: result.confidence_score > 0.7 ? "rgba(0,168,107,0.1)" : "rgba(212,160,0,0.1)",
                    color: result.confidence_score > 0.7 ? "#00a86b" : "#d4a000",
                    padding: "0.2rem 0.6rem", borderRadius: 4, fontSize: "0.68rem", fontWeight: 700, fontFamily: "monospace"
                  }}>
                    {result.confidence_score}
                  </span>
                </div>
              </div>

              {/* Champs */}
              <ResultField label="Domaine" value={result.domain} />
              <ResultField label="Secteur" value={result.industry} />
              <ResultField label="Effectif" value={result.employee_count} />
              <ResultField label="Pays" value={result.country} />
              <ResultField label="Ville" value={result.city} />
              <ResultField label="Fondée en" value={result.founded_year} />
              <ResultField label="Pattern email" value={result.email_pattern} />
              <ResultField label="N° société" value={result.company_number} />
              <ResultField label="Description" value={result.description ? result.description.substring(0, 120) + "..." : null} />
              <ResultField label="Email" value={result.email} />
              <ResultField label="Poste" value={result.job_title} />
              <ResultField label="Entreprise" value={result.company} />
              <ResultField label="Localisation" value={result.location} />

              {/* Sources */}
              {result.sources_used?.length > 0 && (
                <div style={{ marginTop: "1rem", paddingTop: "0.8rem", borderTop: "1px solid #f5f0e8" }}>
                  <div style={{ fontSize: "0.65rem", color: "#8a7a66", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>Sources utilisées</div>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {result.sources_used.map((s: string) => (
                      <span key={s} style={{ background: "#f5f0e8", border: "1px solid #e8e0d0", padding: "0.2rem 0.5rem", borderRadius: 4, fontSize: "0.68rem", fontFamily: "monospace" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Crédits consommés */}
              <div style={{ marginTop: "0.8rem", fontSize: "0.75rem", color: result.credits_used === 0 ? "#00a86b" : "#8a7a66", textAlign: "right" }}>
                {result.credits_used === 0 ? "✓ 0 crédit consommé (cache)" : `${result.credits_used} crédit consommé`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
