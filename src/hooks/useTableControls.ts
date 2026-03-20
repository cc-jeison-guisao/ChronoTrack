import { useCallback, useMemo, useState } from 'react';
import type { Row, ColumnMeta, SortDirection } from '../types/data';

interface TableControls {
  search: string;
  setSearch: (s: string) => void;
  sortColumn: string | null;
  sortDirection: SortDirection;
  toggleSort: (column: string) => void;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  setPageSize: (s: number) => void;
  filteredRows: Row[];
  paginatedRows: Row[];
  totalPages: number;
  dateFrom: string;
  setDateFrom: (d: string) => void;
  dateTo: string;
  setDateTo: (d: string) => void;
  onlyLateEntry: boolean;
  setOnlyLateEntry: (v: boolean) => void;
}

function rowDateToDateStr(value: unknown): string | null {
  if (value instanceof Date && !isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return match[0];
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  return null;
}

/**
 * Given a "from" date string (YYYY-MM-DD), compute the "to" date:
 * - If the selected day is Mon-Thu → Friday of that same week
 * - If the selected day is Fri, Sat, or Sun → same date
 */
function computeAutoDateTo(fromStr: string): string {
  const d = new Date(fromStr + 'T12:00:00'); // noon to avoid timezone edge cases
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

  if (day >= 1 && day <= 4) {
    // Mon(1)-Thu(4): advance to Friday
    d.setDate(d.getDate() + (5 - day));
  }
  // Fri(5), Sat(6), Sun(0): keep same date

  return d.toISOString().slice(0, 10);
}

export function useTableControls(rows: Row[], columns: ColumnMeta[], dateKey?: string): TableControls {
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [dateFrom, setDateFromRaw] = useState('');
  const [dateTo, setDateToRaw] = useState('');
  const [onlyLateEntry, setOnlyLateEntry] = useState(false);

  const setDateFrom = useCallback((d: string) => {
    setDateFromRaw(d);
    if (d) {
      setDateToRaw(computeAutoDateTo(d));
    } else {
      setDateToRaw('');
    }
    setPage(0);
  }, []);

  const setDateTo = useCallback((d: string) => {
    setDateToRaw(d);
    setPage(0);
  }, []);

  const toggleSort = (column: string) => {
    if (sortColumn !== column) {
      setSortColumn(column);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortColumn(null);
      setSortDirection(null);
    }
    setPage(0);
  };

  // Filter by date range (string comparison to avoid timezone issues)
  const dateFilteredRows = useMemo(() => {
    if (!dateKey || (!dateFrom && !dateTo)) return rows;

    return rows.filter((row) => {
      const dateStr = rowDateToDateStr(row[dateKey]);
      if (dateStr === null) return true;
      if (dateFrom && dateStr < dateFrom) return false;
      if (dateTo && dateStr > dateTo) return false;
      return true;
    });
  }, [rows, dateKey, dateFrom, dateTo]);

  // Filter by late entry
  const lateFilteredRows = useMemo(() => {
    if (!onlyLateEntry) return dateFilteredRows;
    return dateFilteredRows.filter((row) => {
      const val = row['_entradaTardeMin'];
      return typeof val === 'number' && val > 0;
    });
  }, [dateFilteredRows, onlyLateEntry]);

  // Filter by search
  const filteredRows = useMemo(() => {
    if (!search.trim()) return lateFilteredRows;
    const term = search.toLowerCase();
    return lateFilteredRows.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(term);
      })
    );
  }, [lateFilteredRows, columns, search]);

  const sortedRows = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredRows;
    const col = columns.find((c) => c.key === sortColumn);
    if (!col) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let cmp: number;
      if (col.type === 'numeric') {
        cmp = Number(aVal) - Number(bVal);
      } else if (col.type === 'date') {
        cmp = new Date(aVal as string | Date).getTime() - new Date(bVal as string | Date).getTime();
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return sortDirection === 'desc' ? -cmp : cmp;
    });
  }, [filteredRows, sortColumn, sortDirection, columns]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const paginatedRows = sortedRows.slice(page * pageSize, (page + 1) * pageSize);

  return {
    search,
    setSearch: (s: string) => { setSearch(s); setPage(0); },
    sortColumn,
    sortDirection,
    toggleSort,
    page,
    setPage,
    pageSize,
    setPageSize: (s: number) => { setPageSize(s); setPage(0); },
    filteredRows: sortedRows,
    paginatedRows,
    totalPages,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    onlyLateEntry,
    setOnlyLateEntry: (v: boolean) => { setOnlyLateEntry(v); setPage(0); },
  };
}
