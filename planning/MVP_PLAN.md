# Ting MVP Completion Plan

**Goal:** Complete a working multi-tenant tool lending platform MVP

**Last Updated:** March 21, 2026

---

## ✅ What's Already Done

### Backend (Server)

- ✅ Multi-tenant database schema (Organizations, Memberships, Groups)
- ✅ Organization middleware with role-based access control
- ✅ Full organizations API (create, manage, memberships, groups)
- ✅ Items, Categories, Loans, Reservations APIs with org context
- ✅ JWT authentication with bcrypt
- ✅ Email service (nodemailer, dev-mode logging)
- ✅ Email: due-soon reminder
- ✅ Email: overdue notice
- ✅ Email: reservation confirmed
- ✅ Email: reservation cancelled (by user)
- ✅ Email: item approval request (to admins)
- ✅ Email: item approved
- ✅ Email: item rejected
- ✅ Email: welcome on registration
- ✅ Email: checkout confirmation
- ✅ Email: checkin confirmation
- ✅ Email: org role changed
- ✅ Email: reservation cancelled by admin (method ready, not wired to route)
- ✅ Email: reservation reminder 1 day before (method ready, needs cron job)
- ✅ Audit logging system
- ✅ Test seed data for Oslo & Bergen organizations
- ✅ Image upload API with multer and sharp
- ✅ Image processing (resize, WebP conversion, thumbnails)
- ✅ Static file serving for uploads
- ✅ Organization-isolated image storage
- ✅ Locations model & API (org-scoped, name/address/description)
- ✅ Item manuals API (PDF, LINK, TEXT types) with cascade delete
- ✅ Item ownership fields (ownerId, ownerType: ORGANIZATION | MEMBER)
- ✅ Item approval flow (approvalStatus: PENDING | APPROVED | REJECTED, rejectionNote)
- ✅ Manual PDF upload endpoint

### Frontend (Client)

- ✅ OrganizationProvider & OrganizationContext
- ✅ OrganizationSwitcher component in navbar
- ✅ AuthProvider & AuthContext with membership support
- ✅ API client with organization header support
- ✅ i18n setup (English, Norwegian, Danish)
- ✅ LanguageSwitcher component
- ✅ Basic pages: Login, Register, Catalog, ItemDetail, Dashboard, AdminDashboard
- ✅ Responsive design with TailwindCSS
- ✅ ImageInput component (upload or URL modes)
- ✅ Image preview with upload progress
- ✅ Vite proxy configuration for image serving
- ✅ Register page with organization selection
- ✅ All pages scoped to active organization context
- ✅ Calendar components (ItemAvailabilityCalendar, DateRangePicker, AvailabilityTimeline)
- ✅ Calendar integrated into ItemDetail page
- ✅ Location selector in AddItem and EditItem forms
- ✅ Location display in ItemDetailsCard
- ✅ ItemManualsCard component (view/add/delete manuals: PDF upload, external link, text)
- ✅ Manuals card integrated into ItemDetail page
- ✅ Admin: location management (add, edit, delete locations)
- ✅ Admin: item approval/rejection flow with rejection notes
- ✅ Approval status badge on items in admin panel

### Testing

- ✅ E2E test suite written (auth, catalog, reservations, admin, i18n)
- ✅ Unit tests for auth routes and items routes

---

## 🎯 MVP Priorities

### Phase 1: Core Multi-Tenant Integration (CRITICAL)

**Goal:** Ensure all features work within organization context

#### 1.1 Update Registration Flow

- ✅ Add organization selection to Register page
- ✅ Update register API call to include `organizationId`
- ✅ Update seed data to match new flow

#### 1.2 Fix API Calls with Organization Context

- ✅ Audit all `apiClient` calls in components
- ✅ Ensure `organizationId` is passed via X-Organization-Id header
- ✅ Update Catalog, ItemDetail, Dashboard, AdminDashboard

#### 1.3 Organization Isolation Testing

- [ ] Verify items only show from active organization
- [ ] Verify reservations scoped to organization
- [ ] Verify loans scoped to organization
- [ ] Test switching between organizations works
- [ ] Ensure users can't access other org's data

#### 1.4 Fix E2E Tests

- [ ] Update tests to handle organization selection
- [ ] Add org context to test setup
- [ ] Fix failing category filter test
- [ ] Ensure all test specs pass

---

### Phase 2: Essential Features (HIGH PRIORITY)

