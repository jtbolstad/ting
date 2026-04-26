import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiClient } from "../api/client";
import { useToast } from "../components/ui/Toast";
import { useConfirm } from "../components/ui/ConfirmModal";
import { Spinner } from "../components/ui/Spinner";
import type { Reservation, Loan, Item } from "@ting/shared";

export function Dashboard() {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanHistory, setLoanHistory] = useState<Loan[]>([]);
  const [pendingItems, setPendingItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reservationsData, loansData, allLoansData, pendingData] =
        await Promise.all([
          apiClient.getReservations(),
          apiClient.getLoans({ active: true }),
          apiClient.getLoans(),
          apiClient.getMyPendingItems(),
        ]);
      setReservations(reservationsData.filter((r) => r.status !== "CANCELLED"));
      setLoans(loansData);
      setLoanHistory(allLoansData.filter((l) => l.returnedAt !== null));
      setPendingItems(pendingData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    if (!(await confirm(t("dashboard.confirmCancel")))) return;

    try {
      await apiClient.cancelReservation(id);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || t("errors.cancelFailed"));
    }
  };

  const handleReturnItem = async (loanId: string) => {
    if (!(await confirm(t("dashboard.confirmReturn")))) return;

    try {
      await apiClient.checkin(loanId);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || t("errors.returnFailed"));
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">{t("dashboard.title")}</h1>

      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        {/* Current Loans */}
        <div className="mb-8 lg:mb-0">
          <h2 className="text-2xl font-bold mb-4">
            {t("dashboard.loans.title")}
          </h2>
          {loans.length === 0 ? (
            <p className="text-gray-500">{t("dashboard.loans.noLoans")}</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("dashboard.loans.item")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("dashboard.loans.checkedOut")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("dashboard.loans.dueDate")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("dashboard.loans.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loans.map((loan) => {
                      const dueDate = new Date(loan.dueDate);
                      const isOverdue = dueDate < new Date();

                      return (
                        <tr key={loan.id}>
                          <td className="px-6 py-4">
                            <div className="font-medium">{loan.item?.name}</div>
                            <div className="text-sm text-gray-500">
                              {loan.item?.category?.name
                                ? t(
                                    `categories.${loan.item.category.name}`,
                                    loan.item.category.name,
                                  )
                                : ""}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(loan.checkedOutAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={
                                isOverdue
                                  ? "text-red-600 font-bold"
                                  : "text-gray-900"
                              }
                            >
                              {dueDate.toLocaleDateString()}
                              {isOverdue &&
                                ` (${t("dashboard.loans.overdue")})`}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleReturnItem(loan.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              {t("dashboard.loans.return")}
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
          <h2 className="text-2xl font-bold mb-4">
            {t("dashboard.reservations.title")}
          </h2>
          {reservations.length === 0 ? (
            <p className="text-gray-500">
              {t("dashboard.reservations.noReservations")}
            </p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("dashboard.reservations.item")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("dashboard.reservations.startDate")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("dashboard.reservations.endDate")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("dashboard.reservations.status")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("dashboard.reservations.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td className="px-6 py-4">
                          <div className="font-medium">
                            {reservation.item?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {reservation.item?.category?.name
                              ? t(
                                  `categories.${reservation.item.category.name}`,
                                  reservation.item.category.name,
                                )
                              : ""}
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
                            {t(
                              `dashboard.reservations.statusValues.${reservation.status.toLowerCase()}`,
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {reservation.status !== "COMPLETED" && (
                            <button
                              onClick={() =>
                                handleCancelReservation(reservation.id)
                              }
                              className="text-red-600 hover:text-red-900"
                            >
                              {t("dashboard.reservations.cancel")}
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

      {/* Pending / Rejected Items */}
      {pendingItems.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">
            {t("dashboard.pendingItems.title")}
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("dashboard.pendingItems.item")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("dashboard.pendingItems.submitted")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("dashboard.pendingItems.status")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("dashboard.pendingItems.note")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {item.approvalStatus === "PENDING" ? (
                          <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                            {t("dashboard.pendingItems.statusPending")}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
                            {t("dashboard.pendingItems.statusRejected")}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.rejectionNote ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Loan History */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">
          {t("dashboard.history.title")}
        </h2>
        {loanHistory.length === 0 ? (
          <p className="text-gray-500">{t("dashboard.history.noHistory")}</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("dashboard.loans.item")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("dashboard.loans.checkedOut")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("dashboard.history.returned")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("dashboard.history.damage")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loanHistory.map((loan) => (
                    <tr key={loan.id}>
                      <td className="px-6 py-4">
                        <div className="font-medium">{loan.item?.name}</div>
                        <div className="text-sm text-gray-500">
                          {loan.item?.category?.name
                            ? t(
                                `categories.${loan.item.category.name}`,
                                loan.item.category.name,
                              )
                            : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(loan.checkedOutAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {loan.returnedAt
                          ? new Date(loan.returnedAt).toLocaleDateString()
                          : ""}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {loan.damageNote ? (
                          <span className="text-orange-700">
                            {loan.damageNote}
                          </span>
                        ) : (
                          "—"
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
  );
}
