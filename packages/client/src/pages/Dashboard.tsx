import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import type { Reservation, Loan } from '@ting/shared';

export function Dashboard() {
  const { t } = useTranslation();
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
    if (!confirm(t('dashboard.confirmCancel'))) return;

    try {
      await apiClient.cancelReservation(id);
      await loadData();
    } catch (error: any) {
      alert(error.message || t('errors.cancelFailed'));
    }
  };

  const handleReturnItem = async (loanId: string) => {
    if (!confirm(t('dashboard.confirmReturn'))) return;

    try {
      await apiClient.checkin(loanId);
      await loadData();
    } catch (error: any) {
      alert(error.message || t('errors.returnFailed'));
    }
  };

  if (loading) {
    return <div className="text-center py-12">{t('dashboard.loading')}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">{t('dashboard.title')}</h1>

      <div className="lg:grid lg:grid-cols-2 lg:gap-8">

      {/* Current Loans */}
      <div className="mb-8 lg:mb-0">
        <h2 className="text-2xl font-bold mb-4">{t('dashboard.loans.title')}</h2>
        {loans.length === 0 ? (
          <p className="text-gray-500">{t('dashboard.loans.noLoans')}</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('dashboard.loans.item')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('dashboard.loans.checkedOut')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('dashboard.loans.dueDate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('dashboard.loans.actions')}</th>
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
                        <div className="text-sm text-gray-500">
                          {loan.item?.category?.name ? t(`categories.${loan.item.category.name}`, loan.item.category.name) : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(loan.checkedOutAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={isOverdue ? 'text-red-600 font-bold' : 'text-gray-900'}>
                          {dueDate.toLocaleDateString()}
                          {isOverdue && ` (${t('dashboard.loans.overdue')})`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleReturnItem(loan.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {t('dashboard.loans.return')}
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
      </div>

      {/* Reservations */}
      <div className="min-w-0">
        <h2 className="text-2xl font-bold mb-4">{t('dashboard.reservations.title')}</h2>
        {reservations.length === 0 ? (
          <p className="text-gray-500">{t('dashboard.reservations.noReservations')}</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('dashboard.reservations.item')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('dashboard.reservations.startDate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('dashboard.reservations.endDate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('dashboard.reservations.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('dashboard.reservations.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reservations.map(reservation => (
                  <tr key={reservation.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium">{reservation.item?.name}</div>
                      <div className="text-sm text-gray-500">
                        {reservation.item?.category?.name ? t(`categories.${reservation.item.category.name}`, reservation.item.category.name) : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(reservation.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(reservation.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        {t(`dashboard.reservations.statusValues.${reservation.status.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {reservation.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleCancelReservation(reservation.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          {t('dashboard.reservations.cancel')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      </div>
    </div>
  );
}
