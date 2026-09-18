import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Plus, Edit, Trash2, Search, Filter, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { getIngredients, createIngredient, updateIngredient, deleteIngredient, stockIn, adjustInventory, getLowStockIngredients, getInventorySummary, getAlerts, markAlertAsRead, type Ingredient, type InventoryAlert, type InventorySummary } from '../../services/inventoryService';
import { useToast } from '../../contexts/ToastContext';

interface InventoryProps {
  cafeId: string;
}

export default function Inventory({ cafeId }: InventoryProps) {
  const toast = useToast();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [lowStock, setLowStock] = useState<Ingredient[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    unit: 'kg' as const,
    quantity: 0,
    min_quantity: 0,
    cost_per_unit: 0,
    supplier: '',
  });

  useEffect(() => {
    loadInventory();
  }, [cafeId]);

  const loadInventory = async () => {
    setLoading(true);
    
    const [ingredientsRes, lowStockRes, summaryRes, alertsRes] = await Promise.all([
      getIngredients(cafeId),
      getLowStockIngredients(cafeId),
      getInventorySummary(cafeId),
      getAlerts(cafeId, true),
    ]);

    if (ingredientsRes.data) setIngredients(ingredientsRes.data);
    if (lowStockRes.data) setLowStock(lowStockRes.data);
    if (summaryRes.data) setSummary(summaryRes.data);
    if (alertsRes.data) setAlerts(alertsRes.data);

    setLoading(false);
  };

  const handleAddIngredient = async () => {
    const { error } = await createIngredient({
      ...formData,
      cafe_id: cafeId,
      is_active: true,
      last_restocked: null,
    });

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('Ingredient added successfully');
    setShowAddModal(false);
    resetForm();
    loadInventory();
  };

  const handleStockIn = async (quantity: number, reason: string, cost?: number) => {
    if (!selectedIngredient) return;

    const { error } = await stockIn(
      selectedIngredient.id,
      quantity,
      reason,
      'current-user', // TODO: Get from auth context
      cost
    );

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('Stock updated successfully');
    setShowStockInModal(false);
    setSelectedIngredient(null);
    loadInventory();
  };

  const handleAdjust = async (newQuantity: number, reason: string) => {
    if (!selectedIngredient) return;

    const { error } = await adjustInventory(
      selectedIngredient.id,
      newQuantity,
      reason,
      'current-user' // TODO: Get from auth context
    );

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('Inventory adjusted successfully');
    setShowAdjustModal(false);
    setSelectedIngredient(null);
    loadInventory();
  };

  const handleDelete = async (ingredientId: string) => {
    if (!confirm('Are you sure you want to delete this ingredient?')) return;

    const { error } = await deleteIngredient(ingredientId);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('Ingredient deleted successfully');
    loadInventory();
  };

  const handleMarkAlertRead = async (alertId: string) => {
    const { error } = await markAlertAsRead(alertId);

    if (error) {
      toast.error(error);
      return;
    }

    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'general',
      unit: 'kg',
      quantity: 0,
      min_quantity: 0,
      cost_per_unit: 0,
      supplier: '',
    });
  };

  const getStockStatus = (ingredient: Ingredient) => {
    if (ingredient.quantity <= 0) return 'out';
    if (ingredient.quantity <= ingredient.min_quantity) return 'low';
    return 'ok';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out': return 'bg-red-100 text-red-800 border-red-200';
      case 'low': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'out': return 'Out of Stock';
      case 'low': return 'Low Stock';
      default: return 'In Stock';
    }
  };

  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ing.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || ing.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(ingredients.map(ing => ing.category)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track and manage your cafe ingredients</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Ingredient
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Ingredients</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_ingredients}</p>
              </div>
              <Package className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-amber-600">{summary.low_stock_count}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{summary.out_of_stock_count}</p>
              </div>
              <TrendingDown className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">₹{summary.total_value.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>
      )}

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-2">
                {alerts.length} Unread Alert{alerts.length !== 1 ? 's' : ''}
              </h3>
              <div className="space-y-2">
                {alerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className="flex items-center justify-between bg-white rounded p-2">
                    <span className="text-sm text-amber-800">{alert.message}</span>
                    <button
                      onClick={() => handleMarkAlertRead(alert.id)}
                      className="text-xs text-amber-600 hover:text-amber-800"
                    >
                      Mark as read
                    </button>
                  </div>
                ))}
                {alerts.length > 3 && (
                  <p className="text-sm text-amber-700">
                    And {alerts.length - 3} more alert{alerts.length - 3 !== 1 ? 's' : ''}...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Items */}
      {lowStock.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Low Stock Items
          </h2>
          <div className="space-y-2">
            {lowStock.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {item.quantity} {item.unit} remaining (min: {item.min_quantity} {item.unit})
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedIngredient(item);
                    setShowStockInModal(true);
                  }}
                  className="px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ingredients List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingredient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost/Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIngredients.map(ingredient => {
                const status = getStockStatus(ingredient);
                return (
                  <tr key={ingredient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ingredient.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{ingredient.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ingredient.quantity} {ingredient.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {ingredient.min_quantity} {ingredient.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{ingredient.cost_per_unit.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{ingredient.supplier || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(status)}`}>
                        {getStatusLabel(status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedIngredient(ingredient);
                            setShowStockInModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Stock In"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedIngredient(ingredient);
                            setShowAdjustModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Adjust"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ingredient.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Ingredient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Add New Ingredient</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="l">Liters (l)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="boxes">Boxes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Quantity</label>
                <input
                  type="number"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({ ...formData, min_quantity: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit (₹)</label>
                <input
                  type="number"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddIngredient}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Add Ingredient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock In Modal */}
      {showStockInModal && selectedIngredient && (
        <StockInModal
          ingredient={selectedIngredient}
          onClose={() => {
            setShowStockInModal(false);
            setSelectedIngredient(null);
          }}
          onSubmit={handleStockIn}
        />
      )}

      {/* Adjust Modal */}
      {showAdjustModal && selectedIngredient && (
        <AdjustModal
          ingredient={selectedIngredient}
          onClose={() => {
            setShowAdjustModal(false);
            setSelectedIngredient(null);
          }}
          onSubmit={handleAdjust}
        />
      )}
    </div>
  );
}

// Stock In Modal Component
function StockInModal({
  ingredient,
  onClose,
  onSubmit,
}: {
  ingredient: Ingredient;
  onClose: () => void;
  onSubmit: (quantity: number, reason: string, cost?: number) => void;
}) {
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState('Restock');
  const [cost, setCost] = useState(0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Stock In: {ingredient.name}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Stock: {ingredient.quantity} {ingredient.unit}
            </label>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add ({ingredient.unit})</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (₹)</label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              step="0.01"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(quantity, reason, cost)}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Add Stock
          </button>
        </div>
      </div>
    </div>
  );
}

// Adjust Modal Component
function AdjustModal({
  ingredient,
  onClose,
  onSubmit,
}: {
  ingredient: Ingredient;
  onClose: () => void;
  onSubmit: (newQuantity: number, reason: string) => void;
}) {
  const [newQuantity, setNewQuantity] = useState(ingredient.quantity);
  const [reason, setReason] = useState('Inventory adjustment');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Adjust Inventory: {ingredient.name}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Stock: {ingredient.quantity} {ingredient.unit}
            </label>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Quantity ({ingredient.unit})</label>
            <input
              type="number"
              value={newQuantity}
              onChange={(e) => setNewQuantity(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={3}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(newQuantity, reason)}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Adjust
          </button>
        </div>
      </div>
    </div>
  );
}
