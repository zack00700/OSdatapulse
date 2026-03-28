"use client"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#f5f0e8", border: "1.5px solid #e8e0d0",
    borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.9rem",
    outline: "none", boxSizing: "border-box",
    fontFamily: "'Bricolage Grotesque', sans-serif"
  }
  const labelStyle: React.CSSProperties = {
    fontSize: "0.72rem", fontWeight: 700, color: "#8a7a66",
    textTransform: "uppercase", letterSpacing: "0.1em",
    display: "block", marginBottom: "0.4rem"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try { await login(email, password) }
    catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>
            Data<span style={{ color: "#ff6b2b" }}>Pulse</span>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#8a7a66", marginTop: "0.3rem" }}>data enrichment API</div>
        </div>

        <div style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: "16px", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "0.3rem" }}>Connexion</h1>
          <p style={{ fontSize: "0.85rem", color: "#8a7a66", marginBottom: "1.8rem" }}>
            Pas de compte ?{" "}
            <Link href="/register" style={{ color: "#ff6b2b", textDecoration: "none" }}>S'inscrire</Link>
          </p>

          {error && (
            <div style={{ background: "rgba(255,107,43,0.1)", border: "1px solid rgba(255,107,43,0.3)", borderRadius: "8px", padding: "0.8rem 1rem", marginBottom: "1rem", color: "#ff6b2b", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="vous@entreprise.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", background: loading ? "#c8bfb0" : "#1a1206", color: "#fff", border: "none", borderRadius: "100px", padding: "0.85rem", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", fontFamily: "'Bricolage Grotesque', sans-serif", marginTop: "0.5rem" }}>
              {loading ? "Connexion..." : "Se connecter →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
