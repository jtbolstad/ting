import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../api/client";
import { useOrganization } from "../../context/OrganizationContext";
import { useToast } from "../../components/ui/Toast";
import { useConfirm } from "../../components/ui/ConfirmModal";
import { Spinner } from "../../components/ui/Spinner";
import type { Item, Category, Loan, Location, User } from "@ting/shared";

export function AdminDashboard() {
  const { t } = useTranslation();
  const { activeOrganizationId } = useOrganization();
  const toast = useToast();
  const confirm = useConfirm();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [overdueLoans, setOverdueLoans] = useState<Loan[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "loans" | "items" | "users" | "categories" | "locations"
  >("loans");

  // Checkout modal state
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Checkin modal state
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinLoanId, setCheckinLoanId] = useState("");
  const [checkinDamageNote, setCheckinDamageNote] = useState("");
  const [checkinCondition, setCheckinCondition] = useState("");

  // Add item modal state
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    categoryId: "",
  });

  // Category modal state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  // Location state
  const [locations, setLocations] = useState<Location[]>([]);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showEditLocation, setShowEditLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationForm, setLocationForm] = useState({ name: "", address: "", description: "" });

  // Item approval state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingItemId, setRejectingItemId] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!activeOrganizationId) return;
    try {
      const [loansData, itemsData, categoriesData, usersData, locationsData] =
        await Promise.all([
          apiClient.getLoans(),
          apiClient.getItems({ organizationId: activeOrganizationId, limit: 100 }),
          apiClient.getCategories(activeOrganizationId),
          apiClient.getUsers(),
          apiClient.getLocations(),
        ]);
      setLoans(loansData.filter((l) => !l.returnedAt));
      setOverdueLoans(
        loansData.filter(
          (l) => !l.returnedAt && new Date(l.dueDate) < new Date(),
        ),
      );
      setItems(itemsData.items);
      setCategories(categoriesData);
      setUsers(usersData.map(item => item.user));
      setLocations(locationsData);
    } catch (error) {
      console.error("Failed to load admin data:", error);
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
      setSelectedItemId("");
      setSelectedUserId("");
      setDueDate("");
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to checkout item");
    }
  };

  const openCheckin = (loanId: string) => {
    setCheckinLoanId(loanId);
    setCheckinDamageNote("");
    setCheckinCondition("");
    setShowCheckin(true);
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.checkin(checkinLoanId, {
        damageNote: checkinDamageNote || undefined,
        condition: checkinCondition || undefined,
      });
      setShowCheckin(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to checkin item");
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createItem(newItem);
      setShowAddItem(false);
      setNewItem({ name: "", description: "", categoryId: "" });
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!await confirm(t("admin.items.confirmDelete"))) return;
    try {
      await apiClient.deleteItem(id);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete item");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createCategory(categoryForm);
      setShowAddCategory(false);
      setCategoryForm({ name: "", description: "" });
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create category");
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await apiClient.updateCategory(editingCategory.id, categoryForm);
      setShowEditCategory(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "" });
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update category");
    }
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
    });
    setShowEditCategory(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!await confirm(t("admin.categories.confirmDelete"))) return;
    try {
      await apiClient.deleteCategory(id);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createLocation(locationForm);
      setShowAddLocation(false);
      setLocationForm({ name: "", address: "", description: "" });
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create location");
    }
  };

  const handleEditLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;
    try {
      await apiClient.updateLocation(editingLocation.id, locationForm);
      setShowEditLocation(false);
      setEditingLocation(null);
      setLocationForm({ name: "", address: "", description: "" });
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update location");
    }
  };

  const openEditLocation = (location: Location) => {
    setEditingLocation(location);
    setLocationForm({
      name: location.name,
      address: location.address || "",
      description: location.description || "",
    });
    setShowEditLocation(true);
  };

  const handleDeleteLocation = async (id: string) => {
    if (!await confirm(t("admin.locations.confirmDelete"))) return;
    try {
      await apiClient.deleteLocation(id);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete location");
    }
  };

  const handleApproveItem = async (id: string) => {
    if (!await confirm(t("admin.items.confirmApprove"))) return;
    try {
      await apiClient.approveItem(id);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve item");
    }
  };

  const openRejectModal = (id: string) => {
    setRejectingItemId(id);
    setRejectNote("");
    setShowRejectModal(true);
  };

  const handleRejectItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.rejectItem(rejectingItemId, rejectNote || undefined);
      setShowRejectModal(false);
      setRejectingItemId("");
      setRejectNote("");
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject item");
    }
  };

  if (loading) {
    return <Spinner />;
  }

  const availableItems = items.filter((i) => i.status === "AVAILABLE");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">{t("admin.title")}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-indigo-600">
            {items.length}
          </div>
          <div className="text-gray-600">{t("admin.stats.totalItems")}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-green-600">
            {availableItems.length}
          </div>
          <div className="text-gray-600">{t("admin.stats.available")}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-blue-600">{loans.length}</div>
          <div className="text-gray-600">{t("admin.stats.activeLoans")}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-red-600">
            {overdueLoans.length}
          </div>
          <div className="text-gray-600">{t("admin.stats.overdue")}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b overflow-x-auto">
        <div className="flex space-x-4 min-w-max">
          <button
            onClick={() => setActiveTab("loans")}
            className={`pb-4 px-1 ${
              activeTab === "loans"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                : "text-gray-500"
            }`}
          >
            {t("admin.tabs.loans")}
          </button>
          <button
            onClick={() => setActiveTab("items")}
            className={`pb-4 px-1 ${
              activeTab === "items"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                : "text-gray-500"
            }`}
          >
            {t("admin.tabs.items")}
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-4 px-1 ${
              activeTab === "users"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                : "text-gray-500"
            }`}
          >
            {t("admin.tabs.users")}
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`pb-4 px-1 ${
              activeTab === "categories"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                : "text-gray-500"
            }`}
          >
            {t("admin.tabs.categories")}
          </button>
          <button
            onClick={() => setActiveTab("locations")}
            className={`pb-4 px-1 ${
              activeTab === "locations"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                : "text-gray-500"
            }`}
          >
            {t("admin.tabs.locations")}
          </button>
        </div>
      </div>

      {/* Loans Tab */}
      {activeTab === "loans" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{t("admin.loans.title")}</h2>
            <button
              onClick={() => setShowCheckout(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              {t("admin.loans.checkoutItem")}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.loans.item")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.loans.user")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.loans.checkedOut")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.loans.dueDate")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.loans.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loans.map((loan) => {
                  const isOverdue = new Date(loan.dueDate) < new Date();
                  return (
                    <tr key={loan.id} className={isOverdue ? "bg-red-50" : ""}>
                      <td className="px-6 py-4">
                        <div className="font-medium">{loan.item?.name}</div>
                      </td>
                      <td className="px-6 py-4">{loan.user?.name}</td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(loan.checkedOutAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={isOverdue ? "text-red-600 font-bold" : ""}
                        >
                          {new Date(loan.dueDate).toLocaleDateString()}
                          {isOverdue && " (OVERDUE)"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openCheckin(loan.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {t("admin.loans.checkin")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Items Tab */}
      {activeTab === "items" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{t("admin.items.title")}</h2>
            <button
              onClick={() => setShowAddItem(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              {t("admin.items.addItem")}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.items.name")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.items.category")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.items.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.items.approvalStatus")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.items.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 font-medium">
                      <Link to={`/items/${item.slug ?? item.id}`} className="text-indigo-600 hover:underline">
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{item.category?.name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          item.status === "AVAILABLE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          item.approvalStatus === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : item.approvalStatus === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {t(`admin.items.approvalValues.${item.approvalStatus}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-3">
                      {item.approvalStatus === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApproveItem(item.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            {t("admin.items.approve")}
                          </button>
                          <button
                            onClick={() => openRejectModal(item.id)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            {t("admin.items.reject")}
                          </button>
                        </>
                      )}
                      <Link
                        to={`/items/${item.slug ?? item.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {t("admin.items.edit")}
                      </Link>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t("admin.items.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div>
          <h2 className="text-2xl font-bold mb-4">{t("admin.users.title")}</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.users.name")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.users.email")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.users.role")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.users.joined")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 font-medium">{user.name}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          user.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {t("admin.categories.title")}
            </h2>
            <button
              onClick={() => setShowAddCategory(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              {t("admin.categories.addCategory")}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.categories.name")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.categories.description")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.categories.itemCount")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.categories.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 font-medium">{category.name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {category.description || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {items.filter((i) => i.categoryId === category.id).length}
                    </td>
                    <td className="px-6 py-4 space-x-3">
                      <button
                        onClick={() => openEditCategory(category)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {t("admin.categories.edit")}
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t("admin.categories.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Locations Tab */}
      {activeTab === "locations" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{t("admin.locations.title")}</h2>
            <button
              onClick={() => setShowAddLocation(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              {t("admin.locations.addLocation")}
            </button>
          </div>

          {locations.length === 0 ? (
            <p className="text-gray-500">{t("admin.locations.noLocations")}</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("admin.locations.name")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("admin.locations.address")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("admin.locations.description")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("admin.locations.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {locations.map((location) => (
                    <tr key={location.id}>
                      <td className="px-6 py-4 font-medium">{location.name}</td>
                      <td className="px-6 py-4 text-gray-600">{location.address || "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{location.description || "-"}</td>
                      <td className="px-6 py-4 space-x-3">
                        <button
                          onClick={() => openEditLocation(location)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {t("admin.locations.edit")}
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(location.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          {t("admin.locations.delete")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">
              {t("admin.checkout.title")}
            </h3>
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.checkout.itemLabel")}
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">{t("admin.checkout.selectItem")}</option>
                  {availableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.checkout.userLabel")}
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">{t("admin.checkout.selectUser")}</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.checkout.dueDate")}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  {t("admin.checkout.submit")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  {t("admin.checkout.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkin Modal */}
      {showCheckin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">{t("admin.loans.checkinTitle")}</h3>
            <form onSubmit={handleCheckin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("item.condition.label")}</label>
                <select
                  value={checkinCondition}
                  onChange={(e) => setCheckinCondition(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">{t("item.condition.unknown")}</option>
                  <option value="GOOD">{t("item.condition.good")}</option>
                  <option value="FAIR">{t("item.condition.fair")}</option>
                  <option value="NEEDS_REPAIR">{t("item.condition.needsRepair")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("admin.loans.damageNote")}</label>
                <textarea
                  value={checkinDamageNote}
                  onChange={(e) => setCheckinDamageNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded"
                  placeholder={t("admin.loans.damageNotePlaceholder")}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  {t("admin.loans.checkin")}
                </button>
                <button type="button" onClick={() => setShowCheckin(false)} className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400">
                  {t("common.cancel")}
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
            <h3 className="text-2xl font-bold mb-4">
              {t("admin.items.newItem")}
            </h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.items.name")}
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.items.description")}
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem({ ...newItem, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.items.category")}
                </label>
                <select
                  value={newItem.categoryId}
                  onChange={(e) =>
                    setNewItem({ ...newItem, categoryId: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">{t("admin.items.selectCategory")}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  {t("admin.items.addItem")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddItem(false)}
                  className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">
              {t("admin.categories.addCategory")}
            </h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.categories.name")}
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.categories.description")}
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  {t("admin.categories.create")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Item Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">{t("admin.items.reject")}</h3>
            <form onSubmit={handleRejectItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.items.rejectNote")}
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  {t("admin.items.reject")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">{t("admin.locations.addLocation")}</h3>
            <form onSubmit={handleAddLocation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("admin.locations.name")}</label>
                <input
                  type="text"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("admin.locations.address")}</label>
                <input
                  type="text"
                  value={locationForm.address}
                  onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("admin.locations.description")}</label>
                <textarea
                  value={locationForm.description}
                  onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  {t("admin.locations.create")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddLocation(false)}
                  className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {showEditLocation && editingLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">{t("admin.locations.editLocation")}</h3>
            <form onSubmit={handleEditLocation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("admin.locations.name")}</label>
                <input
                  type="text"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("admin.locations.address")}</label>
                <input
                  type="text"
                  value={locationForm.address}
                  onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("admin.locations.description")}</label>
                <textarea
                  value={locationForm.description}
                  onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  {t("admin.locations.update")}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditLocation(false); setEditingLocation(null); setLocationForm({ name: "", address: "", description: "" }); }}
                  className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategory && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">
              {t("admin.categories.editCategory")}
            </h3>
            <form onSubmit={handleEditCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.categories.name")}
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.categories.description")}
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  {t("admin.categories.update")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCategory(false);
                    setEditingCategory(null);
                    setCategoryForm({ name: "", description: "" });
                  }}
                  className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
