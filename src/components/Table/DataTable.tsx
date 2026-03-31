import { useDataState } from '../../context/DataContext';
import { useScheduleState } from '../../context/ScheduleContext';
import { useTableControls } from '../../hooks/useTableControls';
import { exportAttendanceExcel } from '../../utils/excelExporter';
import type { ColumnMeta } from '../../types/data';

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (value instanceof Date) return value.toLocaleDateString('es-ES');
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toString() : value.toLocaleString('es-ES', { maximumFractionDigits: 2 });
  }
  return String(value);
}

function getCellClass(value: unknown, colKey: string): string {
  if (colKey === 'Entrada Tardía' && typeof value === 'string') {
    if (value.startsWith('Tarde')) return 'text-red-600 dark:text-red-400 font-medium';
    if (value === 'A tiempo') return 'text-green-600 dark:text-green-400';
  }
  if (colKey === 'Salida Tardía' && typeof value === 'string') {
    if (value.startsWith('Extra')) return 'text-amber-600 dark:text-amber-400 font-medium';
    if (value === 'A tiempo') return 'text-green-600 dark:text-green-400';
  }
  return '';
}

function getAttendanceColumns(allColumns: ColumnMeta[], attendanceKeys?: { departmentKey?: string; userIdKey?: string; userNameKey?: string; dateKey?: string; clockInKey?: string; clockOutKey?: string }): ColumnMeta[] {
  if (!attendanceKeys) return allColumns.filter((c) => !c.key.startsWith('_'));

  const orderedKeys: string[] = [];

  // Department (if exists)
  if (attendanceKeys.departmentKey) orderedKeys.push(attendanceKeys.departmentKey);
  // User ID
  if (attendanceKeys.userIdKey) orderedKeys.push(attendanceKeys.userIdKey);
  // User Name
  if (attendanceKeys.userNameKey) orderedKeys.push(attendanceKeys.userNameKey);
  // Date
  if (attendanceKeys.dateKey) orderedKeys.push(attendanceKeys.dateKey);
  // Clock In
  if (attendanceKeys.clockInKey) orderedKeys.push(attendanceKeys.clockInKey);
  // Clock Out
  if (attendanceKeys.clockOutKey) orderedKeys.push(attendanceKeys.clockOutKey);
  // Derived columns
  orderedKeys.push('Entrada Tardía', 'Salida Tardía');

  return orderedKeys
    .map((key) => allColumns.find((c) => c.key === key))
    .filter((c): c is ColumnMeta => c !== undefined);
}

interface Props {
  onSelectEmployee?: (employeeId: string) => void;
  departmentFilter?: string;
}

export function DataTable({ onSelectEmployee, departmentFilter }: Props) {
  const { parsedData } = useDataState();
  const schedules = useScheduleState();
  if (!parsedData) return null;

  const { rows: allRows, columns: allColumns, isAttendance, attendanceKeys } = parsedData;

  // Filter by department if provided
  const rows = departmentFilter && attendanceKeys?.departmentKey
    ? allRows.filter((r) => String(r[attendanceKeys.departmentKey!] ?? '').trim() === departmentFilter)
    : allRows;

  const columns = isAttendance
    ? getAttendanceColumns(allColumns, attendanceKeys)
    : allColumns.filter((c) => !c.key.startsWith('_'));

  const dateKey = attendanceKeys?.dateKey;

  const {
    search, setSearch,
    sortColumn, sortDirection, toggleSort,
    paginatedRows, filteredRows,
    page, setPage, totalPages,
    pageSize, setPageSize,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    onlyLateEntry, setOnlyLateEntry,
  } = useTableControls(rows, columns, dateKey);

  return (
    <div className="relative">
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, ID..."
            className="text-sm border-none outline-none bg-transparent w-52 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        {/* Date filters */}
        {dateKey && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Desde</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm dark:[color-scheme:dark]"
            />
            <span className="text-gray-500 dark:text-gray-400">Hasta</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm dark:[color-scheme:dark]"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Limpiar
              </button>
            )}
          </div>
        )}

        {/* Late entry filter */}
        {isAttendance && (
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyLateEntry}
              onChange={(e) => setOnlyLateEntry(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
            />
            Solo entrada tardía
          </label>
        )}

        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{filteredRows.length} registros</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Página {page + 1} de {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="px-3 py-1 rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortColumn === col.key && (
                      <span className="text-blue-500">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, i) => {
              const empKey = attendanceKeys?.userIdKey ?? attendanceKeys?.userNameKey;
              const canClick = isAttendance && onSelectEmployee && empKey;
              return (
                <tr
                  key={i}
                  className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${canClick ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (canClick) onSelectEmployee(String(row[empKey] ?? '').trim());
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-2.5 whitespace-nowrap ${getCellClass(row[col.key], col.key)}`}
                    >
                      {formatCell(row[col.key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>

    {/* Floating export button */}
    <button
      onClick={() => {
        if (isAttendance && attendanceKeys) {
          exportAttendanceExcel(allRows, attendanceKeys, schedules);
        }
      }}
      className="fixed bottom-6 right-6 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Exportar Excel
    </button>
    </div>
  );
}
