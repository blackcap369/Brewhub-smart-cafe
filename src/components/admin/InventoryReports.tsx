import { useState, useEffect } from 'react';
import { BarChart3, TrendingDown, DollarSign, Package, Calendar } from 'lucide-react';
import { getStockConsumptionReport, getTransactions, getIngredients } from '../../services/inventoryService';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface InventoryReportsProps {
  cafeId: string;
}

export default function InventoryReports({ cafeId }: InventoryReportsProps) {
  const [reportType, setReportType] = useState<'consumption' | 'transactions' | 'cost'>('consumption');
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'month' | 'custom'>('7days');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [consumptionData, setConsumptionData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);

  useEffect(() => {
    loadReport();
  }, [cafeId, reportType, startDate, endDate]);

  const loadReport = async () => {
    setLoading(true);

    try {
      if (reportType === 'consumption') {
        const { data } = await getStockConsumptionReport(cafeId, startDate, endDate);
        setConsumptionData(data || []);
      } else if (reportType === 'transactions') {
        const { data } = await getTransactions(cafeId, {
          start_date: startDate,
          end_date: endDate,
        });
        setTransactions(data || []);
      } else if (reportType === 'cost') {
        const { data } = await getIngredients(cafeId);
        setIngredients(data || []);
      }
    } catch (error) {
      console.error('Error loading report:', error);
    }

    setLoading(false);
  };

  const handleDateRangeChange = (range: '7days' | '30days' | 'month' | 'custom') => {
    setDateRange(range);
    const today = new Date();
    
    switch (range) {
      case '7days':
        setStartDate(format(subDays(today, 7), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case '30days':
        setStartDate(format(subDays(today, 30), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'month':
        setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
    }
  };

  const getTotalConsumption = () => {
    return consumptionData.reduce((sum, item) => sum + item.total_consumed, 0);
  };

  const getTotalCost = () => {
    return consumptionData.reduce((sum, item) => sum + item.total_cost, 0);
  };

  const getInventoryValue = () => {
    return ingredients.reduce((sum, ing) => sum + (ing.quantity * ing.cost_per_unit), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Reports</h1>
        <p className="text-gray-600 mt-1">Analyze stock consumption, costs, and transactions</p>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setReportType('consumption')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              reportType === 'consumption'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Stock Consumption
          </button>
          <button
            onClick={() => setReportType('transactions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              reportType === 'transactions'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Transactions
          </button>
          <button
            onClick={() => setReportType('cost')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              reportType === 'cost'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Cost Analysis
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2">
            <button
              onClick={() => handleDateRangeChange('7days')}
              className={`px-3 py-1 rounded text-sm ${
                dateRange === '7days' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handleDateRangeChange('30days')}
              className={`px-3 py-1 rounded text-sm ${
                dateRange === '30days' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handleDateRangeChange('month')}
              className={`px-3 py-1 rounded text-sm ${
                dateRange === 'month' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              This Month
            </button>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Consumption Report */}
          {reportType === 'consumption' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Consumed</p>
                      <p className="text-2xl font-bold text-gray-900">{getTotalConsumption().toFixed(2)}</p>
                    </div>
                    <TrendingDown className="w-10 h-10 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="text-2xl font-bold text-gray-900">₹{getTotalCost().toFixed(2)}</p>
                    </div>
                    <DollarSign className="w-10 h-10 text-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Items Used</p>
                      <p className="text-2xl font-bold text-gray-900">{consumptionData.length}</p>
                    </div>
                    <Package className="w-10 h-10 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Consumption Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Stock Consumption Details</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Ingredient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Unit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total Consumed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Transactions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {consumptionData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.ingredient_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.total_consumed.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{item.total_cost.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.transaction_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Report */}
          {reportType === 'transactions' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Inventory Transactions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Ingredient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transaction.ingredient?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.type === 'stock_in' ? 'bg-green-100 text-green-800' :
                            transaction.type === 'stock_out' ? 'bg-red-100 text-red-800' :
                            transaction.type === 'adjustment' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.quantity} {transaction.ingredient?.unit || ''}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {transaction.reason || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.cost ? `₹${transaction.cost.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cost Analysis Report */}
          {reportType === 'cost' && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Inventory Value</p>
                    <p className="text-3xl font-bold text-gray-900">₹{getInventoryValue().toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-green-500" />
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Inventory Cost Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Ingredient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Current Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cost per Unit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Supplier
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ingredients.map((ingredient) => (
                        <tr key={ingredient.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {ingredient.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {ingredient.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ingredient.quantity} {ingredient.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{ingredient.cost_per_unit.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ₹{(ingredient.quantity * ingredient.cost_per_unit).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {ingredient.supplier || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
