import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../api/client";
import { useOrganization } from "../../context/OrganizationContext";
import { useToast } from "../../components/ui/Toast";
import { useConfirm } from "../../components/ui/ConfirmModal";
import { Spinner } from "../../components/ui/Spinner";
import type {
  Item,
  Category,
  Loan,
  Location,
  User,
  Reservation,
} from "@ting/shared";

export function AdminDashboard() {
  const { t } = useTranslation();
  const { activeOrganizationId, activeOrganization } = useOrganization();
  const toast = useToast();
  const confirm = useConfirm();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [overdueLoans, setOverdueLoans] = useState<Loan[]>([]);
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>(
    [],
  );
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<Array<{ membership: any; user: User }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "loans"
    | "reservations"
    | "items"
    | "users"
    | "categories"
    | "locations"
    | "organization"
    | "groups"
    | "email"
    | "auditlog"
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
  const [locationForm, setLocationForm] = useState({
    name: "",
    address: "",
    description: "",
  });

  // Item approval state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingItemId, setRejectingItemId] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  // Add user modal state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });
  const [addUserError, setAddUserError] = useState("");

  // Email log state
  const [emailLogs, setEmailLogs] = useState<
    Array<{
      id: string;
      to: string;
      subject: string;
      event: string;
      status: string;
      error: string | null;
      createdAt: string;
    }>
  >([]);
  const [emailLogsLoading, setEmailLogsLoading] = useState(false);

  // Audit log state
  const [auditLogs, setAuditLogs] = useState<
    Array<{
      id: string;
      organizationId: string;
      organization: { id: string; name: string } | null;
      actorUserId: string | null;
      actor: { id: string; name: string; email: string } | null;
      action: string;
      entityType: string;
      entityId: string | null;
      description: string | null;
      metadata: string | null;
      createdAt: string;
    }>
  >([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState("");

  // Test email form state
  const [testEmailTo, setTestEmailTo] = useState("");
  const [testEmailSubject, setTestEmailSubject] = useState("");
  const [testEmailText, setTestEmailText] = useState("");
  const [testEmailSending, setTestEmailSending] = useState(false);

  // Filter states
  const [loanStatusFilter, setLoanStatusFilter] = useState<"all" | "active" | "returned" | "overdue">("all");
  const [itemCategoryFilter, setItemCategoryFilter] = useState<string>("all");
  const [itemStatusFilter, setItemStatusFilter] = useState<string>("all");

  // Organization form state
  const [orgForm, setOrgForm] = useState({
    name: "",
    description: "",
    loanDurationDays: 7,
  });
  const [orgSaving, setOrgSaving] = useState(false);

  // Groups state
  const [groups, setGroups] = useState<Array<{ id: string; name: string; description: string | null; memberCount: number }>>([]);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [groupForm, setGroupForm] = useState({ name: "", description: "" });

  // Invitations state
  const [invitations, setInvitations] = useState<Array<{
    id: string;
    email: string;
    role: string;
    expiresAt: string;
    usedAt: string | null;
    createdAt: string;
  }>>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "MEMBER" });
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganizationId]);

  useEffect(() => {
    if (activeOrganization) {
      setOrgForm({
        name: activeOrganization.name,
        description: activeOrganization.description || "",
        loanDurationDays: activeOrganization.loanDurationDays,
      });
    }
  }, [activeOrganization]);

  const loadData = async () => {
    if (!activeOrganizationId) return;
    try {
      const [
        loansData,
        itemsData,
        categoriesData,
        usersData,
        locationsData,
        reservationsData,
        groupsData,
      ] = await Promise.all([
        apiClient.getLoans(),
        apiClient.getItems({
          organizationId: activeOrganizationId,
          limit: 100,
        }),
        apiClient.getCategories(activeOrganizationId),
        apiClient.getUsers(),
        apiClient.getLocations(),
        apiClient.getReservations(),
        apiClient.getGroups(),
      ]);
      setLoans(loansData.filter((l) => !l.returnedAt));
      setOverdueLoans(
        loansData.filter(
          (l) => !l.returnedAt && new Date(l.dueDate) < new Date(),
        ),
      );
      setPendingReservations(
        reservationsData.filter(
          (r) => r.status === "PENDING" || r.status === "CONFIRMED",
        ),
      );
      setItems(itemsData.items);
      setCategories(categoriesData);
      setUsers(usersData);
      setLocations(locationsData);
      setGroups(groupsData);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReservation = async (id: string) => {
    try {
      await apiClient.confirmReservation(id);
      await loadData();
      toast.success(t("admin.reservations.confirmed"));
    } catch (error: any) {
      toast.error(error.message || t("admin.reservations.confirmFailed"));
    }
  };

  const handleCancelReservation = async (id: string) => {
    if (!(await confirm(t("admin.reservations.confirmCancel")))) return;
    try {
      await apiClient.cancelReservation(id);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || t("admin.reservations.cancelFailed"));
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
    if (!(await confirm(t("admin.items.confirmDelete")))) return;
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
    if (!(await confirm(t("admin.categories.confirmDelete")))) return;
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
    if (!(await confirm(t("admin.locations.confirmDelete")))) return;
    try {
      await apiClient.deleteLocation(id);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete location");
    }
  };

  const handleApproveItem = async (id: string) => {
    if (!(await confirm(t("admin.items.confirmApprove")))) return;
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

  const handleChangeRole = async (membershipId: string, newRole: string) => {
    if (!(await confirm(t("admin.users.confirmRoleChange")))) return;
    try {
      await apiClient.updateMembership(membershipId, { role: newRole as any });
      toast.success(t("admin.users.roleChanged"));
      await loadData();
    } catch (error: any) {
      toast.error(error.message || t("admin.users.roleChangeFailed"));
    }
  };

  const handleResetPassword = async (membershipId: string) => {
    const newPassword = prompt(t("admin.users.resetPasswordPrompt"));
    if (!newPassword) return;

    if (newPassword.length < 6) {
      toast.error(t("admin.users.passwordTooShort"));
      return;
    }

    try {
      await apiClient.resetUserPassword(membershipId, newPassword);
      toast.success(t("admin.users.passwordReset"));
    } catch (error: any) {
      toast.error(error.message || t("admin.users.passwordResetFailed"));
    }
  };

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganization) return;
    setOrgSaving(true);
    try {
      await apiClient.updateOrganization(activeOrganization.id, orgForm);
      toast.success(t("admin.organization.saved"));
    } catch (error: any) {
      toast.error(error.message || t("admin.organization.saveFailed"));
    } finally {
      setOrgSaving(false);
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createGroup({
        name: groupForm.name,
        description: groupForm.description || undefined,
      });
      setShowAddGroup(false);
      setGroupForm({ name: "", description: "" });
      const groupsData = await apiClient.getGroups();
      setGroups(groupsData);
      toast.success(t("admin.groups.createSuccess"));
    } catch (error: any) {
      toast.error(error.message || t("admin.groups.createFailed"));
    }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    try {
      await apiClient.updateGroup(editingGroup.id, {
        name: groupForm.name,
        description: groupForm.description || undefined,
      });
      setShowEditGroup(false);
      setEditingGroup(null);
      setGroupForm({ name: "", description: "" });
      const groupsData = await apiClient.getGroups();
      setGroups(groupsData);
      toast.success(t("admin.groups.updateSuccess"));
    } catch (error: any) {
      toast.error(error.message || t("admin.groups.updateFailed"));
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!(await confirm(t("admin.groups.confirmDeleteMessage")))) return;
    try {
      await apiClient.deleteGroup(id);
      const groupsData = await apiClient.getGroups();
      setGroups(groupsData);
      toast.success(t("admin.groups.deleteSuccess"));
    } catch (error: any) {
      toast.error(error.message || t("admin.groups.deleteFailed"));
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await apiClient.sendInvitation(inviteForm.email, inviteForm.role);
      setInviteLink(result.inviteLink);
      const invitationsData = await apiClient.getInvitations();
      setInvitations(invitationsData);
      setInviteForm({ email: "", role: "MEMBER" });
      toast.success(t("admin.invitations.sendSuccess"));
    } catch (error: any) {
      toast.error(error.message || t("admin.invitations.sendFailed"));
    }
  };

  const loadInvitations = async () => {
    try {
      const invitationsData = await apiClient.getInvitations();
      setInvitations(invitationsData);
    } catch (error) {
      console.error("Failed to load invitations:", error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError("");
    if (!activeOrganizationId) return;
    try {
      await apiClient.register(
        newUser.email,
        newUser.password,
        newUser.name,
        activeOrganizationId,
      );
      setShowAddUser(false);
      setNewUser({ name: "", email: "", password: "" });
      await loadData();
      toast.success(t("admin.users.addSuccess"));
    } catch (error: any) {
      setAddUserError(error.message || t("admin.users.addError"));
    }
  };

  if (loading) {
    return <Spinner />;
  }

  const availableItems = items.filter((i) => i.status === "AVAILABLE");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">{t("admin.title")}</h1>
        <Link
          to="/admin/overview"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Platform Overview
        </Link>
      </div>

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
            onClick={() => setActiveTab("reservations")}
            className={`pb-4 px-1 flex items-center gap-1 ${
              activeTab === "reservations"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                : "text-gray-500"
            }`}
          >
            {t("admin.tabs.reservations")}
            {pendingReservations.filter((r) => r.status === "PENDING").length >
              0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800">
                {
                  pendingReservations.filter((r) => r.status === "PENDING")
                    .length
                }
              </span>
            )}
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
          <button
            onClick={() => setActiveTab("organization")}
            className={`pb-4 px-1 ${
              activeTab === "organization"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                : "text-gray-500"
            }`}
          >
            {t("admin.tabs.organization")}
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`pb-4 px-1 ${
              activeTab === "groups"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                : "text-gray-500"
            }`}
          >
            {t("admin.tabs.groups")}
          </button>
          <button
            onClick={() => {
              setActiveTab("auditlog");
              if (auditLogs.length === 0) {
                setAuditLogsLoading(true);
                apiClient
                  .getAuditLogs({ limit: 200 })
                  .then(setAuditLogs)
                  .catch(console.error)
                  .finally(() => setAuditLogsLoading(false));
              }
            }}
            className={`pb-4 px-1 ${
              activeTab === "auditlog"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                : "text-gray-500"
            }`}
          >
            Aktivitetslogg
          </button>
          <button
            onClick={() => {
              setActiveTab("email");
              if (emailLogs.length === 0) {
                setEmailLogsLoading(true);
                apiClient
                  .getEmailLogs(200)
                  .then(setEmailLogs)
                  .catch(console.error)
                  .finally(() => setEmailLogsLoading(false));
              }
            }}
            className={`pb-4 px-1 ${
              activeTab === "email"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                : "text-gray-500"
            }`}
          >
            E-post
          </button>
        </div>
      </div>

      {/* Loans Tab */}
      {activeTab === "loans" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{t("admin.loans.title")}</h2>
            <button
              onClick={() => {
                const days = activeOrganization?.loanDurationDays ?? 7;
                const d = new Date();
                d.setDate(d.getDate() + days);
                setDueDate(d.toISOString().split("T")[0]);
                setShowCheckout(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              {t("admin.loans.checkoutItem")}
            </button>
          </div>

          {/* Loan Status Filter */}
          <div className="mb-4 flex gap-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              {t("admin.loans.filterStatus")}:
            </label>
            <select
              value={loanStatusFilter}
              onChange={(e) => setLoanStatusFilter(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">{t("admin.loans.statusAll")}</option>
              <option value="active">{t("admin.loans.statusActive")}</option>
              <option value="returned">{t("admin.loans.statusReturned")}</option>
              <option value="overdue">{t("admin.loans.statusOverdue")}</option>
            </select>
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
                  {loans
                    .filter((loan) => {
                      const isOverdue = new Date(loan.dueDate) < new Date() && !loan.returnedAt;
                      if (loanStatusFilter === "active") return !loan.returnedAt;
                      if (loanStatusFilter === "returned") return !!loan.returnedAt;
                      if (loanStatusFilter === "overdue") return isOverdue;
                      return true;
                    })
                    .map((loan) => {
                    const isOverdue = new Date(loan.dueDate) < new Date();
                    return (
                      <tr
                        key={loan.id}
                        className={isOverdue ? "bg-red-50" : ""}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium">{loan.item?.name}</div>
                        </td>
                        <td className="px-6 py-4">{loan.user?.name}</td>
                        <td className="px-6 py-4 text-sm">
                          {new Date(loan.checkedOutAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={
                              isOverdue ? "text-red-600 font-bold" : ""
                            }
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

      {/* Reservations Tab */}
      {activeTab === "reservations" && (
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {t("admin.reservations.title")}
          </h2>
          {pendingReservations.length === 0 ? (
            <p className="text-gray-500">{t("admin.reservations.none")}</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("admin.reservations.item")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("admin.reservations.user")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("admin.reservations.period")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("admin.reservations.status")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("admin.reservations.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingReservations.map((r) => (
                      <tr key={r.id}>
                        <td className="px-6 py-4 font-medium">
                          {r.item?.name}
                        </td>
                        <td className="px-6 py-4 text-sm">{r.user?.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(r.startDate).toLocaleDateString()} –{" "}
                          {new Date(r.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {r.status === "PENDING" ? (
                            <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                              {t("admin.reservations.statusPending")}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                              {t("admin.reservations.statusConfirmed")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 flex gap-3">
                          {r.status === "PENDING" && (
                            <button
                              onClick={() => handleConfirmReservation(r.id)}
                              className="text-green-600 hover:text-green-900 text-sm"
                            >
                              {t("admin.reservations.confirm")}
                            </button>
                          )}
                          <button
                            onClick={() => handleCancelReservation(r.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            {t("admin.reservations.cancel")}
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

          {/* Item Filters */}
          <div className="mb-4 flex gap-4">
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-700">
                {t("admin.items.filterCategory")}:
              </label>
              <select
                value={itemCategoryFilter}
                onChange={(e) => setItemCategoryFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">{t("admin.items.categoryAll")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-700">
                {t("admin.items.filterStatus")}:
              </label>
              <select
                value={itemStatusFilter}
                onChange={(e) => setItemStatusFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">{t("admin.items.statusAll")}</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="CHECKED_OUT">CHECKED_OUT</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="RETIRED">RETIRED</option>
              </select>
            </div>
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
                  {items
                    .filter((item) => {
                      if (itemCategoryFilter !== "all" && item.categoryId !== itemCategoryFilter) return false;
                      if (itemStatusFilter !== "all" && item.status !== itemStatusFilter) return false;
                      return true;
                    })
                    .map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 font-medium">
                        <Link
                          to={`/items/${item.slug ?? item.id}`}
                          className="text-indigo-600 hover:underline"
                        >
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
                          {t(
                            `admin.items.approvalValues.${item.approvalStatus}`,
                          )}
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{t("admin.users.title")}</h2>
            <button
              onClick={() => {
                setShowAddUser(true);
                setAddUserError("");
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              {t("admin.users.addUser")}
            </button>
          </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("admin.users.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(({ user, membership }) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 font-medium">{user.name}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            membership.role === "OWNER"
                              ? "bg-purple-100 text-purple-800"
                              : membership.role === "ADMIN"
                                ? "bg-blue-100 text-blue-800"
                                : membership.role === "MANAGER"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {membership.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(membership.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3 items-center">
                          {membership.role !== "OWNER" && (
                            <select
                              value={membership.role}
                              onChange={(e) => handleChangeRole(membership.id, e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="MEMBER">MEMBER</option>
                              <option value="MANAGER">MANAGER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          )}
                          {membership.role !== "OWNER" && (
                            <button
                              onClick={() => handleResetPassword(membership.id)}
                              className="text-orange-600 hover:text-orange-900 text-sm"
                            >
                              {t("admin.users.resetPassword")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invitations Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{t("admin.invitations.title")}</h3>
              <button
                onClick={() => {
                  setShowInviteModal(true);
                  setInviteLink("");
                  loadInvitations();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {t("admin.invitations.inviteButton")}
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("admin.invitations.email")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("admin.invitations.role")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("admin.invitations.status")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("admin.invitations.expires")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invitations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        {t("admin.invitations.noInvitations")}
                      </td>
                    </tr>
                  ) : (
                    invitations.map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-6 py-4">{inv.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                            {inv.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {inv.usedAt ? (
                            <span className="text-green-600 text-sm">{t("admin.invitations.accepted")}</span>
                          ) : new Date() > new Date(inv.expiresAt) ? (
                            <span className="text-red-600 text-sm">{t("admin.invitations.expired")}</span>
                          ) : (
                            <span className="text-blue-600 text-sm">{t("admin.invitations.pending")}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
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
                        {
                          items.filter((i) => i.categoryId === category.id)
                            .length
                        }
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
                        <td className="px-6 py-4 font-medium">
                          {location.name}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {location.address || "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {location.description || "-"}
                        </td>
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

      {/* Organization Tab */}
      {activeTab === "organization" && (
        <div>
          <h2 className="text-2xl font-bold mb-4">{t("admin.organization.title")}</h2>

          <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
            <form onSubmit={handleSaveOrganization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("admin.organization.name")}
                </label>
                <input
                  type="text"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("admin.organization.description")}
                </label>
                <textarea
                  value={orgForm.description}
                  onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("admin.organization.loanDurationDays")}
                </label>
                <input
                  type="number"
                  value={orgForm.loanDurationDays}
                  onChange={(e) => setOrgForm({ ...orgForm, loanDurationDays: parseInt(e.target.value) || 7 })}
                  min="1"
                  max="365"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t("admin.organization.loanDurationHint")}
                </p>
              </div>

              <button
                type="submit"
                disabled={orgSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {orgSaving ? t("admin.organization.saving") : t("admin.organization.save")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === "groups" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{t("admin.groups.title")}</h2>
            <button
              onClick={() => {
                setGroupForm({ name: "", description: "" });
                setShowAddGroup(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              {t("admin.groups.addGroup")}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.groups.name")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.groups.description")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.groups.members")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.groups.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      {t("admin.groups.noGroups")}
                    </td>
                  </tr>
                ) : (
                  groups.map((group) => (
                    <tr key={group.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{group.name}</td>
                      <td className="px-6 py-4">{group.description || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{group.memberCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        <button
                          onClick={() => {
                            setEditingGroup(group);
                            setGroupForm({ name: group.name, description: group.description || "" });
                            setShowEditGroup(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {t("admin.groups.edit")}
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          {t("admin.groups.delete")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === "auditlog" && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <h2 className="text-2xl font-bold">Aktivitetslogg</h2>
            <input
              type="text"
              placeholder="Filtrer hendelse (f.eks. loan.checkout)"
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
              className="px-3 py-1.5 border rounded text-sm w-64"
            />
            <button
              onClick={() => {
                setAuditLogsLoading(true);
                apiClient
                  .getAuditLogs({
                    limit: 200,
                    action: auditActionFilter || undefined,
                  })
                  .then(setAuditLogs)
                  .catch(console.error)
                  .finally(() => setAuditLogsLoading(false));
              }}
              className="text-sm text-indigo-600 hover:underline"
            >
              Oppdater
            </button>
          </div>
          {auditLogsLoading ? (
            <p className="text-gray-500">Laster...</p>
          ) : auditLogs.length === 0 ? (
            <p className="text-gray-500">Ingen hendelser logget ennå.</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                        Tid
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hendelse
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Bruker
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Org
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Entitet
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("no")}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {log.actor ? (
                            <span title={log.actor.email}>
                              {log.actor.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">–</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          {log.organization?.name ??
                            log.organizationId.slice(-6)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          {log.entityType}
                          {log.entityId && (
                            <span className="ml-1 text-xs text-gray-400">
                              {log.entityId.slice(-6)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                          {log.metadata ? (
                            <span title={log.metadata}>{log.metadata}</span>
                          ) : (
                            "–"
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
      )}

      {/* Email Tab */}
      {activeTab === "email" && (
        <div className="space-y-8">
          {/* Test email form */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Send test-e-post</h2>
            <div className="bg-white rounded-lg shadow p-6 max-w-lg">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setTestEmailSending(true);
                  try {
                    await apiClient.sendTestEmail(
                      testEmailTo,
                      testEmailSubject,
                      testEmailText,
                    );
                    toast.success("E-post sendt!");
                    setTestEmailTo("");
                    setTestEmailSubject("");
                    setTestEmailText("");
                    // Refresh log
                    apiClient
                      .getEmailLogs(200)
                      .then(setEmailLogs)
                      .catch(console.error);
                  } catch (err: any) {
                    toast.error(err.message || "Feil ved sending");
                  } finally {
                    setTestEmailSending(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1">Til</label>
                  <input
                    type="email"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded"
                    placeholder="mottaker@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Emne</label>
                  <input
                    type="text"
                    value={testEmailSubject}
                    onChange={(e) => setTestEmailSubject(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded"
                    placeholder="Testmelding fra Ting"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Melding
                  </label>
                  <textarea
                    value={testEmailText}
                    onChange={(e) => setTestEmailText(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="Skriv meldingstekst her..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={testEmailSending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {testEmailSending ? "Sender..." : "Send"}
                </button>
              </form>
            </div>
          </div>

          {/* Email log */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold">E-postlogg</h2>
              <button
                onClick={() => {
                  setEmailLogsLoading(true);
                  apiClient
                    .getEmailLogs(200)
                    .then(setEmailLogs)
                    .catch(console.error)
                    .finally(() => setEmailLogsLoading(false));
                }}
                className="text-sm text-indigo-600 hover:underline"
              >
                Oppdater
              </button>
            </div>
            {emailLogsLoading ? (
              <p className="text-gray-500">Laster...</p>
            ) : emailLogs.length === 0 ? (
              <p className="text-gray-500">Ingen e-poster logget ennå.</p>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Tid
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Til
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Emne
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Hendelse
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Feil
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {emailLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString("no")}
                          </td>
                          <td className="px-4 py-3">{log.to}</td>
                          <td className="px-4 py-3">{log.subject}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                              {log.event}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                log.status === "sent"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-red-600 text-xs">
                            {log.error || "–"}
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
                  {users.map(({ user }) => (
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
            <h3 className="text-2xl font-bold mb-4">
              {t("admin.loans.checkinTitle")}
            </h3>
            <form onSubmit={handleCheckin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("item.condition.label")}
                </label>
                <select
                  value={checkinCondition}
                  onChange={(e) => setCheckinCondition(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">{t("item.condition.unknown")}</option>
                  <option value="GOOD">{t("item.condition.good")}</option>
                  <option value="FAIR">{t("item.condition.fair")}</option>
                  <option value="NEEDS_REPAIR">
                    {t("item.condition.needsRepair")}
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.loans.damageNote")}
                </label>
                <textarea
                  value={checkinDamageNote}
                  onChange={(e) => setCheckinDamageNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded"
                  placeholder={t("admin.loans.damageNotePlaceholder")}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  {t("admin.loans.checkin")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCheckin(false)}
                  className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
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
            <h3 className="text-2xl font-bold mb-4">
              {t("admin.items.reject")}
            </h3>
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

      {/* Add Group Modal */}
      {showAddGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">
              {t("admin.groups.addGroup")}
            </h3>
            <form onSubmit={handleAddGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.groups.name")}
                </label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.groups.description")}
                </label>
                <textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  {t("admin.groups.create")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddGroup(false)}
                  className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">
              {t("admin.groups.editGroup")}
            </h3>
            <form onSubmit={handleEditGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.groups.name")}
                </label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.groups.description")}
                </label>
                <textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  {t("admin.groups.update")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditGroup(false);
                    setEditingGroup(null);
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

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">
              {t("admin.invitations.inviteButton")}
            </h3>
            <form onSubmit={handleSendInvitation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.invitations.email")}
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.invitations.role")}
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              {inviteLink && (
                <div className="p-3 bg-green-50 rounded">
                  <p className="text-sm font-medium text-green-800 mb-1">
                    {t("admin.invitations.linkGenerated")}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-2 py-1 text-sm border rounded bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        toast.success(t("admin.invitations.linkCopied"));
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      {t("admin.invitations.copy")}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {t("admin.invitations.send")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteLink("");
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

      {/* Add Location Modal */}
      {showAddLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">
              {t("admin.locations.addLocation")}
            </h3>
            <form onSubmit={handleAddLocation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.locations.name")}
                </label>
                <input
                  type="text"
                  value={locationForm.name}
                  onChange={(e) =>
                    setLocationForm({ ...locationForm, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.locations.address")}
                </label>
                <input
                  type="text"
                  value={locationForm.address}
                  onChange={(e) =>
                    setLocationForm({
                      ...locationForm,
                      address: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.locations.description")}
                </label>
                <textarea
                  value={locationForm.description}
                  onChange={(e) =>
                    setLocationForm({
                      ...locationForm,
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
            <h3 className="text-2xl font-bold mb-4">
              {t("admin.locations.editLocation")}
            </h3>
            <form onSubmit={handleEditLocation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.locations.name")}
                </label>
                <input
                  type="text"
                  value={locationForm.name}
                  onChange={(e) =>
                    setLocationForm({ ...locationForm, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.locations.address")}
                </label>
                <input
                  type="text"
                  value={locationForm.address}
                  onChange={(e) =>
                    setLocationForm({
                      ...locationForm,
                      address: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.locations.description")}
                </label>
                <textarea
                  value={locationForm.description}
                  onChange={(e) =>
                    setLocationForm({
                      ...locationForm,
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
                  {t("admin.locations.update")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditLocation(false);
                    setEditingLocation(null);
                    setLocationForm({ name: "", address: "", description: "" });
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

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">
              {t("admin.users.addUser")}
            </h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.users.name")}
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.users.email")}
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin.users.password")}
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              {addUserError && (
                <p className="text-red-600 text-sm">{addUserError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  {t("admin.users.create")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUser(false);
                    setNewUser({ name: "", email: "", password: "" });
                    setAddUserError("");
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
