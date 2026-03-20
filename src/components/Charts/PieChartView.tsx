import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Row } from '../../types/data';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface Props {
  rows: Row[];
  xKey: string;
  yKey: string;
  title: string;
}

export function PieChartView({ rows, xKey, yKey, title }: Props) {
  const data = useMemo(() => {
    const agg: Record<string, number> = {};
    for (const row of rows) {
      const label = String(row[xKey] ?? 'N/A');
      const val = Number(row[yKey]) || 0;
      agg[label] = (agg[label] || 0) + val;
    }
    return Object.entries(agg).map(([name, value]) => ({ name, value }));
  }, [rows, xKey, yKey]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-600 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
