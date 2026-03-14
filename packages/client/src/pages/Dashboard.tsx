import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { Reservation, Loan } from '@ting/shared';

export function Dashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reservationsData, loansData] = await Promise.all([
        apiClient.getReservations(),
        apiClient.getLoans({ active: true }),
      ]);
      setReservations(reservationsData.filter(r => r.status !== 'CANCELLED'));
      setLoans(loansData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    try {
      await apiClient.cancelReservation(id);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to cancel reservation');
    }
  };

  const handleReturnItem = async (loanId: string) => {
    if (!confirm('Confirm item return?')) return;

    try {
      await apiClient.checkin(loanId);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to return item');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">My Dashboard</h1>

      {/* Current Loans */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Current Loans</h2>
        {loans.length === 0 ? (
          <p className="text-gray-500">No active loans</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Checked Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loans.map(loan => {
                  const dueDate = new Date(loan.dueDate);
                  const isOverdue = dueDate < new Date();

                  return (
                    <tr key={loan.id}>
                      <td className="px-6 py-4">
                        <div className="font-medium">{loan.item?.name}</div>
                        <div className="text-sm text-gray-500">{loan.item?.category?.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(loan.checkedOutAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={isOverdue ? 'text-red-600 font-bold' : 'text-gray-900'}>
                          {dueDate.toLocaleDateString()}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleReturnItem(loan.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Return
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reservations */}
      <div>
        <h2 className="text-2xl font-bold mb-4">My Reservations</h2>
        {reservations.length === 0 ? (
          <p className="text-gray-500">No active reservations</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reservations.map(reservation => (
                  <tr key={reservation.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium">{reservation.item?.name}</div>
                      <div className="text-sm text-gray-500">{reservation.item?.category?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(reservation.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(reservation.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        {reservation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {reservation.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleCancelReservation(reservation.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
