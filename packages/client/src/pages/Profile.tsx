import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { TermsPopover } from "../components/TermsPopover";
import { useAuth } from "../context/AuthContext";
import { useOrganization } from "../context/OrganizationContext";
import type { Loan, Reservation } from "@ting/shared";

export function Profile() {
  const { t } = useTranslation();
  const { user, refreshUser, activeMembership } = useAuth();
  const { organizations } = useOrganization();

  // Name change state
  const [name, setName] = useState(user?.name ?? "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Activity state
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Invitation state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string; link?: string } | null>(null);

  useEffect(() => {
    setActivityLoading(true);
    Promise.all([
      apiClient.getLoans({ active: true }),
      apiClient.getReservations(),
    ])
      .then(([loansData, resData]) => {
        setLoans(loansData);
        setReservations(resData.filter((r) => r.status === "CONFIRMED" || r.status === "PENDING"));
      })
      .catch(() => {})
      .finally(() => setActivityLoading(false));
  }, []);

  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setNameSaving(true);
    setNameMsg(null);
    try {
      await apiClient.updateUser(user.id, { name });
      await refreshUser();
      setNameMsg({ ok: true, text: t("profile.nameUpdated") });
    } catch {
      setNameMsg({ ok: false, text: t("profile.nameUpdateFailed") });
    } finally {
      setNameSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMsg({ ok: false, text: t("profile.passwordMismatch") });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await apiClient.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwMsg({ ok: true, text: t("profile.passwordChanged") });
    } catch {
      setPwMsg({ ok: false, text: t("profile.passwordChangeFailed") });
    } finally {
      setPwSaving(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSending(true);
    setInviteMsg(null);
    try {
      const result = await apiClient.sendInvitation(inviteEmail, inviteRole);
      setInviteMsg({
        ok: true,
        text: t("profile.inviteSent"),
        link: result.inviteLink,
      });
      setInviteEmail("");
    } catch (err: any) {
      const isAlreadyMember = err.message?.includes("already a member");
      setInviteMsg({
        ok: false,
        text: isAlreadyMember ? t("profile.alreadyMember") : t("profile.inviteFailed"),
      });
    } finally {
      setInviteSending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">{t("profile.title")}</h1>

        {/* Change name */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">{t("profile.changeName")}</h2>
          <div className="mb-3">
            <span className="text-sm text-gray-500">{t("auth.email")}</span>
            <p className="font-medium">{user?.email}</p>
          </div>
          <form onSubmit={handleNameSave} className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              disabled={nameSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {nameSaving ? t("profile.saving") : t("profile.save")}
            </button>
          </form>
          {nameMsg && (
            <p className={`mt-2 text-sm ${nameMsg.ok ? "text-green-600" : "text-red-600"}`}>{nameMsg.text}</p>
          )}
        </div>

        {/* Change password */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">{t("profile.changePassword")}</h2>
          <form onSubmit={handlePasswordSave} className="space-y-3">
            <input
              type="password"
              placeholder={t("profile.currentPassword")}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="password"
              placeholder={t("profile.newPassword")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="password"
              placeholder={t("profile.confirmPassword")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              disabled={pwSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {pwSaving ? t("profile.saving") : t("profile.save")}
            </button>
          </form>
          {pwMsg && (
            <p className={`mt-2 text-sm ${pwMsg.ok ? "text-green-600" : "text-red-600"}`}>{pwMsg.text}</p>
          )}
        </div>

        {/* Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">{t("profile.activity")}</h2>
          {activityLoading ? (
            <p className="text-sm text-gray-500">{t("common.loading")}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-600 mb-2">{t("profile.activeLoans")}</h3>
                {loans.length === 0 ? (
                  <p className="text-sm text-gray-400">{t("profile.noLoans")}</p>
                ) : (
                  <ul className="space-y-1">
                    {loans.map((loan) => (
                      <li key={loan.id} className="flex justify-between text-sm">
                        <Link to={`/items/${loan.item?.slug ?? loan.itemId}`} className="text-indigo-600 hover:underline">
                          {loan.item?.name ?? loan.itemId}
                        </Link>
                        <span className="text-gray-500">
                          {t("profile.dueDate")}: {new Date(loan.dueDate).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-600 mb-2">{t("profile.upcomingReservations")}</h3>
                {reservations.length === 0 ? (
                  <p className="text-sm text-gray-400">{t("profile.noReservations")}</p>
                ) : (
                  <ul className="space-y-1">
                    {reservations.map((res) => (
                      <li key={res.id} className="flex justify-between text-sm">
                        <Link to={`/items/${res.item?.slug ?? res.itemId}`} className="text-indigo-600 hover:underline">
                          {res.item?.name ?? res.itemId}
                        </Link>
                        <span className="text-gray-500">
                          {new Date(res.startDate).toLocaleDateString()} – {new Date(res.endDate).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Organization */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">{t("profile.organization")}</h2>

          {activeMembership ? (
            <div className="mb-4">
              <span className="text-sm text-gray-500">{t("profile.currentOrganization")}</span>
              <p className="font-medium text-gray-800">
                {organizations.find(org => org.id === activeMembership.organizationId)?.name || activeMembership.organizationId}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {t("profile.yourRole")}: {t(`dashboard.membership.roles.${activeMembership.role.toLowerCase()}`)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t("profile.noOrganization")}</p>
          )}

          {/* Invite section - only if user has membership */}
          {activeMembership && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-700 mb-3">{t("profile.inviteMembers")}</h3>
              <form onSubmit={handleSendInvite} className="space-y-3">
                <input
                  type="email"
                  placeholder={t("profile.inviteEmailPlaceholder")}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <div className="flex gap-2">
                  {/* Show role selector only for ADMIN/OWNER */}
                  {(activeMembership.role === "ADMIN" || activeMembership.role === "OWNER") && (
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="MEMBER">{t("profile.roleMember")}</option>
                      <option value="MANAGER">{t("profile.roleManager")}</option>
                      <option value="ADMIN">{t("profile.roleAdmin")}</option>
                    </select>
                  )}
                  <button
                    type="submit"
                    disabled={inviteSending}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {inviteSending ? t("profile.sending") : t("profile.sendInvite")}
                  </button>
                </div>
              </form>
              {inviteMsg && (
                <div className="mt-3">
                  <p className={`text-sm ${inviteMsg.ok ? "text-green-600" : "text-red-600"}`}>
                    {inviteMsg.text}
                  </p>
                  {inviteMsg.link && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs break-all">
                      <p className="text-gray-600 mb-1">{t("profile.inviteLink")}:</p>
                      <code className="text-indigo-600">{inviteMsg.link}</code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(inviteMsg.link!);
                        }}
                        className="ml-2 text-indigo-600 hover:text-indigo-800"
                      >
                        {t("profile.copyLink")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">{t("profile.terms")}</h2>
          <button
            type="button"
            // @ts-ignore
            popovertarget="profile-terms-popover"
            className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
          >
            {t("nav.terms")}
          </button>
        </div>
      </div>

      <TermsPopover id="profile-terms-popover" />
    </div>
  );
}
