import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDataState } from '../../context/DataContext';

interface Props {
  employeeId: string;
  onBack: () => void;
}

function parseTimeStr(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

function minutesToDisplay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = Math.round(minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function getCellClass(value: unknown, colKey: string): string {
  if (colKey === 'Entrada Tardía' && typeof value === 'string') {
    if (value.startsWith('Tarde')) return 'text-red-600 font-medium';
    if (value === 'A tiempo') return 'text-green-600';
  }
  if (colKey === 'Salida Tardía' && typeof value === 'string') {
    if (value.startsWith('Extra')) return 'text-amber-600 font-medium';
    if (value === 'A tiempo') return 'text-green-600';
  }
  return '';
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (value instanceof Date) return value.toLocaleDateString('es-ES');
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toString() : value.toLocaleString('es-ES', { maximumFractionDigits: 2 });
  }
  return String(value);
}

const PIE_COLORS = ['#10b981', '#ef4444']; // green, red

export function EmployeeDetail({ employeeId, onBack }: Props) {
  const { parsedData } = useDataState();

  const data = useMemo(() => {
    if (!parsedData?.isAttendance || !parsedData.attendanceKeys) return null;

    const { attendanceKeys, rows } = parsedData;
    const idKey = attendanceKeys.userIdKey ?? attendanceKeys.userNameKey;
    if (!idKey) return null;

    const empRows = rows.filter((r) => String(r[idKey] ?? '') === employeeId);
    if (empRows.length === 0) return null;

    const employeeName = attendanceKeys.userNameKey
      ? String(empRows[0][attendanceKeys.userNameKey] ?? employeeId)
      : employeeId;
    const department = attendanceKeys.departmentKey
      ? String(empRows[0][attendanceKeys.departmentKey] ?? '—')
      : '—';
    const empIdDisplay = attendanceKeys.userIdKey
      ? String(empRows[0][attendanceKeys.userIdKey] ?? '')
      : '';

    const totalDays = empRows.length;
    let lateDays = 0;
    let totalLateMinutes = 0;
    let totalExtraMinutes = 0;
    let totalHours = 0;
    const entries: number[] = [];
    const exits: number[] = [];

    for (const row of empRows) {
      const entradaTardia = row['Entrada Tardía'];
      if (typeof entradaTardia === 'string' && entradaTardia.startsWith('Tarde')) {
        lateDays++;
      }
      const lateMins = row['_entradaTardeMin'];
      if (typeof lateMins === 'number') totalLateMinutes += lateMins;

      const extraMins = row['_salidaTardeMin'];
      if (typeof extraMins === 'number') totalExtraMinutes += extraMins;

      const hrs = row['_horasDecimal'];
      if (typeof hrs === 'number') totalHours += hrs;

      if (attendanceKeys.clockInKey) {
        const min = parseTimeStr(row[attendanceKeys.clockInKey]);
        if (min !== null) entries.push(min);
      }
      if (attendanceKeys.clockOutKey) {
        const min = parseTimeStr(row[attendanceKeys.clockOutKey]);
        if (min !== null) exits.push(min);
      }
    }

    const onTimeDays = totalDays - lateDays;
    const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;
    const earliestEntry = entries.length > 0 ? minutesToTimeStr(Math.min(...entries)) : '—';
    const latestExit = exits.length > 0 ? minutesToTimeStr(Math.max(...exits)) : '—';

    // Table columns for this employee's records
    const tableColumns: string[] = [];
    if (attendanceKeys.dateKey) tableColumns.push(attendanceKeys.dateKey);
    if (attendanceKeys.clockInKey) tableColumns.push(attendanceKeys.clockInKey);
    if (attendanceKeys.clockOutKey) tableColumns.push(attendanceKeys.clockOutKey);
    tableColumns.push('Horas Trabajadas', 'Entrada Tardía', 'Salida Tardía');

    return {
      employeeName,
      department,
      empIdDisplay,
      totalDays,
      lateDays,
      onTimeDays,
      totalLateMinutes,
      totalExtraMinutes,
      totalHours,
      avgHoursPerDay,
      earliestEntry,
      latestExit,
      empRows,
      tableColumns,
    };
  }, [parsedData, employeeId]);

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">No se encontraron datos para este colaborador.</p>
        <button onClick={onBack} className="mt-2 text-blue-600 text-sm hover:underline">Volver a lista</button>
      </div>
    );
  }

  const pieData = [
    { name: 'A tiempo', value: data.onTimeDays },
    { name: 'Tarde', value: data.lateDays },
  ];

  const latePercent = data.totalDays > 0
    ? Math.round((data.lateDays / data.totalDays) * 100)
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Volver a lista
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
            {data.employeeName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{data.employeeName}</h2>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
              {data.empIdDisplay && <span>ID: {data.empIdDisplay}</span>}
              {data.department !== '—' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                  {data.department}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Días presentes" value={String(data.totalDays)} color="text-blue-600" />
        <SummaryCard label="Llegadas tarde" value={`${data.lateDays} de ${data.totalDays}`} sub={`${latePercent}%`} color="text-red-600" />
        <SummaryCard label="Total tiempo tarde" value={minutesToDisplay(data.totalLateMinutes)} color="text-red-600" />
      </div>

      {/* Charts + info row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Puntualidad</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Resumen de horarios</h3>
          <div className="space-y-3">
            <InfoRow label="Entrada más temprana" value={data.earliestEntry} />
            <InfoRow label="Salida más tardía" value={data.latestExit} />
            <InfoRow label="Días a tiempo" value={`${data.onTimeDays} de ${data.totalDays}`} valueClass="text-green-600" />
            <InfoRow label="Días con entrada tarde" value={`${data.lateDays} de ${data.totalDays}`} valueClass="text-red-600" />
            <InfoRow label="Promedio minutos tarde (días tarde)" value={data.lateDays > 0 ? minutesToDisplay(Math.round(data.totalLateMinutes / data.lateDays)) : '—'} />
          </div>
        </div>
      </div>

      {/* Records table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Registros de asistencia</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {data.tableColumns.map((col) => (
                  <th key={col} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.empRows.map((row, i) => (
                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                  {data.tableColumns.map((col) => (
                    <td
                      key={col}
                      className={`px-4 py-2.5 whitespace-nowrap ${getCellClass(row[col], col)}`}
                    >
                      {formatCell(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>
        {value}
        {sub && <span className="text-xs font-normal text-gray-400 ml-1">{sub}</span>}
      </p>
    </div>
  );
}

function InfoRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold ${valueClass ?? 'text-gray-900'}`}>{value}</span>
    </div>
  );
}
