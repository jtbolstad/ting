# Ting - Product Requirements Document

**Version:** 1.0  
**Last Updated:** April 26, 2026

---

## 1. Product Overview

**Ting** is a multi-tenant tool lending platform that enables organizations to manage shared equipment, coordinate borrowing, and track inventory. The platform supports three user types with distinct permissions and workflows.

### Implementation Status Summary

**Use Case Coverage:** 23 of 24 use cases implemented (96%)

| Status | Count | Use Cases |
|--------|-------|-----------|
| ✅ Implemented | 23 | All core workflows functional |
| 🟡 Partial | 1 | UC-OA-04 (groups created, member assignment pending) |
| ❌ Not Started | 0 | - |

**Latest Update:** April 26, 2026 - Phase 3 complete (organization management, groups, invitations, waiting room)

---

### Core Value Proposition

- **For Members:** Easy access to shared tools without ownership burden
- **For Organizations:** Efficient resource management and utilization tracking
- **For Platform:** Scalable multi-tenant architecture supporting diverse use cases

---

## 2. User Types & Roles

### 2.1 Platform Administrator (ADMIN)

**System-level access across all organizations.**

**Capabilities:**
- Manage all organizations
- View/edit users across platform
- Assign users to organizations
- Access waiting room (unassigned users)
- Monitor email logs
- View audit logs across platform
- Delete organizations
- Promote users to platform admin

**Restrictions:**
- Cannot directly manage organization-specific content (items, loans, etc.)
- Must switch to organization context for member-level actions

---

### 2.2 Organization Roles

#### Owner (OWNER)
**Full control over organization.**

**Capabilities:**
- All ADMIN capabilities (below)
- Edit organization settings (name, description, loan duration policy)
- Delete organization
- Transfer ownership
- Cannot be demoted by other admins

#### Administrator (ADMIN)
**Manage organization operations and members.**

**Capabilities:**
- Manage members (add, remove, change roles)
- Manage groups (create, edit, delete, assign members)
- Send member invitations
- Approve/reject member-submitted items
- Manage categories (create, edit, delete)
- Manage locations (create, edit, delete)
- Manage all items (create, edit, delete, set status)
- View/edit all reservations
- Checkout/checkin items
- View all loans and mark returned
- Reset member passwords
- View organization audit log

**Restrictions:**
- Cannot edit organization settings
- Cannot change owner role
- Cannot delete organization

#### Manager (MANAGER)
**Coordinate day-to-day operations.**

**Capabilities:**
- View member list
- View groups and membership
- View pending reservations
- View all items and loans
- Search and filter inventory

**Restrictions:**
- Cannot manage members or groups
- Cannot approve items or manage categories
- Cannot checkout/checkin items
- Read-only access to most data

#### Member (MEMBER)
**Basic borrowing and contribution.**

**Capabilities:**
- Browse item catalog (with filters by category, status, location)
- View item details (photos, manuals, availability calendar)
- Reserve items (with conflict detection)
- View own reservations and cancel
- View own active loans
- Request loan extension
- Submit items for approval
- View own pending items
- Change own password
- Switch between organizations (if member of multiple)

**Restrictions:**
- Cannot approve own submitted items
- Cannot checkout items directly
- Cannot manage organization settings
- Cannot view other members' loans

---

## 3. Use Cases by Role

### 3.1 Platform Administrator Use Cases

#### UC-PA-01: Manage Waiting Room
**Status:** ✅ **Implemented**  
**Actor:** Platform Admin  
**Precondition:** Users registered without organization  
**Flow:**
1. Navigate to Admin Overview → Waiting Room tab
2. View list of users without organization membership
3. For each user, select organization and role
4. Click "Assign to Organization"
5. User receives membership and can access catalog

**Postcondition:** User has active membership in selected organization

---

#### UC-PA-02: Create New Organization
**Status:** ✅ **Implemented**  
**Actor:** Platform Admin  
**Precondition:** Logged in as platform admin  
**Flow:**
1. Navigate to Admin Overview → Organizations tab
2. Click "Create Organization"
3. Enter name, slug, description, type
4. Submit form
5. Organization created with admin as first owner

**Postcondition:** New organization exists and is accessible

---