#### 2.1 Item Management

- ✅ Image upload with optimization (resize, WebP, thumbnails, org-isolated)
- ✅ Location assignment (org-scoped locations, shown in item details)
- ✅ Item manuals (PDF upload, external links, text notes)
- ✅ Item ownership model (ORGANIZATION or MEMBER owned)
- ✅ Item approval workflow (PENDING → APPROVED / REJECTED)
- [ ] Ensure item creation includes categoryId validation
- [ ] Status transitions (AVAILABLE → CHECKED_OUT → MAINTENANCE → RETIRED)
- [ ] Item search works across name + description
- [ ] Show pending items to submitting member in their dashboard

#### 2.2 Reservation System

- [ ] Date conflict detection works correctly
- [ ] Reservation status flow (PENDING → CONFIRMED → COMPLETED → CANCELLED)
- [ ] Convert reservation to loan on checkout
- [ ] Cancel reservation flow in dashboard
- [ ] Block checkout if item has active reservation

#### 2.3 Calendar & Availability

- ✅ ItemAvailabilityCalendar component (month view, color-coded dates)
- ✅ DateRangePicker component with availability feedback
- ✅ AvailabilityTimeline component (60-day horizontal timeline)
- ✅ Calendar integrated into ItemDetail page
- [ ] ReservationCalendar for Dashboard (month/week view, click to view/cancel)
- [ ] Availability preview on catalog cards ("Available now" / "Next available: date")
- [ ] Mobile-responsive calendar design
- [ ] Translations for calendar UI (en, no, da)

#### 2.4 Loan Checkout/Check-in

- ✅ Checkout flow in AdminDashboard
- ✅ Check-in flow (return item, update status)
- ✅ Overdue loan highlighting
- [ ] Set due date based on organization policy (default: 7 days)
- [ ] Block checkout if item has active reservation

#### 2.5 User Dashboard

- ✅ Show user's active loans with due dates
- ✅ Show user's upcoming reservations
- ✅ Show overdue status prominently
- [ ] Show pending approval items submitted by the user
- [ ] Quick actions: extend loan, cancel reservation (only cancel implemented)
- [ ] Show membership info for active organization
- [ ] Calendar view tab (components built, not integrated)

---

### Phase 3: Admin Features (MEDIUM PRIORITY)

#### 3.1 Admin Dashboard Enhancements

- ✅ Stats cards: total items, active loans, overdue loans, members
- ✅ Item approval/rejection with rejection notes
- ✅ Location management (CRUD)
- [ ] Filter loans by status (active, returned, overdue)
- [ ] Filter items by category and status
- [ ] User management: view members, change roles

#### 3.2 Category Management

- ✅ Create/edit/delete categories (backend + UI)
- ✅ Move items between categories (via edit item form)
- [ ] Category hierarchy (optional for MVP)

#### 3.3 Organization Management (for OWNER/ADMIN)

- [ ] View/edit organization details
- [ ] Manage member groups (backend endpoints exist)
- [ ] Assign members to groups
- [ ] Invite new members (email-based)

---

### Phase 4: Polish & UX (NICE TO HAVE)

#### 4.1 i18n Coverage

- ✅ Translate image upload UI (en, no, da)
- ✅ Translate editItem page (en, no, da)
- ✅ Translate location fields (en, no, da)
- ✅ Translate manuals UI (en, no, da)
- ✅ Translate approval status UI (en, no, da)
- [ ] Translate all remaining pages to Norwegian and Danish
- [ ] Translate error messages
- [ ] Translate email templates

#### 4.2 Error Handling

- [ ] Graceful error messages for API failures
- [ ] Form validation with helpful messages
- [ ] Loading states on all async operations
- [ ] Toast notifications for success/error

#### 4.3 Mobile Responsiveness

- [ ] Test all pages on mobile viewport
- [ ] Ensure forms are usable on mobile
- [ ] Test organization switcher on mobile

#### 4.4 Performance

- [ ] Add pagination to catalog (page size: 20)
- [ ] Add pagination to admin tables
- [ ] Optimize database queries (indexes verified)
- [ ] Cache organization/category lists

---

## 📋 MVP Feature Checklist

### Must Have (P0)

