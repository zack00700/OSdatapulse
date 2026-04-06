// lib/api.ts — Client API DataPulse

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("dp_access_token")
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("dp_access_token", access)
  localStorage.setItem("dp_refresh_token", refresh)
}

export function clearTokens() {
  localStorage.removeItem("dp_access_token")
  localStorage.removeItem("dp_refresh_token")
  localStorage.removeItem("dp_client")
}

async function tryRefresh(): Promise<boolean> {
  const refresh = localStorage.getItem("dp_refresh_token")
  if (!refresh) return false
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    })
    if (!res.ok) return false
    const data = await res.json()
    localStorage.setItem("dp_access_token", data.access_token)
    return true
  } catch { return false }
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  let res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getToken()}`
      res = await fetch(`${API_URL}${path}`, { ...options, headers })
    } else {
      clearTokens()
      window.location.href = "/login"
      throw new Error("Session expirée")
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Erreur serveur" }))
    throw new Error(err.detail || "Erreur inconnue")
  }
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authAPI = {
  async register(data: { email: string; password: string; company_name: string; full_name: string }) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail) }
    const json = await res.json()
    setTokens(json.access_token, json.refresh_token)
    localStorage.setItem("dp_client", JSON.stringify(json.client))
    return json
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail) }
    const json = await res.json()
    setTokens(json.access_token, json.refresh_token)
    localStorage.setItem("dp_client", JSON.stringify(json.client))
    return json
  },

  async logout() {
    const refresh = localStorage.getItem("dp_refresh_token")
    if (refresh) {
      await apiFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refresh }),
      }).catch(() => {})
    }
    clearTokens()
  },

  async me() { return apiFetch("/auth/me") },
}

// ── Enrichment ────────────────────────────────────────────────────────────────

function getApiKey(): string {
  if (typeof window === "undefined") return ""
  // Get first active production key from localStorage
  const keys = localStorage.getItem("dp_api_keys")
  if (keys) {
    const parsed = JSON.parse(keys)
    if (parsed.length > 0) return parsed[0]
  }
  return localStorage.getItem("dp_prod_key") || ""
}

async function enrichFetch(path: string, body: any) {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Erreur serveur" }))
    throw new Error(err.detail || "Erreur inconnue")
  }
  return res.json()
}

export const enrichAPI = {
  async company(name: string, country?: string, website?: string) {
    return enrichFetch("/v1/enrich/company", { name, country, website })
  },

  async contact(data: { email?: string; first_name?: string; last_name?: string; company?: string }) {
    return enrichFetch("/v1/enrich/contact", data)
  },

  async batch(companies: Array<{ name: string; country?: string }>) {
    return enrichFetch("/v1/enrich/batch", companies)
  },

  async stats() { return apiFetch("/v1/stats") },
  async history(limit = 50, type?: string) {
    const params = new URLSearchParams({ limit: String(limit) })
    if (type) params.set("type", type)
    return apiFetch(`/v1/history?${params}`)
  },
  async creditHistory() { return apiFetch("/v1/credits/history") },
}

// ── API Keys ──────────────────────────────────────────────────────────────────

export const apiKeysAPI = {
  async list() { return apiFetch("/v1/apikeys") },
  async create(label: string, environment: string) {
    return apiFetch("/v1/apikeys", { method: "POST", body: JSON.stringify({ label, environment }) })
  },
  async revoke(id: string) { return apiFetch(`/v1/apikeys/${id}`, { method: "DELETE" }) },
}
