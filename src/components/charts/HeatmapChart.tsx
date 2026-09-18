import { format } from 'date-fns';

interface HeatmapChartProps {
  data: Array<{ hour: number; day_of_week: number; order_count: number }>;
  title?: string;
  height?: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function HeatmapChart({ data, title, height = 400 }: HeatmapChartProps) {
  // Find max value for color scaling
  const maxCount = Math.max(...data.map((d) => d.order_count), 1);

  // Create a lookup map for quick access
  const dataMap = new Map<string, number>();
  data.forEach((d) => {
    dataMap.set(`${d.day_of_week}-${d.hour}`, d.order_count);
  });

  // Get color based on intensity
  const getColor = (count: number): string => {
    if (count === 0) return '#f3f4f6';
    const intensity = count / maxCount;
    if (intensity < 0.2) return '#fecaca';
    if (intensity < 0.4) return '#fca5a5';
    if (intensity < 0.6) return '#f87171';
    if (intensity < 0.8) return '#ef4444';
    return '#dc2626';
  };

  const cellWidth = 30;
  const cellHeight = 30;
  const paddingLeft = 50;
  const paddingTop = 30;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      {title && <h3 className="text-lg font-semibold mb-4 dark:text-white">{title}</h3>}
      <div className="overflow-x-auto">
        <svg width={paddingLeft + HOURS.length * cellWidth} height={paddingTop + DAYS.length * cellHeight} className="mx-auto">
          {/* Hour labels */}
          {HOURS.map((hour) => (
            <text
              key={`hour-${hour}`}
              x={paddingLeft + hour * cellWidth + cellWidth / 2}
              y={20}
              textAnchor="middle"
              className="text-xs fill-gray-600 dark:fill-gray-400"
            >
              {hour}
            </text>
          ))}

          {/* Day labels and cells */}
          {DAYS.map((day, dayIndex) => (
            <g key={`day-${dayIndex}`}>
              <text
                x={40}
                y={paddingTop + dayIndex * cellHeight + cellHeight / 2 + 5}
                textAnchor="end"
                className="text-xs fill-gray-600 dark:fill-gray-400"
              >
                {day}
              </text>
              {HOURS.map((hour) => {
                const count = dataMap.get(`${dayIndex}-${hour}`) || 0;
                return (
                  <g key={`cell-${dayIndex}-${hour}`}>
                    <rect
                      x={paddingLeft + hour * cellWidth}
                      y={paddingTop + dayIndex * cellHeight}
                      width={cellWidth - 2}
                      height={cellHeight - 2}
                      fill={getColor(count)}
                      rx={4}
                      className="transition-all hover:opacity-80 cursor-pointer"
                    >
                      <title>
                        {`${DAYS[dayIndex]} ${hour}:00 - ${count} orders`}
                      </title>
                    </rect>
                    {count > 0 && (
                      <text
                        x={paddingLeft + hour * cellWidth + cellWidth / 2 - 1}
                        y={paddingTop + dayIndex * cellHeight + cellHeight / 2 + 4}
                        textAnchor="middle"
                        className="text-xs fill-white font-medium pointer-events-none"
                      >
                        {count}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <span className="text-xs text-gray-600 dark:text-gray-400">Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f3f4f6' }} />
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fecaca' }} />
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fca5a5' }} />
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f87171' }} />
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dc2626' }} />
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400">More</span>
      </div>
    </div>
  );
}
