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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
