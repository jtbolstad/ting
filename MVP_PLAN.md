# Ting MVP Completion Plan

**Goal:** Complete a working multi-tenant tool lending platform MVP

**Last Updated:** March 15, 2026

---

## ✅ What's Already Done

### Backend (Server)

- ✅ Multi-tenant database schema (Organizations, Memberships, Groups)
- ✅ Organization middleware with role-based access control
- ✅ Full organizations API (create, manage, memberships, groups)
- ✅ Items, Categories, Loans, Reservations APIs with org context
- ✅ JWT authentication with bcrypt
- ✅ Email reminder service
- ✅ Audit logging system
- ✅ Test seed data for Oslo & Bergen organizations
- ✅ Image upload API with multer and sharp
- ✅ Image processing (resize, WebP conversion, thumbnails)
- ✅ Static file serving for uploads
- ✅ Organization-isolated image storage

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

### Testing

- ✅ E2E test suite written (auth, catalog, reservations, admin, i18n)
- ✅ Unit tests for auth routes and items routes

---

## 🎯 MVP Priorities

### Phase 1: Core Multi-Tenant Integration (CRITICAL)

**Goal:** Ensure all features work within organization context

#### 1.1 Update Registration Flow

- ✅ Add organization selection to Register page
  - Show list of public organizations
  - Or allow creating a new organization
  - Default: join existing organization as MEMBER
- ✅ Update register API call to include `organizationId`
- ✅ Update seed data to match new flow

#### 1.2 Fix API Calls with Organization Context

- ✅ Audit all `apiClient` calls in components
- ✅ Ensure `organizationId` is passed where required (via X-Organization-Id header)
- ✅ Update Catalog page to use active organization
- ✅ Update ItemDetail page to use active organization
- ✅ Update Dashboard to filter by active organization
- ✅ Update AdminDashboard to scope by active organization

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

- ✅ Image upload functionality with optimization
  - Users can upload images or provide external URLs
  - Automatic resize to max 1200px width
  - WebP conversion for better performance
  - Thumbnail generation (300px)
  - Organization-isolated storage
  - 10MB max file size
- [ ] Ensure item creation includes categoryId validation
- [ ] Status transitions (AVAILABLE → CHECKED_OUT → MAINTENANCE → RETIRED)
- [ ] Item search works across name + description

#### 2.2 Reservation System

- [ ] Date conflict detection works correctly
- [ ] Reservation status flow (PENDING → CONFIRMED → COMPLETED → CANCELLED)
- [ ] Convert reservation to loan on checkout
- [ ] Cancel reservation flow in dashboard

#### 2.3 Calendar & Availability (HIGH PRIORITY - NEW)

**See detailed spec:** [CALENDAR_SPEC.md](CALENDAR_SPEC.md)

- ✅ Install calendar dependencies (react-big-calendar, date-fns, react-day-picker)
- ✅ Create `ItemAvailabilityCalendar` component
  - Visual month view showing available/blocked dates
  - Fetch and display existing reservations + active loans
  - Color-code: available (green), reserved (amber), checked out (red)
- ✅ Create `DateRangePicker` component
  - Replace basic date inputs with calendar picker
  - Show availability feedback in real-time
  - Prevent selecting blocked dates
- ✅ Create `AvailabilityTimeline` component
  - Horizontal timeline (60 days ahead)
  - Show upcoming reservations/loans as blocks
  - Compact version for catalog cards
- ✅ Integrate calendar into ItemDetail page
  - Add availability calendar above reservation form
  - ~~Use DateRangePicker for date selection~~ (using basic inputs + calendar for now)
  - Show conflicts with helpful messages
- [ ] Create `ReservationCalendar` for Dashboard
  - Month/week view of user's reservations
  - Click events to view/cancel
  - Toggle between list and calendar view
- [ ] Add availability preview to Catalog
  - Show "Available now" vs "Next available: [date]"
  - Optional: compact timeline on item cards
- [ ] Mobile-responsive calendar design
- [ ] Translations for calendar UI (en, no, da)

**Estimated time remaining:** 4-5 hours

#### 2.4 Loan Checkout/Check-in

- ✅ Checkout flow in AdminDashboard
- [ ] Set due date based on organization policy (default: 7 days) - _Manual date entry only_
- ✅ Check-in flow (return item, update status)
- ✅ Overdue loan highlighting
- [ ] Block checkout if item has active reservation

#### 2.5 User Dashboard

- ✅ Show user's active loans with due dates
- ✅ Show user's upcoming reservations
- ✅ Show overdue status prominently
- [ ] Quick actions: extend loan, cancel reservation - _Only cancel implemented_
- [ ] Show membership info for active organization
- [ ] Calendar view tab (from 2.3) - _Components built, not integrated_

---

### Phase 3: Admin Features (MEDIUM PRIORITY)

#### 3.1 Admin Dashboard Enhancements

- ✅ Stats cards: total items, active loans, overdue loans, members - _Missing member count_
- [ ] Filter loans by status (active, returned, overdue)
- [ ] Filter items by category and status
- [ ] User management: view members, change roles - _Users tab exists, role change endpoint exists_
- ✅ Quick checkout from admin panel

#### 3.2 Category Management

- ✅ Create/edit/delete categories - _Backend endpoints complete_
- ✅ Move items between categories - _Via edit item form_
- [ ] Category hierarchy (optional for MVP)

#### 3.3 Organization Management (for OWNER/ADMIN)

- [ ] View/edit organization details
- [ ] Manage member groups - _Backend endpoints exist_
- [ ] Assign members to groups
- [ ] Invite new members (email-based)

---

