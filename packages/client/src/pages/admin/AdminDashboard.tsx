import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import type { Item, Category, Loan, User } from '@ting/shared';

export function AdminDashboard() {
  const { t } = useTranslation();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [overdueLoans, setOverdueLoans] = useState<Loan[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'loans' | 'items' | 'users'>('loans');

  // Checkout modal state
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Add item modal state
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '', categoryId: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loansData, itemsData, categoriesData, usersData] = await Promise.all([
        apiClient.getLoans(),
        apiClient.getItems({ limit: 100 }),
        apiClient.getCategories(),
        apiClient.getUsers(),
      ]);
      setLoans(loansData.filter(l => !l.returnedAt));
      setOverdueLoans(loansData.filter(l => !l.returnedAt && new Date(l.dueDate) < new Date()));
      setItems(itemsData.items);
      setCategories(categoriesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.checkout({
        itemId: selectedItemId,
        userId: selectedUserId,
        dueDate,
      });
      setShowCheckout(false);
      setSelectedItemId('');
      setSelectedUserId('');
      setDueDate('');
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to checkout item');
    }
  };

  const handleCheckin = async (loanId: string) => {
    if (!confirm('Confirm item checkin?')) return;
    try {
      await apiClient.checkin(loanId);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to checkin item');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createItem(newItem);
      setShowAddItem(false);
      setNewItem({ name: '', description: '', categoryId: '' });
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to create item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await apiClient.deleteItem(id);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete item');
    }
  };

  if (loading) {
    return <div className="text-center py-12">{t('admin.loading')}</div>;
  }

  const availableItems = items.filter(i => i.status === 'AVAILABLE');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">{t('admin.title')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-indigo-600">{items.length}</div>
          <div className="text-gray-600">{t('admin.stats.totalItems')}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-green-600">{availableItems.length}</div>
          <div className="text-gray-600">{t('admin.stats.available')}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-blue-600">{loans.length}</div>
          <div className="text-gray-600">{t('admin.stats.activeLoans')}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-red-600">{overdueLoans.length}</div>
          <div className="text-gray-600">{t('admin.stats.overdue')}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('loans')}
            className={`pb-4 px-1 ${
              activeTab === 'loans'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium'
                : 'text-gray-500'
            }`}
          >
            {t('admin.tabs.loans')}
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`pb-4 px-1 ${
              activeTab === 'items'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium'
                : 'text-gray-500'
            }`}
          >
            {t('admin.tabs.items')}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-1 ${
              activeTab === 'users'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium'
                : 'text-gray-500'
            }`}
          >
            {t('admin.tabs.users')}
          </button>
        </div>
      </div>

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Active Loans</h2>
            <button
              onClick={() => setShowCheckout(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Checkout Item
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Checked Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loans.map(loan => {
                  const isOverdue = new Date(loan.dueDate) < new Date();
                  return (
                    <tr key={loan.id} className={isOverdue ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4">
                        <div className="font-medium">{loan.item?.name}</div>
                      </td>
                      <td className="px-6 py-4">{loan.user?.name}</td>
                      <td className="px-6 py-4 text-sm">{new Date(loan.checkedOutAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
                          {new Date(loan.dueDate).toLocaleDateString()}
                          {isOverdue && ' (OVERDUE)'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleCheckin(loan.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Checkin
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Items</h2>
            <button
              onClick={() => setShowAddItem(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Add Item
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4">{item.category?.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${
                        item.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Users</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 font-medium">{user.name}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Checkout Item</h3>
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Item</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select an item</option>
                  {availableItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Checkout
                </button>
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Add New Item</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={newItem.categoryId}
                  onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Add Item
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddItem(false)}
                  className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
