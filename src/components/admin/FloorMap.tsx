import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Users, Clock, ShoppingBag } from 'lucide-react';

type TableStatus = 'available' | 'occupied' | 'ordering';

interface Table {
  id: string;
  table_no: number;
  seats: number;
  status: TableStatus;
  current_order_id?: string;
}

export default function FloorMap() {
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNo, setNewTableNo] = useState('');
  const [newTableSeats, setNewTableSeats] = useState('4');

  // Fetch tables
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tables')
        .select('*')
        .order('table_no');
      return (data || []) as Table[];
    },
  });

  // Add table mutation
  const addTableMutation = useMutation({
    mutationFn: async (table: { table_no: number; seats: number }) => {
      const { data, error } = await supabase.from('tables').insert([table]).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setShowAddModal(false);
      setNewTableNo('');
      setNewTableSeats('4');
    },
  });

  // Update table status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TableStatus }) => {
      const { error } = await supabase.from('tables').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500 hover:bg-emerald-600';
      case 'occupied':
        return 'bg-red-500 hover:bg-red-600';
      case 'ordering':
        return 'bg-amber-500 hover:bg-amber-600';
    }
  };

  const getStatusLabel = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'ordering':
        return 'Ordering';
    }
  };

  const handleAddTable = () => {
    if (newTableNo && newTableSeats) {
      addTableMutation.mutate({
        table_no: parseInt(newTableNo),
        seats: parseInt(newTableSeats),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading floor map...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Floor Map</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage tables and monitor status
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Table
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Ordering</span>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {tables.map((table) => (
          <motion.button
            key={table.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedTable(table)}
            className={`${getStatusColor(
              table.status
            )} text-white rounded-xl p-6 aspect-square flex flex-col items-center justify-center gap-2 transition-colors shadow-lg`}
          >
            <span className="text-3xl font-bold">T{table.table_no}</span>
            <div className="flex items-center gap-1 text-sm">
              <Users className="w-4 h-4" />
              <span>{table.seats}</span>
            </div>
            <span className="text-xs font-medium">{getStatusLabel(table.status)}</span>
          </motion.button>
        ))}
      </div>

      {/* Table Details Modal */}
      <AnimatePresence>
        {selectedTable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTable(null)}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Table {selectedTable.table_no}
                </h2>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Seats</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedTable.seats}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Status</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedTable.status === 'available'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : selectedTable.status === 'occupied'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}
                  >
                    {getStatusLabel(selectedTable.status)}
                  </span>
                </div>

                {selectedTable.current_order_id && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">Order ID</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      #{selectedTable.current_order_id.slice(-6)}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    updateStatusMutation.mutate({
                      id: selectedTable.id,
                      status: 'available',
                    });
                    setSelectedTable(null);
                  }}
                  className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Available
                </button>
                <button
                  onClick={() => {
                    updateStatusMutation.mutate({
                      id: selectedTable.id,
                      status: 'occupied',
                    });
                    setSelectedTable(null);
                  }}
                  className="py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Occupied
                </button>
                <button
                  onClick={() => {
                    updateStatusMutation.mutate({
                      id: selectedTable.id,
                      status: 'ordering',
                    });
                    setSelectedTable(null);
                  }}
                  className="py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Ordering
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Table Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Add New Table
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Table Number
                  </label>
                  <input
                    type="number"
                    value={newTableNo}
                    onChange={(e) => setNewTableNo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Seats
                  </label>
                  <input
                    type="number"
                    value={newTableSeats}
                    onChange={(e) => setNewTableSeats(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 4"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTable}
                  disabled={addTableMutation.isPending}
                  className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {addTableMutation.isPending ? 'Adding...' : 'Add Table'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
