"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth, useRequireAuth } from "@/lib/auth-context"

function Sidebar() {
  const { logout, client } = useAuth()
  const pathname = usePathname()

  const links = [
    { href: "/dashboard", label: "Vue d'ensemble", icon: "📊" },
    { href: "/dashboard/enrich", label: "Enrichir", icon: "✨" },
    { href: "/dashboard/history", label: "Historique", icon: "📋" },
    { href: "/dashboard/apikeys", label: "Clés API", icon: "🔑" },
    { href: "/dashboard/billing", label: "Crédits", icon: "💳" },
  ]

  return (
    <aside style={{ width: 240, minHeight: "100vh", background: "#1a1206", display: "flex", flexDirection: "column", position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 50 }}>
      <div style={{ padding: "1.2rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>
          Data<span style={{ color: "#ff6b2b" }}>Pulse</span>
        </div>
        <div style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginTop: "0.2rem" }}>Dashboard v1.0</div>
      </div>

      <nav style={{ flex: 1, padding: "1rem 0" }}>
        {links.map(link => (
          <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.7rem 1.5rem", fontSize: "0.875rem", fontWeight: 600,
              color: pathname === link.href ? "#fff" : "rgba(255,255,255,0.4)",
              background: pathname === link.href ? "rgba(255,107,43,0.15)" : "transparent",
              borderRight: pathname === link.href ? "2px solid #ff6b2b" : "2px solid transparent",
            }}>
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Credits widget */}
        <div style={{ background: "rgba(255,107,43,0.1)", border: "1px solid rgba(255,107,43,0.2)", borderRadius: "8px", padding: "0.8rem", marginBottom: "0.8rem" }}>
          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.3rem" }}>Crédits</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ff6b2b", fontFamily: "monospace" }}>{client?.credits ?? 0}</div>
          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", marginTop: "0.1rem" }}>disponibles</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.8rem" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ff6b2b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.8rem", color: "#fff" }}>
            {client?.company_name?.[0] || "?"}
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>{client?.company_name}</div>
            <div style={{ fontSize: "0.62rem", color: "#ff6b2b", fontFamily: "monospace", textTransform: "uppercase" }}>{client?.plan}</div>
          </div>
        </div>
        <button onClick={logout} style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", borderRadius: "6px", padding: "0.5rem", fontSize: "0.78rem", cursor: "pointer", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRequireAuth()

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#ff6b2b", fontFamily: "monospace" }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
      <Sidebar />
      <div style={{ marginLeft: 240, flex: 1 }}>{children}</div>
    </div>
  )
}
