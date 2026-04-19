import { useEffect, useState } from "react";
import { apiClient } from "../../api/client";
import { Spinner } from "../../components/ui/Spinner";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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
            <h2 className="text-2xl font-bold mb-4">All Organizations</h2>
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
                        <td className="px-6 py-4 font-medium">{org.name}</td>
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
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleSelectOrg(org.id)}
                            className={`text-sm px-3 py-1 rounded ${
                              selectedOrgId === org.id
                                ? "bg-indigo-600 text-white"
                                : "text-indigo-600 hover:text-indigo-900"
                            }`}
                          >
                            View Details
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
              <h2 className="text-2xl font-bold mb-4">
                {selectedOrgDetails.name}
              </h2>
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
    </div>
  );
}
