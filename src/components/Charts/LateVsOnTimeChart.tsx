import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import type { Row } from '../../types/data';

const COLORS = { late: '#ef4444', onTime: '#10b981' };

interface Props {
  rows: Row[];
}

export function LateVsOnTimeChart({ rows }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const data = useMemo(() => {
    let late = 0;
    let onTime = 0;
    for (const row of rows) {
      const val = row['_llegadaTarde'];
      if (typeof val === 'number') {
        if (val === 1) late++;
        else onTime++;
      }
    }
    return [
      { name: 'A tiempo', value: onTime },
      { name: 'Tarde', value: late },
    ];
  }, [rows]);

  const total = data[0].value + data[1].value;
  if (total === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        Llegadas Tarde vs A Tiempo
      </h3>
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
            <Cell fill={COLORS.onTime} />
            <Cell fill={COLORS.late} />
          </Pie>
          <Tooltip
            contentStyle={isDark ? { backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' } : undefined}
            labelStyle={isDark ? { color: '#f3f4f6' } : undefined}
            itemStyle={isDark ? { color: '#f3f4f6' } : undefined}
            formatter={(value: number) => [value, 'Registros']}
          />
          <Legend wrapperStyle={isDark ? { color: '#d1d5db' } : undefined} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
