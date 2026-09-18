import { supabase } from './supabase';

export interface Ingredient {
  id: string;
  cafe_id: string;
  name: string;
  category: string;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'boxes';
  quantity: number;
  min_quantity: number;
  cost_per_unit: number;
  supplier: string | null;
  last_restocked: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  quantity_required: number;
  ingredient?: Ingredient;
}

export interface InventoryTransaction {
  id: string;
  cafe_id: string;
  ingredient_id: string;
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'waste';
  quantity: number;
  reason: string | null;
  order_id: string | null;
  performed_by: string | null;
  cost: number | null;
  created_at: string;
  ingredient?: Ingredient;
}

export interface InventoryAlert {
  id: string;
  cafe_id: string;
  ingredient_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'expiry';
  message: string;
  is_read: boolean;
  sent_at: string;
  read_at: string | null;
  ingredient?: Ingredient;
}

export interface InventorySummary {
  total_ingredients: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_value: number;
  unread_alerts: number;
}

// Get all ingredients for a cafe
export async function getIngredients(cafeId: string): Promise<{ data: Ingredient[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('cafe_id', cafeId)
    .eq('is_active', true)
    .order('name');

  return { data, error: error?.message || null };
}

// Get single ingredient
export async function getIngredient(ingredientId: string): Promise<{ data: Ingredient | null; error: string | null }> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('id', ingredientId)
    .single();

  return { data, error: error?.message || null };
}

// Create new ingredient
export async function createIngredient(ingredient: Omit<Ingredient, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Ingredient | null; error: string | null }> {
  const { data, error } = await supabase
    .from('ingredients')
    .insert([ingredient])
    .select()
    .single();

  return { data, error: error?.message || null };
}

