# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server (localhost:5173)
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview production build
npx tsc --noEmit # Type check only (no emit)
```

## Architecture

ChronoTrack is a **frontend-only** React app that reads Excel files in the browser and displays an interactive dashboard. No backend.

**Stack**: React 18, TypeScript, Vite, TailwindCSS, SheetJS (xlsx), Recharts.

### Data Flow

```
Excel file → excelParser (SheetJS) → columnDetector (infer types)
  → DataContext (useReducer state)
    → statsEngine (numeric stats or attendance metrics)
    → chartSuggester (auto-suggest charts based on column types)
    → UI: StatsSummary + ChartPanel + DataTable
```

### Attendance Mode

The app auto-detects attendance Excel files by looking for columns matching patterns like `amonduty`/`pmoffduty`/`clockin`/`clockout` (normalized, case-insensitive). When detected:

- Computes derived column `Horas Trabajadas` (clock-out minus clock-in)
- Stores `_horasDecimal` as hidden numeric column (used for charts, hidden from table)
- Shows per-employee summary cards instead of generic numeric stats
- Suggests attendance-specific charts (hours by employee, trend by date)

**Important**: Column matching uses exact match first, then `includes` fallback. This is critical because Excel files may have 4 time columns (`A M OnDuty`, `A M OffDuty`, `P M OnDuty`, `P M OffDuty`) and `includes("offduty")` would match both `amoffduty` and `pmoffduty`. The pattern arrays are ordered with the most specific match first (e.g., `pmoffduty` before `offduty`).

### Key Patterns

- **Hidden columns**: Columns prefixed with `_` (like `_horasDecimal`) are included in `ParsedData.columns` for charts/stats but filtered out in `DataTable` and `ChartPanel`'s custom chart selector.
- **Time detection**: SheetJS with `cellDates: true` converts time-only cells to Date objects on 1899-12-30. The column detector checks `getFullYear() <= 1900` to distinguish time from date.
- **State**: `DataContext` uses `useReducer`. After `SET_DATA`, a `useEffect` auto-computes stats and chart suggestions.

## Language

The UI is in Spanish (es-ES). Number formatting uses `toLocaleString('es-ES')`, dates use `toLocaleDateString('es-ES')`.
