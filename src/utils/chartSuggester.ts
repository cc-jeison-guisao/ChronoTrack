import type { ChartSuggestion, ColumnMeta } from '../types/data';

function suggestAttendanceCharts(columns: ColumnMeta[]): ChartSuggestion[] {
  const suggestions: ChartSuggestion[] = [];

  const userCol = columns.find((c) => {
    const lower = c.key.toLowerCase().replace(/\s+/g, '');
    return ['username', 'employeename', 'nombre', 'colaborador'].some((p) => lower.includes(p));
  }) ?? columns.find((c) => {
    const lower = c.key.toLowerCase().replace(/\s+/g, '');
    return ['userid', 'employeeid'].some((p) => lower.includes(p));
  });

  const dateCol = columns.find((c) => c.type === 'date')
    ?? columns.find((c) => {
      const lower = c.key.toLowerCase().replace(/\s+/g, '');
      return ['date', 'fecha'].some((p) => lower.includes(p));
    });
  const hoursCol = columns.find((c) => c.key === '_horasDecimal');

  // If we have _horasDecimal (hidden), use it as yKey for charts
  const yKey = hoursCol?.key ?? 'Horas Trabajadas';

  if (dateCol) {
    const lateCol = columns.find((c) => c.key === '_llegadaTarde');
    if (lateCol) {
      suggestions.push({
        type: 'bar',
        xKey: dateCol.key,
        yKey: lateCol.key,
        title: 'Llegadas tarde por día',
      });
    }
  }

  if (dateCol) {
    suggestions.push({
      type: 'line',
      xKey: dateCol.key,
      yKey,
      title: 'Horas trabajadas por fecha',
    });
  }

  if (userCol && userCol.uniqueCount <= 10) {
    suggestions.push({
      type: 'pie',
      xKey: userCol.key,
      yKey,
      title: 'Distribución de horas por colaborador',
    });
  }

  return suggestions;
}

function suggestGenericCharts(columns: ColumnMeta[]): ChartSuggestion[] {
  const suggestions: ChartSuggestion[] = [];
  const categorical = columns.filter((c) => c.type === 'categorical');
  const numeric = columns.filter((c) => c.type === 'numeric');
  const dates = columns.filter((c) => c.type === 'date');

  if (categorical.length > 0 && numeric.length > 0) {
    const cat = categorical[0];
    const num = numeric[0];
    suggestions.push({
      type: 'bar',
      xKey: cat.key,
      yKey: num.key,
      title: `${num.label} por ${cat.label}`,
    });

    if (cat.uniqueCount <= 6) {
      suggestions.push({
        type: 'pie',
        xKey: cat.key,
        yKey: num.key,
        title: `Distribución de ${num.label} por ${cat.label}`,
      });
    }
  }

  if (dates.length > 0 && numeric.length > 0) {
    suggestions.push({
      type: 'line',
      xKey: dates[0].key,
      yKey: numeric[0].key,
      title: `${numeric[0].label} en el tiempo`,
    });
  }

  if (numeric.length >= 2 && suggestions.length < 4) {
    suggestions.push({
      type: 'line',
      xKey: numeric[0].key,
      yKey: numeric[1].key,
      title: `${numeric[1].label} vs ${numeric[0].label}`,
    });
  }

  return suggestions.slice(0, 4);
}

export function suggestCharts(columns: ColumnMeta[], isAttendance = false): ChartSuggestion[] {
  return isAttendance ? suggestAttendanceCharts(columns) : suggestGenericCharts(columns);
}
