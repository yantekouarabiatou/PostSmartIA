const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message ?? `HTTP ${res.status}`)
  }

  const json = await res.json()
  return json.data as T
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  put: <T>(path: string, body: unknown = {}) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface AnalysisResult {
  service_type: string
  service_type_label: string
  entities: {
    client_name: string | null
    dossier_number: string | null
    main_request: string
    urgency: 'faible' | 'normale' | 'haute'
    tone: string
  }
  quality_score: {
    clarity: number
    empathy_required: number
    complexity: number
  }
  recommended_action: string
}

export interface GeneratedEmail {
  subject: string
  body: string
  quality_score: {
    clarity: number
    empathy: number
    compliance: number
  }
}

export interface ImprovedEmail {
  improved_body: string
  changes_summary: string[]
  quality_score: {
    clarity: number
    empathy: number
    compliance: number
  }
}

export interface ChatResponse {
  reply: string
  sources: string[]
}
