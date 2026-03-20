import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Row } from '../../types/data';

interface Props {
  rows: Row[];
  xKey: string;
  yKey: string;
  title: string;
}

function formatLabel(value: unknown): string {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toLocaleDateString('es-ES');
  }
  return String(value ?? 'N/A');
}

export function BarChartView({ rows, xKey, yKey, title }: Props) {
  const data = useMemo(() => {
    const agg: Record<string, number> = {};
    for (const row of rows) {
      const label = formatLabel(row[xKey]);
      const val = Number(row[yKey]) || 0;
      agg[label] = (agg[label] || 0) + val;
    }
    return Object.entries(agg)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
  }, [rows, xKey, yKey]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-600 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
