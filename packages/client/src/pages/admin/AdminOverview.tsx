import { useEffect, useState } from "react";
import { apiClient } from "../../api/client";
import { Spinner } from "../../components/ui/Spinner";
import { ORG_TYPES, ORG_TYPE_LABELS, ORG_NAME_SUGGESTIONS, slugify } from "../../utils/orgNameSuggestions";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type?: string | null;
  memberCount: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  memberships: Array<{
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    role: string;
    status: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export function AdminOverview() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"organizations" | "users">(
    "organizations"
  );
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedOrgDetails, setSelectedOrgDetails] = useState<any>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState({ name: "", email: "", role: "" });
  const [editError, setEditError] = useState("");
  const [availableOrgsForUser, setAvailableOrgsForUser] = useState<Organization[]>([]);
  const [selectedOrgToAdd, setSelectedOrgToAdd] = useState("");
  const [addOrgLoading, setAddOrgLoading] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editOrgForm, setEditOrgForm] = useState({ name: "", description: "", slug: "", type: "" });
  const [editOrgError, setEditOrgError] = useState("");
  const [deleteConfirmOrgId, setDeleteConfirmOrgId] = useState<string | null>(null);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [createOrgForm, setCreateOrgForm] = useState({ name: "", description: "", slug: "", type: "" });
  const [createOrgError, setCreateOrgError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [orgsData, usersData] = await Promise.all([
        apiClient.getAdminOrganizations(),
        apiClient.getAdminUsers(),
      ]);
      setOrganizations(orgsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to load admin overview data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrgDetails = async (orgId: string) => {
    try {
      const details = await apiClient.getAdminOrganization(orgId);
      setSelectedOrgDetails(details);
    } catch (error) {
      console.error("Failed to load organization details:", error);
    }
  };

  const handleSelectOrg = (orgId: string) => {
    setSelectedOrgId(orgId);
    loadOrgDetails(orgId);
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditUserForm({ name: user.name, email: user.email, role: user.role });
    setEditError("");
    setSelectedOrgToAdd("");

    // Calculate available organizations (not already a member of)
    const userOrgIds = new Set(user.memberships.map(m => m.organizationId));
    const available = organizations.filter(org => !userOrgIds.has(org.id));
    setAvailableOrgsForUser(available);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    try {
      setEditError("");
      await apiClient.updateAdminUser(editingUserId, {
        name: editUserForm.name || undefined,
        role: editUserForm.role || undefined,
      });
      setEditingUserId(null);
      await loadData();
    } catch (error: any) {
      setEditError(error.message || "Failed to update user");
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditUserForm({ name: "", email: "", role: "" });
    setEditError("");
    setSelectedOrgToAdd("");
  };

  const handleAddOrganization = async () => {
    if (!editingUserId || !selectedOrgToAdd) return;

    try {
      setAddOrgLoading(true);
      await apiClient.addUserToOrganization(editingUserId, selectedOrgToAdd);
      setSelectedOrgToAdd("");
      await loadData();
    } catch (error: any) {
      setEditError(error.message || "Failed to add user to organization");
    } finally {
      setAddOrgLoading(false);
    }
  };

  const handleRemoveOrganization = async (orgId: string) => {
    if (!editingUserId) return;

    try {
      await apiClient.removeUserFromOrganization(editingUserId, orgId);
      await loadData();
    } catch (error: any) {
      setEditError(error.message || "Failed to remove user from organization");
    }
  };

  const handleEditOrganization = (org: Organization) => {
    setEditingOrgId(org.id);
    setEditOrgForm({ name: org.name, description: org.description || "", slug: org.slug, type: org.type || "" });
    setEditOrgError("");
  };

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrgId) return;

    try {
      setEditOrgError("");
      await apiClient.updateAdminOrganization(editingOrgId, {
        name: editOrgForm.name || undefined,
        description: editOrgForm.description || undefined,
        slug: editOrgForm.slug || undefined,
        type: editOrgForm.type || null,
      });
      setEditingOrgId(null);
      await loadData();
    } catch (error: any) {
      setEditOrgError(error.message || "Failed to update organization");
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    try {
      await apiClient.deleteAdminOrganization(orgId);
      setDeleteConfirmOrgId(null);
      setSelectedOrgId(null);
      await loadData();
    } catch (error: any) {
      setEditOrgError(error.message || "Failed to delete organization");
    }
  };

  const handleCancelEditOrg = () => {
    setEditingOrgId(null);
    setEditOrgForm({ name: "", description: "", slug: "", type: "" });
    setEditOrgError("");
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createOrgForm.name) {
      setCreateOrgError("Name is required");
      return;
    }

    try {
      setCreateOrgError("");
      await apiClient.createOrganization({
        name: createOrgForm.name,
        slug: createOrgForm.slug || undefined,
        description: createOrgForm.description || undefined,
        type: createOrgForm.type || undefined,
      });
      setCreatingOrg(false);
      setCreateOrgForm({ name: "", description: "", slug: "", type: "" });
      await loadData();
    } catch (error: any) {
      setCreateOrgError(error.message || "Failed to create organization");
    }
  };

  const handleCancelCreate = () => {
    setCreatingOrg(false);
    setCreateOrgForm({ name: "", description: "", slug: "", type: "" });
    setCreateOrgError("");
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Platform Admin Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-indigo-600">
            {organizations.length}
          </div>
          <div className="text-gray-600">Total Organizations</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-blue-600">{users.length}</div>
          <div className="text-gray-600">Total Users</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-green-600">
            {organizations.reduce((sum, org) => sum + org.itemCount, 0)}
          </div>
          <div className="text-gray-600">Total Items</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("organizations")}
            className={`pb-4 px-1 ${
              activeTab === "organizations"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                : "text-gray-500"
            }`}
          >
            Organizations
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-4 px-1 ${
              activeTab === "users"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                : "text-gray-500"
            }`}
          >
            Users
          </button>
        </div>
      </div>

      {/* Organizations Tab */}
      {activeTab === "organizations" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Organizations List */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">All Organizations</h2>
              <button
                onClick={() => setCreatingOrg(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Create Organization
              </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Members
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {organizations.map((org) => (
                      <tr key={org.id}>
                        <td className="px-6 py-4 font-medium">
                          <div>{org.name}</div>
                          {org.type && (
                            <div className="text-xs text-gray-500 mt-1">
                              {ORG_TYPE_LABELS[org.type as keyof typeof ORG_TYPE_LABELS]}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {org.memberCount}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            {org.itemCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 space-x-2">
                          <button
                            onClick={() => handleSelectOrg(org.id)}
                            className={`text-sm px-3 py-1 rounded ${
                              selectedOrgId === org.id
                                ? "bg-indigo-600 text-white"
                                : "text-indigo-600 hover:text-indigo-900"
                            }`}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditOrganization(org)}
                            className="text-sm px-3 py-1 text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Organization Details */}
          {selectedOrgDetails && (
            <div>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">
                  {selectedOrgDetails.name}
                </h2>
                <div className="space-x-2">
                  <button
                    onClick={() => handleEditOrganization(selectedOrgDetails)}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirmOrgId(selectedOrgDetails.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div>
                  <p className="text-gray-600 text-sm">Slug</p>
                  <p className="font-medium">{selectedOrgDetails.slug}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Description</p>
                  <p className="font-medium">
                    {selectedOrgDetails.description || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Items</p>
                  <p className="text-3xl font-bold text-green-600">
                    {selectedOrgDetails.itemCount}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-3">Members</p>
                  <div className="space-y-2">
                    {selectedOrgDetails.members.map((member: any) => (
                      <div
                        key={member.userId}
                        className="p-3 bg-gray-50 rounded text-sm"
                      >
                        <div className="font-medium">{member.userName}</div>
                        <div className="text-gray-600">{member.userEmail}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Role: {member.membershipRole}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div>
          <h2 className="text-2xl font-bold mb-4">All Users</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Organizations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
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
                          className={`inline-block px-3 py-1 text-xs rounded font-medium ${
                            user.role === "ADMIN"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.memberships.length === 0 ? (
                            <span className="text-gray-500 text-sm">None</span>
                          ) : (
                            user.memberships.map((m) => (
                              <span
                                key={m.organizationId}
                                className="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 text-xs rounded"
                              >
                                {m.organizationName}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          Edit
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

      {/* Edit User Modal */}
      {editingUserId && users.find(u => u.id === editingUserId) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">Edit User</h3>
            {editError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {editError}
              </div>
            )}
            <form onSubmit={handleSaveUser} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={editUserForm.name}
                    onChange={(e) =>
                      setEditUserForm({ ...editUserForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={editUserForm.email}
                    onChange={(e) =>
                      setEditUserForm({ ...editUserForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={editUserForm.role}
                  onChange={(e) =>
                    setEditUserForm({ ...editUserForm, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select role...</option>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Organizations */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Organizations</h4>
                <div className="space-y-2 mb-4">
                  {users.find(u => u.id === editingUserId)?.memberships.length === 0 ? (
                    <p className="text-gray-500 text-sm">Not a member of any organization</p>
                  ) : (
                    users.find(u => u.id === editingUserId)?.memberships.map((m) => (
                      <div key={m.organizationId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium text-sm">{m.organizationName}</div>
                          <div className="text-xs text-gray-500">{m.role}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOrganization(m.organizationId)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {availableOrgsForUser.length > 0 && (
                  <div className="flex gap-2">
                    <select
                      value={selectedOrgToAdd}
                      onChange={(e) => setSelectedOrgToAdd(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Add to organization...</option>
                      {availableOrgsForUser.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddOrganization}
                      disabled={!selectedOrgToAdd || addOrgLoading}
                      className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 text-sm"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {editingOrgId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Edit Organization</h3>
            {editOrgError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {editOrgError}
              </div>
            )}
            <form onSubmit={handleSaveOrganization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editOrgForm.name}
                  onChange={(e) =>
                    setEditOrgForm({ ...editOrgForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={editOrgForm.slug}
                  onChange={(e) =>
                    setEditOrgForm({ ...editOrgForm, slug: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editOrgForm.description}
                  onChange={(e) =>
                    setEditOrgForm({ ...editOrgForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancelEditOrg}
                  className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Organization Confirmation Modal */}
      {deleteConfirmOrgId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Delete Organization</h3>
            {editOrgError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {editOrgError}
              </div>
            )}
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this organization? This action cannot be undone. Make sure the organization has no items.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDeleteOrganization(deleteConfirmOrgId)}
                className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirmOrgId(null)}
                className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {editingOrgId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">Edit Organization</h3>
            {editOrgError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {editOrgError}
              </div>
            )}
            <form onSubmit={handleSaveOrganization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editOrgForm.name}
                  onChange={(e) => setEditOrgForm({ ...editOrgForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={editOrgForm.type}
                  onChange={(e) => setEditOrgForm({ ...editOrgForm, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— No type —</option>
                  {ORG_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {ORG_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              {editOrgForm.type && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-600 mb-2">Suggestions:</p>
                  <div className="space-y-1">
                    {ORG_NAME_SUGGESTIONS[editOrgForm.type as keyof typeof ORG_NAME_SUGGESTIONS].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setEditOrgForm({
                            ...editOrgForm,
                            name: suggestion,
                            slug: slugify(suggestion),
                          });
                        }}
                        className="w-full text-left px-3 py-2 text-sm bg-indigo-50 hover:bg-indigo-100 rounded text-indigo-700"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={editOrgForm.slug}
                  onChange={(e) => setEditOrgForm({ ...editOrgForm, slug: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editOrgForm.description}
                  onChange={(e) => setEditOrgForm({ ...editOrgForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancelEditOrg}
                  className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Organization Modal */}
      {creatingOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">Create Organization</h3>
            {createOrgError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {createOrgError}
              </div>
            )}
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={createOrgForm.name}
                  onChange={(e) => setCreateOrgForm({ ...createOrgForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={createOrgForm.type}
                  onChange={(e) => setCreateOrgForm({ ...createOrgForm, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— No type —</option>
                  {ORG_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {ORG_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              {createOrgForm.type && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-600 mb-2">Suggestions:</p>
                  <div className="space-y-1">
                    {ORG_NAME_SUGGESTIONS[createOrgForm.type as keyof typeof ORG_NAME_SUGGESTIONS].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setCreateOrgForm({
                            ...createOrgForm,
                            name: suggestion,
                            slug: slugify(suggestion),
                          });
                        }}
                        className="w-full text-left px-3 py-2 text-sm bg-indigo-50 hover:bg-indigo-100 rounded text-indigo-700"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={createOrgForm.slug}
                  onChange={(e) => setCreateOrgForm({ ...createOrgForm, slug: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={createOrgForm.description}
                  onChange={(e) => setCreateOrgForm({ ...createOrgForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={handleCancelCreate}
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