#### UC-PA-03: Monitor Platform Activity
**Status:** ✅ **Implemented**  
**Actor:** Platform Admin  
**Precondition:** Logged in as platform admin  
**Flow:**
1. Navigate to Admin Overview
2. View stats: total organizations, users, items
3. Switch to Users tab to see all platform users
4. Switch to Email Log tab to monitor email delivery
5. Review failed emails and investigate issues

**Postcondition:** Platform health monitored

---

#### UC-PA-04: Reassign User Between Organizations
**Status:** ✅ **Implemented**  
**Actor:** Platform Admin  
**Precondition:** User has membership in organization A  
**Flow:**
1. Navigate to Admin Overview → Users tab
2. Find user and click Edit
3. Remove membership from organization A
4. Add membership to organization B with selected role
5. Save changes

**Postcondition:** User membership transferred

---

### 3.2 Organization Administrator Use Cases

#### UC-OA-01: Invite New Member
**Status:** ✅ **Implemented**  
**Actor:** Organization Admin/Owner  
**Precondition:** Logged into organization  
**Flow:**
1. Navigate to Admin Dashboard → Users tab
2. Click "Invite Member" in invitations section
3. Enter email address and select role (MEMBER/MANAGER/ADMIN)
4. Click "Send Invitation"
5. Invitation link generated
6. Copy link and share with invitee via email/message

**Postcondition:** Invitation created, invitee can register and join org

---

#### UC-OA-02: Approve Member-Submitted Item
**Status:** ✅ **Implemented**  
**Actor:** Organization Admin  
**Precondition:** Member submitted item for approval  
**Flow:**
1. Navigate to Admin Dashboard → Items tab
2. Filter by approval status: PENDING
3. Review item details (name, description, category, photos)
4. Click "Approve" or "Reject"
5. If rejecting, enter reason
6. Item status updated

**Postcondition:** Item approved (visible in catalog) or rejected (owner notified)

---

#### UC-OA-03: Checkout Item to Member
**Status:** ✅ **Implemented**  
**Actor:** Organization Admin  
**Precondition:** Item available, member active  
**Flow:**
1. Navigate to Admin Dashboard → Loans tab
2. Click "Checkout Item"
3. Select item from dropdown
4. Select member from dropdown
5. Set due date (defaults to org loan duration policy)
6. Submit checkout
7. System checks for active reservations (blocks if found)

**Postcondition:** Loan created, item status → CHECKED_OUT, member notified

---

#### UC-OA-04: Manage Member Groups
**Status:** 🟡 **Partial** (CRUD done, member assignment pending)  
**Actor:** Organization Admin/Owner  
**Precondition:** Logged into organization  
**Flow:**
1. Navigate to Admin Dashboard → Groups tab
2. Click "Add Group"
3. Enter name and description
4. Submit to create group
5. Later: assign members to groups (future feature)

**Postcondition:** Group created and available for member assignment

---

#### UC-OA-05: Configure Organization Settings
**Status:** ✅ **Implemented**  
**Actor:** Organization Owner/Admin  
**Precondition:** Owner or Admin role  
**Flow:**
1. Navigate to Admin Dashboard → Organization tab
2. Edit organization name (appears in UI)
3. Edit description (shown to members)
4. Set default loan duration (days)
5. Click "Save Settings"

**Postcondition:** Organization settings updated for all members

---

#### UC-OA-06: Manage Locations
**Status:** ✅ **Implemented**  
**Actor:** Organization Admin  
**Precondition:** Logged into organization  
**Flow:**
1. Navigate to Admin Dashboard → Locations tab
2. Click "Add Location"
3. Enter name, address, description
4. Submit location
5. Location now available for item assignment

**Postcondition:** Location exists and can be assigned to items

---

#### UC-OA-07: Check In Returned Item
**Status:** ✅ **Implemented**  
**Actor:** Organization Admin  
**Precondition:** Item checked out  
**Flow:**
1. Navigate to Admin Dashboard → Loans tab
2. Find active loan
3. Click "Checkin"
4. Optionally note damage or condition
5. Confirm checkin

**Postcondition:** Loan marked returned, item status → AVAILABLE

---

#### UC-OA-08: Reset Member Password
**Status:** ✅ **Implemented**  
**Actor:** Organization Admin/Owner  
**Precondition:** Member requests password reset  
**Flow:**
1. Navigate to Admin Dashboard → Users tab
2. Find member in list
3. Click "Reset Password"
4. Enter new password (min 6 characters)
5. Confirm action
6. Member can now login with new password

