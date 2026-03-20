import { useMemo } from 'react';
import { useDataState } from '../../context/DataContext';
import { useScheduleState, minutesToTimeStr, DEFAULT_ENTRY, DEFAULT_EXIT } from '../../context/ScheduleContext';
import { StatCard } from './StatCard';
import { DepartmentCard, type DepartmentSummary } from './DepartmentCard';

interface Props {
  onSelectDepartment?: (dept: string, index: number) => void;
}

export function StatsSummary({ onSelectDepartment }: Props) {
  const { stats, attendanceSummaries, parsedData } = useDataState();
  const schedules = useScheduleState();
  const isAttendance = parsedData?.isAttendance ?? false;

  const departmentSummaries = useMemo((): DepartmentSummary[] => {
    if (!isAttendance || !parsedData?.attendanceKeys) return [];

    const { departmentKey, userIdKey, userNameKey } = parsedData.attendanceKeys;
    if (!departmentKey) return [];

    const empKey = userIdKey ?? userNameKey;
    if (!empKey) return [];

    // Group rows by department, then find unique employees and who was late
    const deptMap = new Map<string, { employees: Set<string>; lateEmployees: Set<string> }>();

    for (const row of parsedData.rows) {
      const dept = String(row[departmentKey] ?? '').trim();
      const empId = String(row[empKey] ?? '').trim();
      if (!dept || !empId) continue;

      if (!deptMap.has(dept)) deptMap.set(dept, { employees: new Set(), lateEmployees: new Set() });
      const entry = deptMap.get(dept)!;
      entry.employees.add(empId);

      const entradaTardia = row['Entrada Tardía'];
      if (typeof entradaTardia === 'string' && entradaTardia.startsWith('Tarde')) {
        entry.lateEmployees.add(empId);
      }
    }

    return Array.from(deptMap.entries()).map(([dept, { employees, lateEmployees }]) => {
      const sched = schedules[dept];
      const entry = sched ? minutesToTimeStr(sched.entryTime) : minutesToTimeStr(DEFAULT_ENTRY);
      const exit = sched ? minutesToTimeStr(sched.exitTime) : minutesToTimeStr(DEFAULT_EXIT);

      return {
        department: dept,
        employeeCount: employees.size,
        lateCount: lateEmployees.size,
        schedule: `${entry} - ${exit}`,
      };
    }).sort((a, b) => a.department.localeCompare(b.department));
  }, [isAttendance, parsedData, schedules]);

  if (isAttendance && attendanceSummaries.length > 0) {
    const totalEmployees = attendanceSummaries.length;
    const totalDepartments = departmentSummaries.length;
    const totalLateEmployees = departmentSummaries.reduce((a, b) => a + b.lateCount, 0);
    const totalRecords = parsedData?.rows.length ?? 0;

    return (
      <div className="space-y-4">
        {/* Global metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalEmployees}</p>
            <p className="text-sm text-gray-500">Colaboradores</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{totalDepartments}</p>
            <p className="text-sm text-gray-500">Departamentos</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{totalLateEmployees}</p>
            <p className="text-sm text-gray-500">Llegaron tarde</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{totalRecords}</p>
            <p className="text-sm text-gray-500">Registros</p>
          </div>
        </div>

        {/* Per-department cards */}
        <h2 className="text-lg font-semibold text-gray-800">Resumen por Departamento</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departmentSummaries.map((s, i) => (
            <DepartmentCard
              key={s.department}
              summary={s}
              index={i}
              onClick={onSelectDepartment ? () => onSelectDepartment(s.department, i) : undefined}
            />
          ))}
        </div>
      </div>
    );
  }

  // Generic stats fallback
  if (stats.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Resumen Estadístico</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </div>
    </div>
  );
}
