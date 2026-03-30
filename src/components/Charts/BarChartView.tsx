import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#666' }} stroke={isDark ? '#4b5563' : '#ccc'} />
          <YAxis tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#666' }} stroke={isDark ? '#4b5563' : '#ccc'} />
          <Tooltip
            contentStyle={isDark ? { backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' } : undefined}
            labelStyle={isDark ? { color: '#f3f4f6' } : undefined}
          />
          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
