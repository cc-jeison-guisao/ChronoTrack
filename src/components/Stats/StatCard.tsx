import type { ColumnStats } from '../../types/data';

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { maximumFractionDigits: 2 });
}

export function StatCard({ stat }: { stat: ColumnStats }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-500 truncate mb-3" title={stat.label}>
        {stat.label}
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <span className="text-gray-400">Total</span>
          <p className="font-semibold text-gray-900">{fmt(stat.sum)}</p>
        </div>
        <div>
          <span className="text-gray-400">Promedio</span>
          <p className="font-semibold text-gray-900">{fmt(stat.mean)}</p>
        </div>
        <div>
          <span className="text-gray-400">Mín</span>
          <p className="font-semibold text-gray-900">{fmt(stat.min)}</p>
        </div>
        <div>
          <span className="text-gray-400">Máx</span>
          <p className="font-semibold text-gray-900">{fmt(stat.max)}</p>
        </div>
        <div>
          <span className="text-gray-400">Mediana</span>
          <p className="font-semibold text-gray-900">{fmt(stat.median)}</p>
        </div>
        <div>
          <span className="text-gray-400">Registros</span>
          <p className="font-semibold text-gray-900">{stat.count}</p>
        </div>
      </div>
    </div>
  );
}
