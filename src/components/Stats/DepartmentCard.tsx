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

export interface DepartmentSummary {
  department: string;
  employeeCount: number;
  lateCount: number;
  schedule: string; // e.g. "08:00 - 18:00"
}

interface Props {
  summary: DepartmentSummary;
  index: number;
  onClick?: () => void;
}

export function DepartmentCard({ summary, index, onClick }: Props) {
  const color = DEPT_COLORS[index % DEPT_COLORS.length];
  const onTimeCount = summary.employeeCount - summary.lateCount;

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-4 ${onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-150' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${color}`}>
          {summary.department.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{summary.department}</h3>
          <p className="text-xs text-gray-400">
            {summary.employeeCount} {summary.employeeCount === 1 ? 'colaborador' : 'colaboradores'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <span className="text-gray-400">Horario</span>
          <p className="font-semibold text-gray-900">{summary.schedule}</p>
        </div>
        <div>
          <span className="text-gray-400">Llegaron tarde</span>
          <p className="font-semibold text-red-600">{summary.lateCount}</p>
        </div>
        <div>
          <span className="text-gray-400">A tiempo</span>
          <p className="font-semibold text-green-600">{onTimeCount}</p>
        </div>
      </div>
    </div>
  );
}
