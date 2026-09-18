import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BarChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  color?: string;
  height?: number;
}

export default function BarChart({ data, title, color = '#ef4444', height = 300 }: BarChartProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      {title && <h3 className="text-lg font-semibold mb-4 dark:text-white">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number) => [value, 'Orders']}
          />
          <Legend />
          <Bar
            dataKey="value"
            fill={color}
            radius={[8, 8, 0, 0]}
            name="Orders"
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
