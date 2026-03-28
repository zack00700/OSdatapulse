import type { Metadata } from "next"
import { AuthProvider } from "@/lib/auth-context"

export const metadata: Metadata = {
  title: "DataPulse — Data Enrichment API",
  description: "Enrich your B2B data in seconds",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=Space+Mono&display=swap" rel="stylesheet"/>
      </head>
      <body style={{ margin: 0, background: "#f5f0e8", color: "#1a1206", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