// Update ingredient
export async function updateIngredient(ingredientId: string, updates: Partial<Ingredient>): Promise<{ data: Ingredient | null; error: string | null }> {
  const { data, error } = await supabase
    .from('ingredients')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', ingredientId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

// Delete ingredient (soft delete)
export async function deleteIngredient(ingredientId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('ingredients')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', ingredientId);

  return { error: error?.message || null };
}

// Stock in - add inventory
export async function stockIn(
  ingredientId: string,
  quantity: number,
  reason: string,
  performedBy: string,
  cost?: number
): Promise<{ error: string | null }> {
  const { data: ingredient, error: fetchError } = await getIngredient(ingredientId);
  
  if (fetchError || !ingredient) {
    return { error: fetchError || 'Ingredient not found' };
  }

  // Update ingredient quantity
  const { error: updateError } = await updateIngredient(ingredientId, {
    quantity: ingredient.quantity + quantity,
    last_restocked: new Date().toISOString(),
  });

  if (updateError) {
    return { error: updateError };
  }

  // Create transaction record
  const { error: transactionError } = await supabase
    .from('inventory_transactions')
    .insert([{
      cafe_id: ingredient.cafe_id,
      ingredient_id: ingredientId,
      type: 'stock_in',
      quantity,
      reason,
      performed_by: performedBy,
      cost: cost || quantity * ingredient.cost_per_unit,
    }]);

  return { error: transactionError?.message || null };
}

// Stock out - remove inventory
export async function stockOut(
  ingredientId: string,
  quantity: number,
  reason: string,
  performedBy: string,
  orderId?: string
): Promise<{ error: string | null }> {
  const { data: ingredient, error: fetchError } = await getIngredient(ingredientId);
  
  if (fetchError || !ingredient) {
    return { error: fetchError || 'Ingredient not found' };
  }

  if (ingredient.quantity < quantity) {
    return { error: 'Insufficient stock' };
  }

  // Update ingredient quantity
  const { error: updateError } = await updateIngredient(ingredientId, {
    quantity: ingredient.quantity - quantity,
  });

  if (updateError) {
    return { error: updateError };
  }

  // Create transaction record
  const { error: transactionError } = await supabase
    .from('inventory_transactions')
    .insert([{
      cafe_id: ingredient.cafe_id,
      ingredient_id: ingredientId,
      type: 'stock_out',
      quantity,
      reason,
      order_id: orderId || null,
      performed_by: performedBy,
      cost: quantity * ingredient.cost_per_unit,
    }]);

  // Check for low stock alert
  if (ingredient.quantity - quantity <= ingredient.min_quantity) {
    await createAlert(
      ingredient.cafe_id,
      ingredientId,
      'low_stock',
      `Low stock alert: ${ingredient.name} is running low (${ingredient.quantity - quantity} ${ingredient.unit} remaining)`
    );
  }

  // Check for out of stock
  if (ingredient.quantity - quantity <= 0) {
    await createAlert(
      ingredient.cafe_id,
      ingredientId,
      'out_of_stock',
      `Out of stock: ${ingredient.name} is now out of stock`
    );
  }

  return { error: transactionError?.message || null };
}

// Adjust inventory
export async function adjustInventory(
  ingredientId: string,
  newQuantity: number,
  reason: string,
  performedBy: string
): Promise<{ error: string | null }> {
  const { data: ingredient, error: fetchError } = await getIngredient(ingredientId);
  
  if (fetchError || !ingredient) {
    return { error: fetchError || 'Ingredient not found' };
  }

  const adjustment = newQuantity - ingredient.quantity;

  // Update ingredient quantity
  const { error: updateError } = await updateIngredient(ingredientId, {
    quantity: newQuantity,
  });

  if (updateError) {
    return { error: updateError };
  }

  // Create transaction record
  const { error: transactionError } = await supabase
    .from('inventory_transactions')
    .insert([{
      cafe_id: ingredient.cafe_id,
      ingredient_id: ingredientId,
      type: 'adjustment',
      quantity: Math.abs(adjustment),
      reason,
      performed_by: performedBy,
    }]);

  return { error: transactionError?.message || null };
}

// Get recipe for a menu item
export async function getRecipe(menuItemId: string): Promise<{ data: RecipeIngredient[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('recipe_ingredients')
    .select(`
      *,
      ingredient:ingredients(*)
    `)
    .eq('menu_item_id', menuItemId);

  return { data, error: error?.message || null };
}

// Set recipe for a menu item
export async function setRecipe(
  menuItemId: string,
  ingredients: Array<{ ingredient_id: string; quantity_required: number }>
): Promise<{ error: string | null }> {
  // Delete existing recipe
  const { error: deleteError } = await supabase
    .from('recipe_ingredients')
    .delete()
    .eq('menu_item_id', menuItemId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  // Insert new recipe
  if (ingredients.length > 0) {
    const { error: insertError } = await supabase
      .from('recipe_ingredients')
      .insert(
        ingredients.map(ing => ({
          menu_item_id: menuItemId,
          ingredient_id: ing.ingredient_id,
          quantity_required: ing.quantity_required,
        }))
      );

    if (insertError) {
      return { error: insertError.message };
    }
  }

  return { error: null };
}

// Deduct ingredients for an order
export async function deductIngredientsForOrder(orderId: string): Promise<{ success: boolean; error: string | null }> {
  const { data, error } = await supabase
    .rpc('deduct_ingredients_for_order', { p_order_id: orderId });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: data, error: null };
}

// Get inventory transactions
export async function getTransactions(
  cafeId: string,
  filters?: {
    ingredient_id?: string;
    type?: string;
    start_date?: string;
    end_date?: string;
  }
): Promise<{ data: InventoryTransaction[] | null; error: string | null }> {
  let query = supabase
    .from('inventory_transactions')
    .select(`
      *,
      ingredient:ingredients(*)
    `)
    .eq('cafe_id', cafeId)
    .order('created_at', { ascending: false });

  if (filters?.ingredient_id) {
    query = query.eq('ingredient_id', filters.ingredient_id);
  }

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  if (filters?.start_date) {
    query = query.gte('created_at', filters.start_date);
  }

  if (filters?.end_date) {
    query = query.lte('created_at', filters.end_date);
  }

  const { data, error } = await query;

  return { data, error: error?.message || null };
}

// Get low stock ingredients
export async function getLowStockIngredients(cafeId: string): Promise<{ data: any[] | null; error: string | null }> {
  const { data, error } = await supabase
    .rpc('get_low_stock_ingredients', { p_cafe_id: cafeId });

  return { data, error: error?.message || null };
}

// Get inventory summary
export async function getInventorySummary(cafeId: string): Promise<{ data: InventorySummary | null; error: string | null }> {
  const { data, error } = await supabase
    .rpc('get_inventory_summary', { p_cafe_id: cafeId });

  return { data: data?.[0] || null, error: error?.message || null };
}

// Get stock consumption report
export async function getStockConsumptionReport(
  cafeId: string,
  startDate: string,
  endDate: string
): Promise<{ data: any[] | null; error: string | null }> {
  const { data, error } = await supabase
    .rpc('get_stock_consumption_report', {
      p_cafe_id: cafeId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

  return { data, error: error?.message || null };
}

// Calculate menu item cost
export async function calculateMenuItemCost(menuItemId: string): Promise<{ data: number | null; error: string | null }> {
  const { data, error } = await supabase
    .rpc('calculate_menu_item_cost', { p_menu_item_id: menuItemId });

  return { data, error: error?.message || null };
}

// Get inventory alerts
export async function getAlerts(
  cafeId: string,
  unreadOnly: boolean = false
): Promise<{ data: InventoryAlert[] | null; error: string | null }> {
  let query = supabase
    .from('inventory_alerts')
    .select(`
      *,
      ingredient:ingredients(*)
    `)
    .eq('cafe_id', cafeId)
    .order('sent_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  return { data, error: error?.message || null };
}

// Create alert
export async function createAlert(
  cafeId: string,
  ingredientId: string,
  alertType: 'low_stock' | 'out_of_stock' | 'expiry',
  message: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('inventory_alerts')
    .insert([{
      cafe_id: cafeId,
      ingredient_id: ingredientId,
      alert_type: alertType,
      message,
    }]);

  return { error: error?.message || null };
}

// Mark alert as read
export async function markAlertAsRead(alertId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('inventory_alerts')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', alertId);

  return { error: error?.message || null };
}

// Check if menu item can be prepared
export async function canPrepareMenuItem(menuItemId: string, quantity: number = 1): Promise<{ canPrepare: boolean; missingIngredients: string[] }> {
  const { data: recipe, error } = await getRecipe(menuItemId);
  
  if (error || !recipe || recipe.length === 0) {
    return { canPrepare: true, missingIngredients: [] };
  }

  const missingIngredients: string[] = [];

  for (const recipeItem of recipe) {
    const required = recipeItem.quantity_required * quantity;
    const ingredient = recipeItem.ingredient;
    
    if (!ingredient || ingredient.quantity < required) {
      missingIngredients.push(ingredient?.name || 'Unknown ingredient');
    }
  }

  return {
    canPrepare: missingIngredients.length === 0,
    missingIngredients,
  };
}

// Get menu items that will be affected by ingredient shortage
export async function getAffectedMenuItems(ingredientId: string): Promise<{ data: any[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('recipe_ingredients')
    .select(`
      menu_item:menu_items(*)
    `)
    .eq('ingredient_id', ingredientId);

  return { data: data?.map(r => r.menu_item) || null, error: error?.message || null };
}
