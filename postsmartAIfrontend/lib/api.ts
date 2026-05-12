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

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('remember_me')
      window.location.href = '/'
    }
    throw new Error('Session expirée')
  }

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

// ── Types communs ──────────────────────────────────────────────────────────

export interface QualityScore {
  clarity: number
  empathy: number
  compliance: number
  overall?: number
}

/** Résultat de la seconde passe de vérification charte (P2) */
export interface ComplianceVerification {
  score: number
  compliant: boolean
  issues: string[]
  suggestions: string[]
}

/** Données structurées internes d'un compte-rendu (P1) */
export interface StructuredData {
  context: string
  client_request: string
  actions_taken: string[]
  commitments: string[]
  follow_up_date: string | null
  status: 'open' | 'closed' | 'follow_up_required'
}

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
  quality_score: QualityScore
  tone?: string
  warnings?: string[]
  /** Données structurées internes pour le rapport CR (P1) */
  structured_data?: StructuredData
  /** Vérification charte indépendante (P2) */
  compliance_verification?: ComplianceVerification
}

export interface ImprovedEmail {
  improved_body: string
  changes: string[]
  quality_score: QualityScore
  compliance_verification?: ComplianceVerification
}

export interface ChatResponse {
  reply: string
  sources: string[]
  escalade_alert?: boolean
}

/** Historique d'escalade — audit trail (P1) */
export interface EscalationHistory {
  id: number
  email_id: number
  escalated_by: number
  escalated_to_user_id: number | null
  escalated_to_role: string | null
  reason: string | null
  urgency_level: 'immediate' | 'high' | 'normal'
  signals_detected: unknown[] | null
  acknowledged_at: string | null
  acknowledged_by: number | null
  sla_notified_at: string | null
  created_at: string
}

/** Réponse de l'endpoint POST /emails/{id}/escalate */
export interface EscalateResponse {
  email: Record<string, unknown>
  escalation: EscalationHistory
}

/** Compte-rendu d'appel complet */
export interface CallReportRecord {
  id: number
  user_id: number
  email_inbox_id: number | null
  report_type: 'client_email' | 'internal_report'
  client_name: string
  client_email: string | null
  client_phone: string | null
  call_date: string
  demand_type: string
  call_summary: string
  commitments: string | null
  next_steps: string | null
  urgency: 'faible' | 'normale' | 'haute'
  call_duration: number | null
  ai_response: string | null
  validated_response: string | null
  ai_quality_score: QualityScore | null
  validated_at: string | null
  status: 'draft' | 'validated' | 'archived'
  structured_data: StructuredData | null
  internal_status: 'open' | 'closed' | 'follow_up_required'
  visible_to_manager: boolean
  user?: { id: number; name: string; email: string }
  created_at: string
}
