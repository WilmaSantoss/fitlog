import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { EvolutionPoint } from '../services/measurement.service';
import { formatDateShort, formatDate } from '@/shared/lib/date';

type Props = {
  data: readonly EvolutionPoint[];
  unit: string;
};

export function EvolutionChart({ data, unit }: Props) {
  const chartData = useMemo(
    () =>
      data.map((p) => ({
        label: formatDateShort(p.recordedAt),
        fullDate: formatDate(p.recordedAt),
        value: p.value,
      })),
    [data],
  );

  if (chartData.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-line text-sm text-fg-muted">
        Sem dados para esta métrica.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 12, bottom: 0, left: -10 }}
        >
          <CartesianGrid stroke="#262d3d" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#9aa3b2"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#9aa3b2"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={48}
            unit={` ${unit}`}
          />
          <Tooltip
            contentStyle={{
              background: '#161b27',
              border: '1px solid #262d3d',
              borderRadius: 12,
              color: '#f5f7fa',
              fontSize: 12,
            }}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.fullDate ?? ''
            }
            formatter={(value) => [`${value} ${unit}`, '']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#3b82f6', stroke: '#3b82f6' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
