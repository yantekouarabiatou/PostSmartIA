"use client"

import ReactSelect, { type StylesConfig, type GroupBase } from "react-select"

export interface SelectOption {
  value: string
  label: string
}

const SELECT_STYLES: StylesConfig<SelectOption, boolean, GroupBase<SelectOption>> = {
  control: (base, state) => ({
    ...base,
    minHeight: "40px",
    borderRadius: "8px",
    borderColor: state.isFocused ? "#0066CC" : "#E5E7EB",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(0,102,204,0.15)" : "none",
    "&:hover": { borderColor: "#0066CC" },
    fontFamily: "inherit",
    fontSize: "14px",
    cursor: "pointer",
    background: "var(--background, #fff)",
    transition: "border-color 150ms, box-shadow 150ms",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#0066CC" : state.isFocused ? "#EBF4FF" : "transparent",
    color: state.isSelected ? "#fff" : "#1A1A2E",
    fontSize: "14px",
    fontFamily: "inherit",
    cursor: "pointer",
    padding: "9px 14px",
    borderRadius: "6px",
    margin: "1px 4px",
    width: "calc(100% - 8px)",
  }),
  placeholder: (base) => ({ ...base, color: "#9CA3AF", fontSize: "14px" }),
  singleValue: (base) => ({ ...base, color: "inherit", fontSize: "14px" }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#EBF4FF",
    borderRadius: "6px",
  }),
  multiValueLabel: (base) => ({ ...base, color: "#0066CC", fontSize: "13px", fontWeight: 500 }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#0066CC",
    borderRadius: "0 6px 6px 0",
    "&:hover": { backgroundColor: "#DC2626", color: "#fff" },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "10px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
    border: "1px solid #E5E7EB",
    zIndex: 9999,
    overflow: "hidden",
  }),
  menuList: (base) => ({ ...base, padding: "4px" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "#9CA3AF",
    "&:hover": { color: "#0066CC" },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "#9CA3AF",
    "&:hover": { color: "#DC2626" },
  }),
}

interface AppSelectProps {
  options: SelectOption[]
  value: SelectOption | SelectOption[] | null
  onChange: (value: SelectOption | SelectOption[] | null) => void
  placeholder?: string
  isMulti?: boolean
  isClearable?: boolean
  isSearchable?: boolean
  isDisabled?: boolean
  label?: string | null
  required?: boolean
  error?: string | null
  noOptionsMessage?: string
  className?: string
}

export default function AppSelect({
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
  isMulti = false,
  isClearable = false,
  isSearchable = true,
  isDisabled = false,
  label = null,
  required = false,
  error = null,
  noOptionsMessage = "Aucune option disponible",
  className,
}: AppSelectProps) {
  return (
    <div className={className} style={{ width: "100%" }}>
      {label && (
        <label style={{
          display: "block", marginBottom: "6px",
          fontSize: "13px", fontWeight: 500, color: "inherit",
        }}>
          {label}
          {required && <span style={{ color: "#DC2626", marginLeft: "3px" }}>*</span>}
        </label>
      )}
      <ReactSelect
        options={options}
        value={value}
        onChange={onChange as any}
        placeholder={placeholder}
        isMulti={isMulti}
        isClearable={isClearable}
        isSearchable={isSearchable}
        isDisabled={isDisabled}
        styles={SELECT_STYLES}
        noOptionsMessage={() => noOptionsMessage}
        loadingMessage={() => "Chargement..."}
        classNamePrefix="app-select"
      />
      {error && (
        <p style={{ color: "#DC2626", fontSize: "12px", marginTop: "4px" }}>
          {error}
        </p>
      )}
    </div>
  )
}
