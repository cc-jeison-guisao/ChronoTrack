import type { EmployeeSummary } from '../../types/data';

function fmtHours(n: number): string {
  const h = Math.floor(n);
  const m = Math.round((n - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function EmployeeCard({ summary }: { summary: EmployeeSummary }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
          {summary.userName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{summary.userName}</h3>
          <p className="text-xs text-gray-400">ID: {summary.userId}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <span className="text-gray-400">Días presentes</span>
          <p className="font-semibold text-gray-900">{summary.daysPresent}</p>
        </div>
        <div>
          <span className="text-gray-400">Total horas</span>
          <p className="font-semibold text-gray-900">{fmtHours(summary.totalHours)}</p>
        </div>
        <div>
          <span className="text-gray-400">Promedio/día</span>
          <p className="font-semibold text-gray-900">{fmtHours(summary.avgHoursPerDay)}</p>
        </div>
        <div>
          <span className="text-gray-400">Entrada más temprana</span>
          <p className="font-semibold text-gray-900">{summary.earliestEntry}</p>
        </div>
        <div>
          <span className="text-gray-400">Salida más tardía</span>
          <p className="font-semibold text-gray-900">{summary.latestExit}</p>
        </div>
      </div>
    </div>
  );
}
