# Task: Fix Next.js build error "Module not found: Can't resolve <dynamic>"

## Info gathered
- Error occurs during SSR while importing `exportEmailToPdf`.
- Import trace shows:
  - `postsmartAIfrontend/lib/export-pdf.ts` (imports `jspdf`)
  - used by `postsmartAIfrontend/app/dashboard/incoming/page.tsx`
- `jspdf` depends on `fflate` and `jspdf.node` path is being evaluated during Server Component render.

## Plan
1. Make PDF export code client-only:
   - Ensure `export-pdf.ts` is imported only on client.
   - Move `jspdf` import behind a dynamic `import()` inside the export functions.
2. Optionally wrap usage with `use client` boundary or lazy-load component:
   - Keep `incoming/page.tsx` as client component (it already starts with `"use client"`).
   - Ensure it never causes SSR evaluation of `export-pdf.ts`.
3. Update `postsmartAIfrontend/lib/export-pdf.ts`:
   - Remove top-level `import jsPDF from "jspdf"`.
   - Inside each export function, do `const { default: jsPDF } = await import('jspdf')`.
4. Verify build:
   - Run `npm run build` in `postsmartAIfrontend`.

## Dependent files
- `postsmartAIfrontend/lib/export-pdf.ts`
- (indirect) `postsmartAIfrontend/app/dashboard/incoming/page.tsx`

## Followup steps
- `npm install` is only needed if dependencies change.
- Run `npm run build` then `npm run dev` if needed.