**Postcondition:** Member password updated

**Note:** Cannot reset owner password unless requester is owner

---

### 3.3 Member Use Cases

#### UC-M-01: Browse Item Catalog
**Status:** ✅ **Implemented**  
**Actor:** Member  
**Precondition:** Logged in, has organization membership  
**Flow:**
1. Navigate to Catalog page
2. View all items in current organization
3. Filter by category (dropdown)
4. Search by name/description (text input)
5. See availability preview on each card
6. Click item to view details

**Postcondition:** Member finds desired item

---

#### UC-M-02: Reserve Item
**Status:** ✅ **Implemented**  
**Actor:** Member  
**Precondition:** Item available during desired dates  
**Flow:**
1. Navigate to item detail page
2. View availability calendar
3. Select start and end date using date picker
4. System checks for conflicts (existing reservations/loans)
5. If no conflict, click "Reserve"
6. Reservation created with status PENDING

**Postcondition:** Reservation created, member notified, blocks item during dates

---

#### UC-M-03: View Availability Calendar
**Status:** ✅ **Implemented**  
**Actor:** Member  
**Precondition:** Viewing item detail  
**Flow:**
1. See month calendar view below item details
2. Dates color-coded:
   - Grey: Reserved by others
   - Red: Item currently checked out
   - Green: Available
3. See 60-day timeline view for quick overview
4. Select available date range for reservation

**Postcondition:** Member understands item availability

---

#### UC-M-04: Cancel Own Reservation
**Status:** ✅ **Implemented**  
**Actor:** Member  
**Precondition:** Has active reservation  
**Flow:**
1. Navigate to Dashboard → Reservations tab
2. View list of own reservations
3. Find reservation to cancel
4. Click "Cancel"
5. Confirm cancellation
6. Reservation status → CANCELLED

**Postcondition:** Reservation cancelled, dates freed up

---

#### UC-M-05: Request Loan Extension
**Status:** ✅ **Implemented**  
**Actor:** Member  
**Precondition:** Has active loan  
**Flow:**
1. Navigate to Dashboard → My Loans tab
2. Find active loan
3. Click "Extend"
4. Enter number of days (1-30)
5. Submit request
6. Due date updated

**Postcondition:** Loan due date extended

**Note:** Future: may require admin approval for extensions

---

#### UC-M-06: Submit Item for Approval
**Status:** ✅ **Implemented**  
**Actor:** Member  
**Precondition:** Logged in, wants to contribute item  
**Flow:**
1. Navigate to Add Item page
2. Fill form:
   - Name, description, category
   - Upload photo (optional)
   - Select location (optional)
   - Add manual (PDF/link/text, optional)
3. Submit item
4. Item created with approvalStatus: PENDING
5. Admin receives notification

**Postcondition:** Item pending admin approval

---

#### UC-M-07: View Own Pending Items
**Status:** ✅ **Implemented**  
**Actor:** Member  
**Precondition:** Submitted items awaiting approval  
**Flow:**
1. Navigate to Dashboard → Pending Items tab
2. See list of own submitted items
3. View approval status (PENDING/APPROVED/REJECTED)
4. If rejected, see rejection reason

**Postcondition:** Member aware of submission status

---

#### UC-M-08: Switch Organizations
**Status:** ✅ **Implemented**  
**Actor:** Member  
**Precondition:** Member of multiple organizations  
**Flow:**
1. Click organization selector in navbar
2. View list of organizations with memberships
3. Click desired organization
4. App refreshes with new organization context
5. Catalog, dashboard, and admin panel (if applicable) switch to new org

**Postcondition:** Active organization changed

---

#### UC-M-09: View Dashboard Summary
**Status:** ✅ **Implemented**  
**Actor:** Member  
**Precondition:** Logged in  
**Flow:**
1. Navigate to Dashboard
2. View tabs:
   - My Loans: active loans with due dates, overdue highlighted
   - Reservations: upcoming reservations with dates
   - Pending Items: own submitted items awaiting approval
   - Calendar: visual calendar of own reservations
3. Quick actions available (extend loan, cancel reservation)

**Postcondition:** Member has overview of all activity

---