- ✅ Multi-tenant architecture
- ✅ User registration with organization
- ✅ User login
- ✅ Organization switcher (for multi-org members)
- ✅ Browse items by organization
- ✅ Visual availability calendar for items
- ✅ View item details (with location, manuals)
- ✅ Reserve items (with conflict detection)
- ✅ User dashboard (my loans, my reservations)
- ✅ Admin: Checkout items
- ✅ Admin: Check-in items
- ✅ Admin: Add/edit/delete items (with location + manuals)
- ✅ Admin: View all loans
- ✅ Admin: Manage locations
- ✅ Admin: Approve/reject member-submitted items
- ✅ Data isolation between organizations

### Should Have (P1)

- [ ] Calendar view in user dashboard
- [ ] Availability timeline on catalog cards
- [ ] Show pending items to submitting member
- [ ] Email reminders (due tomorrow, overdue)
- [ ] Admin: Manage categories
- [ ] Admin: View users
- [ ] Search items by name
- [ ] Filter items by category
- [ ] Filter items by availability
- [ ] Mobile responsive design
- [ ] Multi-language support (en, no, da)

### Nice to Have (P2)

- ✅ Item images with upload
- ✅ Item manuals (PDF, link, text)
- ✅ Item locations
- ✅ Member-submitted items with approval workflow
- [ ] Admin: Promote users to MANAGER/ADMIN
- [ ] Member groups with permissions
- [ ] Extend loan duration
- [ ] Late fees calculation
- [ ] Export reports (CSV)
- [ ] Audit log viewer

---

## 🚀 Launch Checklist

### Functionality

- [ ] All P0 features working
- [ ] E2E test suite passing (>90%)
- [ ] No critical bugs in core flows
- [ ] Data isolation verified between orgs

### Code Quality

- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Environment variables documented
- [ ] Database migrations run cleanly

### Documentation

- [ ] README updated with multi-tenant setup
- [ ] API endpoints documented
- [ ] User guide for members
- [ ] Admin guide for organization owners

### Deployment Ready

- [ ] Production build works
- [ ] Environment variables configured
- [ ] Database backup strategy
- [ ] Email SMTP configured (or noted as optional)

---

## 📊 Progress

```
Phase 1 (Critical):  ▓▓▓▓▓▓░░░░  60% - Infrastructure done, org isolation testing needed
Phase 2 (High):      ▓▓▓▓▓░░░░░  50% - Calendar + manuals + locations done, reservations need work
Phase 3 (Medium):    ▓▓▓░░░░░░░  30% - Locations + approval done, filters + user mgmt needed
Phase 4 (Nice):      ▓▓░░░░░░░░  20% - i18n setup + key translations done
```

**Overall MVP Completion: ~45%**

**Estimated Time to MVP:** 8-12 hours of focused development

---

## 🐛 Known Issues

1. **Category filter E2E test failing** - Multi-tenant context issue
2. **Email service** - Only logs to console in dev mode
3. **Prisma client sync** - Regenerate after schema changes

---

## 🎯 Success Criteria

The MVP is complete when:

1. ✅ Users can register and join an organization
2. ✅ Users can browse items within their organization
3. ✅ Users can view item location and manuals
4. ✅ Users can see item availability on a visual calendar
5. ✅ Users can reserve items with conflict detection
6. ✅ Admins can checkout/checkin items
7. ✅ Admins can manage items, categories, and locations
8. ✅ Admins can approve/reject member-submitted items
9. ✅ Organizations have complete data isolation
10. [ ] E2E tests pass for core flows
11. [ ] Application works on mobile devices
12. [ ] No critical TypeScript/runtime errors
13. [ ] Basic deployment documentation exists

---

## 🎨 Future Enhancements (Post-MVP)

### V1.1 - Enhanced Tools

- ✅ Photo upload with image optimization (COMPLETED)
- ✅ Item manuals (PDF/link/text) (COMPLETED)
- ✅ Location management (COMPLETED)
- QR code generation for items
- Barcode scanning for quick checkout
- Item maintenance history
- Damage reporting

### V1.2 - Better Admin

- Bulk item import (CSV)
- Custom loan duration by category
- Blackout dates (holidays, events)
- Waiting list for popular items
- Usage analytics & reports

### V1.3 - Member Features

- Favorite items
- Reservation calendar view
- Mobile app (React Native)
- Push notifications
- Member ratings/reviews

### V1.4 - Organization Features

- Sub-organizations / locations
- Inter-org lending (federated)
- Membership tiers (paid plans)
- Custom branding per org
- Advanced permissions system
