'use client'

import * as React from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Simple theme provider without next-themes to avoid hydration mismatches
  // Can be enhanced later with localStorage + useEffect if needed
  return <>{children}</>
}
