import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

interface LineChartProps {
  data: Array<{ date: string; value: number }>;
  title?: string;
  color?: string;
  height?: number;
}

export default function LineChart({ data, title, color = '#ef4444', height = 300 }: LineChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: format(new Date(item.date), 'MMM dd'),
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      {title && <h3 className="text-lg font-semibold mb-4 dark:text-white">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="displayDate"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
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
            formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Value']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
            name="Revenue"
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
