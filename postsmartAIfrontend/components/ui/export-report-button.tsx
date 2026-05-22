"use client"

import { useState } from "react"
import { api } from "@/lib/api"

const PERIODS = [
  { value: "week",    label: "Cette semaine" },
  { value: "month",   label: "Ce mois" },
  { value: "quarter", label: "Ce trimestre" },
]

export default function ExportReportButton() {
  const [period, setPeriod]         = useState("month")
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [loadingXlsx, setLoadingXlsx] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handlePdf() {
    setLoadingPdf(true)
    setError(null)
    try {
      const data = await api.get<any>(`/reports/data?period=${period}`)
      const { exportReportToPdf } = await import("@/lib/export-pdf")
      await exportReportToPdf(data)
    } catch (e: any) {
      setError("Erreur lors de la génération du PDF.")
    } finally {
      setLoadingPdf(false)
    }
  }

  async function handleExcel() {
    setLoadingXlsx(true)
    setError(null)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api"
      const res = await fetch(`${baseUrl}/reports/export/excel?period=${period}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.message ?? `Erreur ${res.status}`)
      }

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = `PostSmartIA_Rapport_${new Date().toISOString().split("T")[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de l'export Excel.")
    } finally {
      setLoadingXlsx(false)
    }
  }

  return (
    <div style={{
      borderRadius: 12, border: "1px solid #E5E7EB", background: "#fff",
      padding: "16px 20px", display: "flex", alignItems: "center",
      flexWrap: "wrap", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: "#EFF6FF",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        }}>📊</div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111827" }}>Exporter un rapport</p>
          <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>PDF structuré ou Excel multi-onglets</p>
        </div>
      </div>

      {/* Sélecteur période */}
      <div style={{ display: "flex", gap: 4 }}>
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            style={{
              padding: "5px 12px", borderRadius: 6, border: "1px solid",
              borderColor: period === p.value ? "#0066CC" : "#E5E7EB",
              background: period === p.value ? "#EFF6FF" : "#fff",
              color: period === p.value ? "#0066CC" : "#6B7280",
              fontSize: 12, fontWeight: period === p.value ? 600 : 400, cursor: "pointer",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Bouton PDF */}
      <button
        onClick={handlePdf}
        disabled={loadingPdf}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "9px 16px", borderRadius: 8, border: "none",
          background: "#00205B", color: "#fff",
          fontWeight: 600, fontSize: 13, cursor: loadingPdf ? "wait" : "pointer",
          opacity: loadingPdf ? 0.7 : 1,
        }}
      >
        {loadingPdf
          ? <><Spinner /> Génération…</>
          : <><span>📄</span> Exporter PDF</>
        }
      </button>

      {/* Bouton Excel */}
      <button
        onClick={handleExcel}
        disabled={loadingXlsx}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "9px 16px", borderRadius: 8, border: "1px solid #059669",
          background: "#ECFDF5", color: "#065F46",
          fontWeight: 600, fontSize: 13, cursor: loadingXlsx ? "wait" : "pointer",
          opacity: loadingXlsx ? 0.7 : 1,
        }}
      >
        {loadingXlsx
          ? <><Spinner color="#065F46" /> Génération…</>
          : <><span>📥</span> Exporter Excel</>
        }
      </button>

      {error && (
        <p style={{ width: "100%", margin: 0, fontSize: 12, color: "#DC2626" }}>{error}</p>
      )}
    </div>
  )
}

function Spinner({ color = "#fff" }: { color?: string }) {
  return (
    <div style={{
      width: 13, height: 13,
      border: `2px solid ${color}33`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "spin 0.65s linear infinite",
      flexShrink: 0,
    }} />
  )
}
