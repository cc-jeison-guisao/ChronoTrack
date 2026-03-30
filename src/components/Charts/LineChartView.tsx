import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import type { Row } from '../../types/data';

interface Props {
  rows: Row[];
  xKey: string;
  yKey: string;
  title: string;
}

export function LineChartView({ rows, xKey, yKey, title }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const data = useMemo(() => {
    return rows
      .map((row) => {
        const xVal = row[xKey];
        const x = xVal instanceof Date ? xVal.toLocaleDateString('es-ES') : String(xVal ?? '');
        return { x, y: Number(row[yKey]) || 0 };
      })
      .slice(0, 500);
  }, [rows, xKey, yKey]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
          <XAxis dataKey="x" tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#666' }} stroke={isDark ? '#4b5563' : '#ccc'} />
          <YAxis tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#666' }} stroke={isDark ? '#4b5563' : '#ccc'} />
          <Tooltip
            contentStyle={isDark ? { backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' } : undefined}
            labelStyle={isDark ? { color: '#f3f4f6' } : undefined}
          />
          <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2} dot={data.length < 50} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
