import type { ColumnStats } from '../../types/data';

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { maximumFractionDigits: 2 });
}

export function StatCard({ stat }: { stat: ColumnStats }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate mb-3" title={stat.label}>
        {stat.label}
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <span className="text-gray-400 dark:text-gray-500">Total</span>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{fmt(stat.sum)}</p>
        </div>
        <div>
          <span className="text-gray-400 dark:text-gray-500">Promedio</span>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{fmt(stat.mean)}</p>
        </div>
        <div>
          <span className="text-gray-400 dark:text-gray-500">Mín</span>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{fmt(stat.min)}</p>
        </div>
        <div>
          <span className="text-gray-400 dark:text-gray-500">Máx</span>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{fmt(stat.max)}</p>
        </div>
        <div>
          <span className="text-gray-400 dark:text-gray-500">Mediana</span>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{fmt(stat.median)}</p>
        </div>
        <div>
          <span className="text-gray-400 dark:text-gray-500">Registros</span>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{stat.count}</p>
        </div>
      </div>
    </div>
  );
}
