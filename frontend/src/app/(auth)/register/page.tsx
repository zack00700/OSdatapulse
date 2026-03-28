"use client"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

export default function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({ full_name: "", company_name: "", email: "", password: "" })
  const [apiKeys, setApiKeys] = useState<{ production: string; test: string } | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState("")

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#f5f0e8", border: "1.5px solid #e8e0d0",
    borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.875rem",
    outline: "none", boxSizing: "border-box",
    fontFamily: "'Bricolage Grotesque', sans-serif"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true)
    try {
      const data = await register(form)
      setApiKeys({ production: data.client.api_key_production, test: data.client.api_key_test })
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val)
    setCopied(key)
    setTimeout(() => setCopied(""), 2000)
  }

  // Affichage des clés après inscription
  if (apiKeys) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{ width: "100%", maxWidth: "500px" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: "2.5rem" }}>🎉</div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: "0.5rem" }}>Compte créé !</h1>
            <p style={{ color: "#8a7a66", fontSize: "0.85rem" }}>
              50 crédits offerts · Sauvegardez vos clés maintenant, elles ne seront plus affichées.
            </p>
          </div>

          <div style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem" }}>
            {[
              { label: "Clé de production", val: apiKeys.production, key: "prod" },
              { label: "Clé de test", val: apiKeys.test, key: "test" }
            ].map(({ label, val, key }) => (
              <div key={key} style={{ marginBottom: "1.2rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8a7a66", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>{label}</div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ flex: 1, background: "#f5f0e8", border: "1.5px solid #e8e0d0", borderRadius: "6px", padding: "0.6rem 0.8rem", fontFamily: "monospace", fontSize: "0.72rem", wordBreak: "break-all" }}>
                    {val}
                  </div>
                  <button onClick={() => copy(val, key)} style={{ background: "#1a1206", border: "none", color: "#fff", borderRadius: "6px", padding: "0.5rem 0.8rem", cursor: "pointer", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                    {copied === key ? "✓" : "Copier"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Link href="/dashboard">
            <button style={{ width: "100%", background: "#ff6b2b", color: "#fff", border: "none", borderRadius: "100px", padding: "0.9rem", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Aller au dashboard →
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const fields = [
    { key: "full_name", label: "Nom complet", type: "text", placeholder: "Jean Dupont" },
    { key: "company_name", label: "Entreprise", type: "text", placeholder: "Acme Corp" },
    { key: "email", label: "Email", type: "email", placeholder: "vous@entreprise.com" },
    { key: "password", label: "Mot de passe", type: "password", placeholder: "8 caractères minimum" },
  ]

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>Data<span style={{ color: "#ff6b2b" }}>Pulse</span></div>
          <div style={{ fontSize: "0.8rem", color: "#8a7a66", marginTop: "0.3rem" }}>50 crédits offerts à l'inscription</div>
        </div>

        <div style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: "16px", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "0.3rem" }}>Créer un compte</h1>
          <p style={{ fontSize: "0.85rem", color: "#8a7a66", marginBottom: "1.8rem" }}>
            Déjà un compte ?{" "}
            <Link href="/login" style={{ color: "#ff6b2b", textDecoration: "none" }}>Se connecter</Link>
          </p>

          {error && (
            <div style={{ background: "rgba(255,107,43,0.1)", border: "1px solid rgba(255,107,43,0.3)", borderRadius: "8px", padding: "0.8rem 1rem", marginBottom: "1rem", color: "#ff6b2b", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {fields.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8a7a66", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.4rem" }}>
                  {f.label}
                </label>
                <input
                  type={f.type}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                  required placeholder={f.placeholder}
                  style={inputStyle}
                />
              </div>
            ))}
            <button type="submit" disabled={loading} style={{ width: "100%", background: loading ? "#c8bfb0" : "#1a1206", color: "#fff", border: "none", borderRadius: "100px", padding: "0.85rem", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", fontFamily: "'Bricolage Grotesque', sans-serif", marginTop: "0.5rem" }}>
              {loading ? "Création..." : "Créer mon compte →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