#### UC-M-10: Change Own Password
**Status:** ✅ **Implemented**  
**Actor:** Member  
**Precondition:** Logged in  
**Flow:**
1. Navigate to Profile page
2. Click "Change Password" button
3. Enter current password
4. Enter new password (min 6 characters)
5. Confirm new password
6. Submit form
7. Password updated

**Postcondition:** Member password changed

---

## 4. Key Workflows

### 4.1 New User Onboarding

**Scenario A: Public Registration**
1. User visits registration page
2. Enters email, password, name
3. Accepts terms of service
4. Submits registration
5. User created with no organization
6. Enters "waiting room"
7. Platform admin assigns to organization
8. User receives membership and can access catalog

**Scenario B: Invitation-Based Registration**
1. Admin sends invitation link via email
2. Invitee clicks link (/invite/:token)
3. If not registered: redirected to registration
4. If already registered and logged in: auto-accepts invitation
5. Membership created with specified role
6. User can immediately access organization catalog

---

### 4.2 Item Lifecycle

```
1. Member submits item → approvalStatus: PENDING
2. Admin reviews → approvalStatus: APPROVED or REJECTED
3. If approved: item appears in catalog with status: AVAILABLE
4. Member reserves item → reservation: PENDING → CONFIRMED
5. Admin checks out item → status: CHECKED_OUT, loan created
6. Member uses item during loan period
7. Admin checks in item → status: AVAILABLE, loan marked returned
8. Repeat from step 4
```

**Status Values:**
- AVAILABLE: Can be reserved/checked out
- CHECKED_OUT: Currently on loan
- MAINTENANCE: Unavailable, being repaired
- RETIRED: Removed from circulation

**Approval Status Values:**
- PENDING: Awaiting admin review
- APPROVED: Visible in catalog
- REJECTED: Not approved, member notified with reason

---

### 4.3 Reservation Flow

```
1. Member selects dates on calendar
2. System checks for conflicts:
   - Active loans during selected dates
   - Other confirmed/pending reservations overlapping
3. If conflict: show error, suggest alternative dates
4. If no conflict: create reservation with status: PENDING
5. Reservation blocks dates on calendar
6. Admin confirms reservation (optional step)
7. When checkout time arrives:
   - Admin checks out item
   - Reservation status → COMPLETED
   - If checkout doesn't happen:
     - Reservation expires after end date
     - Status → CANCELLED
```

**Reservation Cancellation:**
- Member can cancel own reservation anytime before checkout
- Admin can cancel any reservation with reason
- Cancellation frees up dates immediately

---

### 4.4 Multi-Tenant Organization Switching

**Context Management:**
1. User logs in → sees all organizations they're member of
2. Selects active organization from navbar dropdown
3. All data filtered by active organization:
   - Catalog shows only current org's items
   - Dashboard shows only current org's loans/reservations
   - Admin panel (if applicable) manages only current org
4. User switches organization → context changes
5. If org admin in multiple orgs → can manage each separately

**Data Isolation:**
- Items belong to single organization
- Loans/reservations scoped to organization
- Categories scoped to organization
- Members can belong to multiple organizations
- No cross-org borrowing (future enhancement)

---

## 5. Security & Permissions

### 5.1 Permission Matrix

| Feature | Member | Manager | Admin | Owner | Platform Admin |
|---------|--------|---------|-------|-------|----------------|
| View catalog | ✓ | ✓ | ✓ | ✓ | ✓* |
| Reserve items | ✓ | ✓ | ✓ | ✓ | ✓* |
| Submit items | ✓ | ✓ | ✓ | ✓ | ✓* |
| View all members | - | ✓ | ✓ | ✓ | ✓** |
| Manage members | - | - | ✓ | ✓ | ✓** |
| Approve items | - | - | ✓ | ✓ | - |
| Checkout/checkin | - | - | ✓ | ✓ | - |
| Manage categories | - | - | ✓ | ✓ | - |
| Manage locations | - | - | ✓ | ✓ | - |
| Manage groups | - | - | ✓ | ✓ | - |
| Send invitations | - | - | ✓ | ✓ | - |
| Reset passwords | - | - | ✓ | ✓ | - |
| Edit org settings | - | - | - | ✓ | - |
| Delete organization | - | - | - | ✓ | ✓** |
| View waiting room | - | - | - | - | ✓ |
| Manage all orgs | - | - | - | - | ✓ |

\* Within organization context  
\*\* Platform-wide access

---

### 5.2 Permission Rules

