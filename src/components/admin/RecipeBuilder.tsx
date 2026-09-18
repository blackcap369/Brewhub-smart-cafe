import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Calculator } from 'lucide-react';
import { getIngredients, getRecipe, setRecipe, calculateMenuItemCost, type Ingredient, type RecipeIngredient } from '../../services/inventoryService';
import { useToast } from '../../contexts/ToastContext';

interface RecipeBuilderProps {
  menuItemId: string;
  cafeId: string;
  isOpen: boolean;
  onClose: () => void;
  menuItemName: string;
  menuItemPrice: number;
}

interface RecipeItem {
  ingredient_id: string;
  ingredient: Ingredient;
  quantity_required: number;
}

export default function RecipeBuilder({
  menuItemId,
  cafeId,
  isOpen,
  onClose,
  menuItemName,
  menuItemPrice,
}: RecipeBuilderProps) {
  const toast = useToast();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipe, setRecipe] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itemCost, setItemCost] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, menuItemId]);

  const loadData = async () => {
    setLoading(true);

    const [ingredientsRes, recipeRes, costRes] = await Promise.all([
      getIngredients(cafeId),
      getRecipe(menuItemId),
      calculateMenuItemCost(menuItemId),
    ]);

    if (ingredientsRes.data) {
      setIngredients(ingredientsRes.data);
    }

    if (recipeRes.data) {
      setRecipe(
        recipeRes.data.map((ri) => ({
          ingredient_id: ri.ingredient_id,
          ingredient: ri.ingredient!,
          quantity_required: ri.quantity_required,
        }))
      );
    }

    if (costRes.data) {
      setItemCost(costRes.data);
    }

    setLoading(false);
  };

  const handleAddIngredient = (ingredient: Ingredient) => {
    if (recipe.find((r) => r.ingredient_id === ingredient.id)) {
      toast.error('Ingredient already in recipe');
      return;
    }

    setRecipe([
      ...recipe,
      {
        ingredient_id: ingredient.id,
        ingredient,
        quantity_required: 0,
      },
    ]);
  };

  const handleUpdateQuantity = (ingredientId: string, quantity: number) => {
    setRecipe(
      recipe.map((r) =>
        r.ingredient_id === ingredientId
          ? { ...r, quantity_required: quantity }
          : r
      )
    );
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    setRecipe(recipe.filter((r) => r.ingredient_id !== ingredientId));
  };

  const calculateTotalCost = () => {
    return recipe.reduce((total, item) => {
      return total + item.quantity_required * item.ingredient.cost_per_unit;
    }, 0);
  };

  const handleSave = async () => {
    if (recipe.some((r) => r.quantity_required <= 0)) {
      toast.error('All ingredients must have quantity greater than 0');
      return;
    }

    setSaving(true);

    const result = await setRecipe(
      menuItemId,
      recipe.map((r) => ({
        ingredient_id: r.ingredient_id,
        quantity_required: r.quantity_required,
      }))
    );

    if (result.error) {
      toast.error(result.error);
      setSaving(false);
      return;
    }

    toast.success('Recipe saved successfully');
    
    // Recalculate cost
    const costRes = await calculateMenuItemCost(menuItemId);
    if (costRes.data) {
      setItemCost(costRes.data);
    }

    setSaving(false);
    onClose();
  };

  const availableIngredients = ingredients.filter(
    (ing) => !recipe.find((r) => r.ingredient_id === ing.id)
  );

  const profitMargin = menuItemPrice > 0 ? ((menuItemPrice - calculateTotalCost()) / menuItemPrice) * 100 : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Recipe Builder</h2>
            <p className="text-sm text-gray-600 mt-1">{menuItemName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Ingredients */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Ingredients</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableIngredients.map((ingredient) => (
                      <div
                        key={ingredient.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{ingredient.name}</p>
                          <p className="text-sm text-gray-600">
                            {ingredient.quantity} {ingredient.unit} in stock
                          </p>
                          <p className="text-xs text-gray-500">
                            ₹{ingredient.cost_per_unit.toFixed(2)} per {ingredient.unit}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddIngredient(ingredient)}
                          className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                    {availableIngredients.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No more ingredients available
                      </p>
                    )}
                  </div>
                </div>

                {/* Recipe */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipe</h3>
                  <div className="space-y-3">
                    {recipe.map((item) => (
                      <div
                        key={item.ingredient_id}
                        className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{item.ingredient.name}</p>
                            <p className="text-xs text-gray-600">
                              ₹{item.ingredient.cost_per_unit.toFixed(2)} per {item.ingredient.unit}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveIngredient(item.ingredient_id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-700">Quantity:</label>
                          <input
                            type="number"
                            value={item.quantity_required}
                            onChange={(e) =>
                              handleUpdateQuantity(item.ingredient_id, parseFloat(e.target.value))
                            }
                            className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                            step="0.01"
                            min="0"
                          />
                          <span className="text-sm text-gray-600">{item.ingredient.unit}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Cost: ₹{(item.quantity_required * item.ingredient.cost_per_unit).toFixed(2)}
                        </p>
                      </div>
                    ))}
                    {recipe.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No ingredients added yet
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cost Summary */}
              {recipe.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Cost Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Ingredient Cost:</span>
                      <span className="font-medium text-gray-900">
                        ₹{calculateTotalCost().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Menu Price:</span>
                      <span className="font-medium text-gray-900">
                        ₹{menuItemPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
                      <span className="text-gray-600">Profit Margin:</span>
                      <span className={`font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitMargin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Profit per Item:</span>
                      <span className={`font-semibold ${menuItemPrice - calculateTotalCost() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{(menuItemPrice - calculateTotalCost()).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || recipe.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Recipe'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
