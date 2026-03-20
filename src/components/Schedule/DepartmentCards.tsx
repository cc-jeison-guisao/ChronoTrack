import { useMemo, useState } from 'react';
import { useScheduleState, minutesToTimeStr } from '../../context/ScheduleContext';

interface DepartmentInfo {
  name: string;
  employeeCount: number;
  entryTime: string;
  exitTime: string;
}

const DEPT_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
  'bg-indigo-100 text-indigo-700',
];

function getDeptColor(index: number): string {
  return DEPT_COLORS[index % DEPT_COLORS.length];
}

interface Props {
  onSelectDepartment: (dept: string) => void;
}

export function DepartmentCards({ onSelectDepartment }: Props) {
  const schedules = useScheduleState();
  const [searchTerm, setSearchTerm] = useState('');

  const departments: DepartmentInfo[] = useMemo(() => {
    return Object.values(schedules).map((dept) => ({
      name: dept.department,
      employeeCount: dept.employees.length,
      entryTime: minutesToTimeStr(dept.entryTime),
      exitTime: minutesToTimeStr(dept.exitTime),
    }));
  }, [schedules]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    const term = searchTerm.toLowerCase();
    return departments.filter((d) => d.name.toLowerCase().includes(term));
  }, [departments, searchTerm]);

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No se encontraron departamentos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((dept, idx) => (
            <button
              key={dept.name}
              onClick={() => onSelectDepartment(dept.name)}
              className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-blue-300 hover:shadow-md transition-all duration-150 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${getDeptColor(idx)}`}>
                  {dept.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {dept.employeeCount} {dept.employeeCount === 1 ? 'colaborador' : 'colaboradores'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{dept.entryTime} - {dept.exitTime}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
