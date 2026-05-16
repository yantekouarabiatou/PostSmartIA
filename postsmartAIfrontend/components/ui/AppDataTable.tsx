"use client"

import { useState } from "react"
import DataTable, { type TableColumn, type TableProps } from "react-data-table-component"

const customStyles = {
  headRow: {
    style: {
      backgroundColor: "#00205B",
      color: "#ffffff",
      fontSize: "13px",
      fontWeight: "600",
      borderRadius: "8px 8px 0 0",
    },
  },
  headCells: {
    style: { color: "#ffffff", paddingLeft: "16px", paddingRight: "16px" },
  },
  rows: {
    style: { fontSize: "13px", minHeight: "48px", borderBottom: "1px solid #F0F0F0" },
    highlightOnHoverStyle: {
      backgroundColor: "#EBF4FF",
      borderBottomColor: "#FFFFFF",
      cursor: "pointer",
    },
  },
  cells: { style: { paddingLeft: "16px", paddingRight: "16px" } },
  pagination: {
    style: { fontSize: "13px", color: "#374151", borderTop: "1px solid #E5E7EB" },
  },
}

const paginationOptions = {
  rowsPerPageText: "Lignes par page :",
  rangeSeparatorText: "sur",
  selectAllRowsItem: true,
  selectAllRowsItemText: "Tout",
}

interface AppDataTableProps<T extends object> extends Omit<TableProps<T>, "columns" | "data"> {
  columns: TableColumn<T>[]
  data: T[]
  title?: string
  loading?: boolean
  searchable?: boolean
  onRowClicked?: (row: T) => void
}

export default function AppDataTable<T extends object>({
  columns,
  data,
  title,
  loading = false,
  searchable = true,
  onRowClicked,
  ...props
}: AppDataTableProps<T>) {
  const [search, setSearch] = useState("")

  // Strip boolean props that react-data-table-component forwards to DOM elements
  const safeColumns = columns.map(({ allowOverflow: _, right, ...col }) => {
    if (!right) return col as TableColumn<T>
    return {
      ...col,
      style:       { justifyContent: "flex-end", ...(col.style as object ?? {}) },
      headerStyle: { justifyContent: "flex-end", ...(col.headerStyle as object ?? {}) },
    } as TableColumn<T>
  })

  const filtered = searchable && search.trim()
    ? data.filter(row =>
        Object.values(row as Record<string, unknown>).some(val =>
          String(val ?? "").toLowerCase().includes(search.toLowerCase())
        )
      )
    : data

  return (
    <div style={{
      background: "#fff",
      borderRadius: "12px",
      border: "1px solid #E5E7EB",
      overflow: "hidden",
    }}>
      {(title || searchable) && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #F0F0F0",
        }}>
          {title && (
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#00205B" }}>
              {title}
            </h3>
          )}
          {searchable && (
            <input
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                fontSize: "13px",
                width: "220px",
                outline: "none",
              }}
            />
          )}
        </div>
      )}
      <DataTable
        columns={safeColumns}
        data={filtered}
        progressPending={loading}
        progressComponent={
          <div style={{ padding: "40px", color: "#6B7280" }}>Chargement...</div>
        }
        pagination
        paginationComponentOptions={paginationOptions}
        customStyles={customStyles}
        highlightOnHover
        pointerOnHover
        onRowClicked={onRowClicked}
        noDataComponent={
          <div style={{ padding: "40px", color: "#6B7280", textAlign: "center" }}>
            Aucune donnée disponible
          </div>
        }
        {...props}
      />
    </div>
  )
}
