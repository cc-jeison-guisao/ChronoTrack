import type { EmployeeSummary } from '../../types/data';

function fmtHours(n: number): string {
  const h = Math.floor(n);
  const m = Math.round((n - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function EmployeeCard({ summary }: { summary: EmployeeSummary }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-bold">
          {summary.userName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{summary.userName}</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">ID: {summary.userId}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <span className="text-gray-400 dark:text-gray-500">Días presentes</span>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{summary.daysPresent}</p>
        </div>
        <div>
          <span className="text-gray-400 dark:text-gray-500">Total horas</span>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{fmtHours(summary.totalHours)}</p>
        </div>
        <div>
          <span className="text-gray-400 dark:text-gray-500">Promedio/día</span>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{fmtHours(summary.avgHoursPerDay)}</p>
        </div>
        <div>
          <span className="text-gray-400 dark:text-gray-500">Entrada más temprana</span>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{summary.earliestEntry}</p>
        </div>
        <div>
          <span className="text-gray-400 dark:text-gray-500">Salida más tardía</span>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{summary.latestExit}</p>
        </div>
      </div>
    </div>
  );
}
