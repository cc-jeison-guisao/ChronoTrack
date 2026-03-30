import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDataState } from '../../context/DataContext';
import { useScheduleState, minutesToTimeStr, DEFAULT_ENTRY, DEFAULT_EXIT } from '../../context/ScheduleContext';
import { useTheme } from '../../context/ThemeContext';
import { DataTable } from '../Table/DataTable';

function fmtMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

const DEPT_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
];

interface Props {
  department: string;
  colorIndex: number;
  onBack: () => void;
  onSelectEmployee?: (employeeId: string) => void;
}

export function DashboardDepartmentDetail({ department, colorIndex, onBack, onSelectEmployee }: Props) {
  const { parsedData } = useDataState();
  const schedules = useScheduleState();
  const { theme } = useTheme();

  const sched = schedules[department];
  const entry = sched ? minutesToTimeStr(sched.entryTime) : minutesToTimeStr(DEFAULT_ENTRY);
  const exit = sched ? minutesToTimeStr(sched.exitTime) : minutesToTimeStr(DEFAULT_EXIT);

  // Compute per-employee summaries for this department
  const employeeSummaries = useMemo(() => {
    if (!parsedData?.attendanceKeys?.departmentKey) return [];
    const { departmentKey, userIdKey, userNameKey } = parsedData.attendanceKeys;
    const empKey = userIdKey ?? userNameKey;
    if (!empKey) return [];

    const map = new Map<string, { name: string; totalDays: number; lateDays: number; lateMinutes: number }>();

    for (const row of parsedData.rows) {
      const dept = String(row[departmentKey] ?? '').trim();
      if (dept !== department) continue;
      const empId = String(row[empKey] ?? '').trim();
      if (!empId) continue;

      if (!map.has(empId)) {
        const name = userNameKey ? String(row[userNameKey] ?? empId).trim() : empId;
        map.set(empId, { name, totalDays: 0, lateDays: 0, lateMinutes: 0 });
      }
      const entry = map.get(empId)!;
      entry.totalDays++;

      const entradaTardia = row['Entrada Tardía'];
      if (typeof entradaTardia === 'string' && entradaTardia.startsWith('Tarde')) {
        entry.lateDays++;
      }
      const lateMins = row['_entradaTardeMin'];
      if (typeof lateMins === 'number') entry.lateMinutes += lateMins;
    }

    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.lateDays - a.lateDays);
  }, [parsedData, department]);

  // Derive summary from employeeSummaries
  const summary = useMemo(() => {
    if (employeeSummaries.length === 0) return null;
    const lateCount = employeeSummaries.filter((e) => e.lateDays > 0).length;
    return {
      employeeCount: employeeSummaries.length,
      lateCount,
      onTimeCount: employeeSummaries.length - lateCount,
    };
  }, [employeeSummaries]);

  // Compute late arrivals per day for chart
  const lateByDay = useMemo(() => {
    if (!parsedData?.attendanceKeys?.departmentKey || !parsedData.attendanceKeys.dateKey) return [];
    const { departmentKey, dateKey, userIdKey, userNameKey } = parsedData.attendanceKeys;
    const empKey = userIdKey ?? userNameKey;
    if (!empKey) return [];

    const dayMap = new Map<string, Set<string>>();

    for (const row of parsedData.rows) {
      const dept = String(row[departmentKey] ?? '').trim();
      if (dept !== department) continue;

      const entradaTardia = row['Entrada Tardía'];
      if (typeof entradaTardia !== 'string' || !entradaTardia.startsWith('Tarde')) continue;

      const dateVal = row[dateKey];
      const dateStr = dateVal instanceof Date
        ? dateVal.toLocaleDateString('es-ES')
        : String(dateVal ?? '');
      if (!dateStr) continue;

      const empId = String(row[empKey] ?? '').trim();
      if (!dayMap.has(dateStr)) dayMap.set(dateStr, new Set());
      dayMap.get(dateStr)!.add(empId);
    }

    return Array.from(dayMap.entries())
      .map(([fecha, emps]) => ({ fecha, cantidad: emps.size }))
      .sort((a, b) => {
        // Sort by date: parse dd/mm/yyyy
        const pa = a.fecha.split('/').reverse().join('');
        const pb = b.fecha.split('/').reverse().join('');
        return pa.localeCompare(pb);
      });
  }, [parsedData, department]);

  const [activeTab, setActiveTab] = useState<'colaboradores' | 'graficas' | 'registros'>('colaboradores');
  const color = DEPT_COLORS[colorIndex % DEPT_COLORS.length];
  const isDark = theme === 'dark';

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Volver al dashboard
        </button>

        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ${color}`}>
            {department.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{department}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Departamento</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.employeeCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Colaboradores</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{entry} - {exit}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Horario</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.lateCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Llegaron tarde</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.onTimeCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">A tiempo</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
        {(['colaboradores', 'graficas', 'registros'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab === 'colaboradores' ? 'Colaboradores' : tab === 'graficas' ? 'Gráficas' : 'Registros'}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'colaboradores' && (
        <>
          {/* Employee summary table */}
          {employeeSummaries.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Colaboradores</h3>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900">
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">User ID</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Nombre</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Días registrados</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Llegadas tarde</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Tiempo acumulado tarde</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeSummaries.map((emp) => (
                        <tr
                          key={emp.id}
                          className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${onSelectEmployee ? 'cursor-pointer' : ''}`}
                          onClick={() => onSelectEmployee?.(emp.id)}
                        >
                          <td className="px-4 py-2.5 whitespace-nowrap text-gray-600 dark:text-gray-400">{emp.id}</td>
                          <td className="px-4 py-2.5 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{emp.name}</td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-gray-900 dark:text-gray-100">{emp.totalDays}</td>
                          <td className={`px-4 py-2.5 whitespace-nowrap font-medium ${emp.lateDays > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {emp.lateDays}
                          </td>
                          <td className={`px-4 py-2.5 whitespace-nowrap ${emp.lateMinutes > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {emp.lateMinutes > 0 ? fmtMinutes(emp.lateMinutes) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </>
      )}

      {activeTab === 'graficas' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Llegadas tarde por día</h3>
          {lateByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={lateByDay} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                <XAxis
                  dataKey="fecha"
                  tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#666' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke={isDark ? '#4b5563' : '#ccc'}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#666' }}
                  stroke={isDark ? '#4b5563' : '#ccc'}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} persona${value !== 1 ? 's' : ''}`, 'Llegaron tarde']}
                  labelFormatter={(label) => `Fecha: ${label}`}
                  contentStyle={isDark ? { backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' } : undefined}
                  labelStyle={isDark ? { color: '#f3f4f6' } : undefined}
                />
                <Bar dataKey="cantidad" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">
              No se registraron llegadas tarde en este departamento.
            </div>
          )}
        </div>
      )}

      {activeTab === 'registros' && (
        <DataTable departmentFilter={department} onSelectEmployee={onSelectEmployee} />
      )}
    </div>
  );
}