1. **Role Hierarchy:**
   - Platform Admin > Owner > Admin > Manager > Member
   - Higher roles inherit lower role permissions (within org)

2. **Protection Rules:**
   - Owner role cannot be changed by non-owner admins
   - Owner password cannot be reset by non-owner admins
   - Platform admin cannot be demoted by org admins

3. **Context Rules:**
   - All organization-scoped actions require active org membership
   - Cross-org actions prohibited without explicit membership
   - Platform admin must switch to org context for member actions

4. **Self-Service Rules:**
   - Members can always change own password
   - Members can cancel own reservations
   - Members can view own pending items
   - Members cannot approve own submitted items

---

## 6. Data Privacy & Compliance

### 6.1 Data Visibility

**Member Data:**
- Name and email visible to org admins
- Loan history visible to org admins
- Personal reservations visible only to member and admins

**Organization Data:**
- Name and description public (for invitations)
- Internal data (loans, members) visible only within org
- Audit logs visible only to org admins and platform admins

**Platform Data:**
- Platform admin can view aggregate stats
- Platform admin can view email logs (debugging)
- Platform admin cannot view member passwords

---

### 6.2 Data Retention

**User-Generated Content:**
- Items persist after member leaves (org owns items)
- Reservations archived after completion
- Loans archived after return
- Audit logs retained indefinitely

**User Accounts:**
- Inactive accounts not auto-deleted
- User can leave organization (membership deleted)
- User account persists for other organizations

---

## 7. Future Enhancements

### Phase 2 Features (Not in MVP)

1. **Advanced Reservations:**
   - Admin approval required for certain items
   - Recurring reservations
   - Waiting list for popular items

2. **Enhanced Groups:**
   - Group-based permissions
   - Restrict items to specific groups
   - Group-level loan limits

3. **Analytics & Reporting:**
   - Utilization metrics per item
   - Popular items dashboard
   - Member activity reports
   - CSV export

4. **Notifications:**
   - Push notifications for due dates
   - SMS reminders
   - Reservation confirmation via email

5. **Inter-Organization Features:**
   - Federated lending between orgs
   - Cross-org item search
   - Shared item pools

6. **Mobile App:**
   - React Native app
   - QR code scanning for quick checkout
   - Barcode generation for items

7. **Advanced Item Management:**
   - Maintenance scheduling
   - Damage reporting workflow
   - Item condition tracking over time
   - Photo galleries (multiple images)

---

## 8. Technical Constraints

### 8.1 Performance Requirements

- Catalog page load: < 2 seconds
- Item search results: < 1 second
- Reservation conflict check: < 500ms
- Organization switch: < 1 second

### 8.2 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 8.3 Mobile Responsiveness

- All pages must work on mobile (320px+ width)
- Touch-friendly UI elements
- Calendar optimized for mobile gestures

---

## 9. Success Metrics

### 9.1 Adoption Metrics

- Number of active organizations
- Number of registered users
- Average items per organization
- Average members per organization

### 9.2 Engagement Metrics

- Loans per month
- Reservations per month
- Item utilization rate (% of time checked out)
- Average loan duration

### 9.3 Quality Metrics

- Reservation conflict rate (should be < 1%)
- Failed email delivery rate (should be < 2%)
- Overdue loan rate
- Time from item submission to approval (target: < 24 hours)

---

## 10. Glossary

**Active Membership:** A membership with status "ACTIVE" in an organization  
**Approval Status:** State of member-submitted item (PENDING/APPROVED/REJECTED)  
**Catalog:** Browsable list of all approved items in organization  
**Checkout:** Admin action to loan item to member  
**Checkin:** Admin action to return item from member  
**Default Membership:** First or preferred organization for multi-org members  
**Item Status:** State of item in system (AVAILABLE/CHECKED_OUT/MAINTENANCE/RETIRED)  
**Loan:** Active borrowing period with checkout date, due date, and borrower  
**Member Group:** Collection of members within organization (future: for permissions)  
**Organization Context:** Currently selected organization determining data visibility  
**Platform Admin:** System administrator with access to all organizations  
**Reservation:** Advance booking of item for future dates  
**Waiting Room:** List of registered users without organization membership  
**Organization Owner:** Member with highest permissions, set at org creation

---

**Document Status:** Living document, updated as product evolves  
**Next Review:** Q3 2026
