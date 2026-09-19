import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Calendar, TrendingUp, TrendingDown, Download, Users, ShoppingBag, DollarSign, Clock } from 'lucide-react';
import {
  getRevenueData,
  getPopularItems,
  getPeakHours,
  getCustomerInsights,
  getOrderTypeDistribution,
  getAnalyticsStats,
  getDateRangeConfig,
  exportToCSV,
  type DateRange,
} from '../../services/analyticsService';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import DonutChart from '../charts/DonutChart';
import HeatmapChart from '../charts/HeatmapChart';

interface AnalyticsProps {
  cafeId?: string;
}

export default function Analytics({ cafeId = 'demo-cafe-id' }: AnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange>('7days');
  const [customStart, setCustomStart] = useState<Date>(subDays(new Date(), 7));
  const [customEnd, setCustomEnd] = useState<Date>(new Date());

  const dateRangeConfig = getDateRangeConfig(dateRange, customStart, customEnd);

  // Fetch analytics stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-stats', cafeId, dateRangeConfig],
    queryFn: () => getAnalyticsStats(cafeId, dateRangeConfig),
    enabled: !!cafeId,
  });

  // Fetch revenue data
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-data', cafeId, dateRangeConfig],
    queryFn: () => getRevenueData(cafeId, dateRangeConfig),
    enabled: !!cafeId,
  });

  // Fetch popular items
  const { data: popularItemsData, isLoading: popularLoading } = useQuery({
    queryKey: ['popular-items', cafeId, dateRangeConfig],
    queryFn: () => getPopularItems(cafeId, dateRangeConfig, 10),
    enabled: !!cafeId,
  });

  // Fetch peak hours
  const { data: peakHoursData, isLoading: peakLoading } = useQuery({
    queryKey: ['peak-hours', cafeId, dateRangeConfig],
    queryFn: () => getPeakHours(cafeId, dateRangeConfig),
    enabled: !!cafeId,
  });

  // Fetch customer insights
  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ['customer-insights', cafeId, dateRangeConfig],
    queryFn: () => getCustomerInsights(cafeId, dateRangeConfig),
    enabled: !!cafeId,
  });

  // Fetch order type distribution
  const { data: orderTypeData, isLoading: orderTypeLoading } = useQuery({
    queryKey: ['order-type-distribution', cafeId, dateRangeConfig],
    queryFn: () => getOrderTypeDistribution(cafeId, dateRangeConfig),
    enabled: !!cafeId,
  });

  const handleExport = () => {
    if (revenueData?.data) {
      exportToCSV(revenueData.data, `analytics-report-${format(new Date(), 'yyyy-MM-dd')}`);
    }
  };

  const stats = statsData?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights for your cafe
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range:</span>
          </div>
          <div className="flex gap-2">
            {(['today', '7days', '30days', 'custom'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {range === 'today' && 'Today'}
                {range === '7days' && 'Last 7 Days'}
                {range === '30days' && 'Last 30 Days'}
                {range === 'custom' && 'Custom'}
              </button>
            ))}
          </div>
          {dateRange === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                value={format(customStart, 'yyyy-MM-dd')}
                onChange={(e) => setCustomStart(new Date(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <span className="flex items-center text-gray-500">to</span>
              <input
                type="date"
                value={format(customEnd, 'yyyy-MM-dd')}
                onChange={(e) => setCustomEnd(new Date(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₹${stats?.total_revenue.toFixed(2) || '0.00'}`}
          trend={stats?.revenue_trend}
          icon={<DollarSign className="w-6 h-6" />}
          color="emerald"
          loading={statsLoading}
        />
        <StatCard
          title="Total Orders"
          value={stats?.total_orders.toString() || '0'}
          trend={stats?.orders_trend}
          icon={<ShoppingBag className="w-6 h-6" />}
          color="blue"
          loading={statsLoading}
        />
        <StatCard
          title="Avg Order Value"
          value={`₹${stats?.average_order_value.toFixed(2) || '0.00'}`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="amber"
          loading={statsLoading}
        />
        <StatCard
          title="Total Customers"
          value={stats?.total_customers.toString() || '0'}
          icon={<Users className="w-6 h-6" />}
          color="purple"
          loading={statsLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2">
          {revenueLoading ? (
            <ChartSkeleton />
          ) : revenueData?.data ? (
            <LineChart
              data={revenueData.data.map((d) => ({ date: d.date, value: d.revenue }))}
              title="Revenue Over Time"
              color="#ef4444"
              height={350}
            />
          ) : null}
        </div>

        {/* Popular Items */}
        {popularLoading ? (
          <ChartSkeleton />
        ) : popularItemsData?.data ? (
          <BarChart
            data={popularItemsData.data.map((item) => ({
              name: item.name,
              value: item.order_count,
            }))}
            title="Top 10 Popular Items"
            color="#f59e0b"
            height={350}
          />
        ) : null}

        {/* Order Type Distribution */}
        {orderTypeLoading ? (
          <ChartSkeleton />
        ) : orderTypeData?.data ? (
          <DonutChart
            data={orderTypeData.data.map((item) => ({
              name: item.type,
              value: item.count,
            }))}
            title="Order Types"
            height={350}
          />
        ) : null}

        {/* Peak Hours Heatmap */}
        <div className="lg:col-span-2">
          {peakLoading ? (
            <ChartSkeleton />
          ) : peakHoursData?.data ? (
            <HeatmapChart
              data={peakHoursData.data}
              title="Peak Hours (Orders by Day & Hour)"
              height={400}
            />
          ) : null}
        </div>
      </div>

      {/* Customer Insights */}
      {customerLoading ? (
        <ChartSkeleton />
      ) : customerData?.data ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Customer Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">New vs Returning</p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-2xl font-bold text-green-600">{customerData.data.new_customers}</p>
                  <p className="text-xs text-gray-500">New</p>
                </div>
                <div className="text-gray-400">/</div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{customerData.data.returning_customers}</p>
                  <p className="text-xs text-gray-500">Returning</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Avg Frequency</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {customerData.data.avg_frequency.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">orders per customer</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Avg Spend</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{customerData.data.avg_spend.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">per customer</p>
            </div>
          </div>

          {/* Top Customers */}
          {customerData.data.top_customers.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Top Spending Customers
              </h4>
              <div className="space-y-2">
                {customerData.data.top_customers.slice(0, 5).map((customer, index) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {customer.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {customer.total_orders} orders
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      ₹{customer.total_spent.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  trend?: number;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'amber' | 'purple';
  loading?: boolean;
}

function StatCard({ title, value, trend, icon, color, loading }: StatCardProps) {
  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
      {trend !== undefined && (
        <div className="flex items-center gap-1">
          {trend >= 0 ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-500">vs previous period</span>
        </div>
      )}
    </div>
  );
}

// Chart Skeleton Component
function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
      <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}