### Phase 4: Polish & UX (NICE TO HAVE)

#### 4.1 i18n Coverage

- ✅ Translate image upload UI (en, no, da)
- ✅ Translate editItem page (en, no, da)
- [ ] Translate all remaining pages to Norwegian and Danish
- [ ] Translate error messages
- [ ] Translate email templates
- [ ] Test language switching across all pages

#### 4.2 Error Handling

- [ ] Graceful error messages for API failures
- [ ] Form validation with helpful messages
- [ ] Loading states on all async operations
- [ ] Toast notifications for success/error

#### 4.3 Mobile Responsiveness

- [ ] Test all pages on mobile viewport
- [ ] Ensure forms are usable on mobile
- [ ] Test organization switcher on mobile
- [ ] Fix any layout issues

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
- ✅ **Visual availability calendar for items** ⭐ NEW
- [ ] **Calendar-based date picker for reservations** ⭐ NEW (component built, needs integration)
- ✅ View item details
- ✅ Reserve items (with conflict detection)
- ✅ User dashboard (my loans, my reservations)
- [ ] Admin: Checkout items
- [ ] Admin: Check-in items
- ✅ Admin: Add/edit/delete items
- [ ] Admin: View all loans
- ✅ Data isolation between organizations

### Should Have (P1)

- [ ] **Calendar view in user dashboard** ⭐ NEW
- [ ] **Availability timeline on catalog cards** ⭐ NEW
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
- [ ] Admin: Promote users to MANAGER/ADMIN
- [ ] Member groups with permissions
- [ ] Reservation approval workflow
- [ ] Extend loan duration
- [ ] Late fees calculation
- [ ] Export reports (CSV)
- [ ] Audit log viewer

---

## 🚀 Launch Checklist

Before declaring MVP complete:

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

## 🎨 Future Enhancements (Post-MVP)

### V1.1 - Enhanced Tools

- ✅ Photo upload for items with image optimization (COMPLETED - moved to MVP)
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

---

## 🐛 Known Issues to Fix

1. **Prisma client sync** - Need to regenerate after stopping dev servers
2. **Category filter test failing** - Multi-tenant context issue in e2e
3. ~~**Register flow** - Needs organization selection UI~~ ✅ FIXED
4. ~~**API client** - Some calls missing organizationId parameter~~ ✅ FIXED (uses header)
5. **Email service** - Only logs to console in dev mode

### Next Steps

#### Option A: Complete Multi-tenant Testing (1-2 hours)

1. ~~**Fix Registration**~~ ✅ DONE
2. ~~**Fix Catalog**~~ ✅ DONE
3. **Fix E2E Tests** (45 min)
   - Add org context to test setup
   - Update selectors for multi-org UI
4. **Test Data Isolation** (30 min)
   - Login as user in Oslo
   - Verify only Oslo items show
   - Switch to Bergen, verify Bergen items

### Option B: Calendar Features (3-4 hours) ⭐ HIGH UX IMPACT

1. **Install Dependencies** (5 min)
   - `pnpm add react-big-calendar date-fns react-day-picker`
2. **Build ItemAvailabilityCalendar** (90 min)
   - Create component with month view
   - Fetch item reservations and loans
   - Color-code available/unavailable dates
   - Add legend and current░░░░░░░ 30% - Core features built, calendar + org context needed
     Phase 3 (Medium): ▓▓░░░░░░░░ 20% - Admin UI exists, needs org scoping
     Phase 4 (Nice): ▓░░░░░░░░░ 10% - i18n setup, needs translations

```

**Overall MVP Completion: ~30%**

**Estimated Time to MVP:** 19-23 hours of focused development
  - Core multi-tenant integration: 8-12 hours
  - Calendar features: 11 hours (see CALENDAR_SPEC.md)
   - Block unavailable dates
5. **Mobile Responsive** (30 min)
   - Test on mobile viewport
   - Adjust layout for small screens

**Recommendation:** Start with Option B for immediate user value, then do Option A
   - Verify only Oslo items show
   - Switch to Bergen, verify Bergen items

**Tot**Users can see item availability on a visual calendar** ⭐ NEW
4. ✅ **Users can select dates using calendar picker** ⭐ NEW
5. ✅ Users can reserve items with conflict detection
6. ✅ **Users can view their reservations in calendar format** ⭐ NEW
7. ✅ Admins can checkout/checkin items
8. ✅ Admins can manage items and categories
9. ✅ Organizations have complete data isolation
10. ✅ E2E tests pass for core flows
11. ✅ Application works on mobile devices
12. ✅ No critical TypeScript/runtime errors
13ase 1 (Critical):     ▓▓▓▓▓▓░░░░  60% - Infrastructure done, integration needed
Phase 2 (High):         ▓▓▓▓░░░░░░  40% - Core features built, org context needed
Phase 3 (Medium):       ▓▓░░░░░░░░  20% - Admin UI exists, needs org scoping
Phase 4 (Nice):         ▓░░░░░░░░░  10% - i18n setup, needs translations
```

**Overall MVP Completion: ~32%**

**Estimated Time to MVP:** 8-12 hours of focused development

---

## 🎯 Success Criteria

The MVP is complete when:

1. ✅ Users can register and join an organization
2. ✅ Users can browse items within their organization
3. ✅ Users can reserve items with conflict detection
4. ✅ Admins can checkout/checkin items
5. ✅ Admins can manage items and categories
6. ✅ Organizations have complete data isolation
7. ✅ E2E tests pass for core flows
8. ✅ Application works on mobile devices
9. ✅ No critical TypeScript/runtime errors
10. ✅ Basic deployment documentation exists
