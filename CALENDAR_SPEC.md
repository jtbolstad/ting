# Calendar & Availability Features Specification

**Goal:** Add visual calendar interface for reservations and display item availability

**Priority:** HIGH (Essential for good UX)

---

## 📅 Features Overview

### 1. Item Availability Calendar

Show when items are available/unavailable on their detail pages

### 2. Reservation Calendar View

Visual calendar in dashboard showing user's reservations

### 3. Calendar-based Booking

Interactive calendar for selecting reservation dates

### 4. Availability Timeline

Show upcoming reservations and loans for each item

---

## 🎨 UI Components to Build

### Component 1: `ItemAvailabilityCalendar`

**Location:** `packages/client/src/components/ItemAvailabilityCalendar.tsx`

**Purpose:** Show item availability on ItemDetail page

**Features:**

- Month view calendar
- Highlight unavailable dates (reserved or checked out)
- Show current date
- Click date to start reservation
- Legend: Available (green), Reserved (yellow), Checked Out (red), Past (gray)

**Props:**

```typescript
interface ItemAvailabilityCalendarProps {
  itemId: string;
  onDateSelect?: (startDate: Date, endDate: Date) => void;
  selectedStart?: Date;
  selectedEnd?: Date;
}
```

**Data Source:**

- Fetch from: `GET /api/reservations?itemId={itemId}`
- Fetch from: `GET /api/loans?itemId={itemId}&active=true`
- Combine to build blocked date ranges

---

### Component 2: `ReservationCalendar`

**Location:** `packages/client/src/components/ReservationCalendar.tsx`

**Purpose:** Show user's reservations in calendar format

**Features:**

- Month/week/day views
- Show reservation events with item names
- Color code by status (pending, confirmed, completed)
- Click event to view/edit reservation
- Navigate between months

**Props:**

```typescript
interface ReservationCalendarProps {
  userId?: string; // Admin can view any user
  organizationId: string;
  view?: "month" | "week" | "day";
  onEventClick?: (reservation: Reservation) => void;
}
```

**Data Source:**

- Fetch from: `GET /api/reservations` (filtered by user)
- Transform to calendar events

---

### Component 3: `DateRangePicker`

**Location:** `packages/client/src/components/DateRangePicker.tsx`

**Purpose:** Enhanced date selection with availability preview

**Features:**

- Two-month side-by-side view
- Select start and end dates
- Visual feedback for unavailable dates
- Show conflicts inline
- Quick presets: "3 days", "1 week", "2 weeks"

**Props:**

```typescript
interface DateRangePickerProps {
  itemId: string;
  onSelect: (start: Date, end: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}
```

---

### Component 4: `AvailabilityTimeline`

**Location:** `packages/client/src/components/AvailabilityTimeline.tsx`

**Purpose:** Show upcoming reservations/loans in timeline format

**Features:**

- Horizontal timeline (2 months forward)
- Show current reservations as blocks
- Show current loan if checked out
- Gap analysis (available periods)
- Compact view for catalog list

**Props:**

```typescript
interface AvailabilityTimelineProps {
  itemId: string;
  compact?: boolean; // For catalog list view
  daysAhead?: number; // Default: 60
}
```

---

## 📦 Dependencies to Add

### Option A: react-big-calendar (Recommended)

**Why:** Full-featured, well-maintained, good documentation

```json
{
  "react-big-calendar": "^1.8.5",
  "date-fns": "^3.0.0"
}
```

### Option B: react-calendar

**Why:** Lightweight, simple month view

```json
{
  "react-calendar": "^4.8.0"
}
```

### Option C: react-day-picker

**Why:** Flexible, good for date selection

```json
{
  "react-day-picker": "^8.10.0"
}
```

**Recommendation:** Use `react-big-calendar` for ReservationCalendar + `react-day-picker` for DateRangePicker

---

## 🔌 API Enhancements Needed

### 1. Get Item Reservations & Loans

**New Endpoint:** `GET /api/items/:itemId/availability`

**Returns:**

```typescript
{
  reservations: Reservation[],
  loans: Loan[],
  blockedDates: Array<{ start: string, end: string, type: 'reservation' | 'loan' }>
}
```

**Alternative:** Use existing endpoints and combine in frontend:

- `GET /api/reservations?itemId={itemId}`
- `GET /api/loans?itemId={itemId}&active=true`

### 2. Bulk Availability Check

**New Endpoint (Optional):** `GET /api/reservations/availability/bulk`

For checking multiple items at once (catalog view)

**Query Params:**

- `itemIds[]=id1&itemIds[]=id2`
- `startDate`
- `endDate`

**Returns:** Map of itemId → availability

---

## 📄 Pages to Update

### 1. ItemDetail Page

**Location:** `packages/client/src/pages/ItemDetail.tsx`

**Changes:**

- Add `<ItemAvailabilityCalendar>` above reservation form
- Replace basic date inputs with `<DateRangePicker>`
- Add `<AvailabilityTimeline>` showing next 60 days
- Show real-time availability check when dates selected
- Display conflicts with details (who reserved, when)

**Layout:**

```
┌─────────────────────────────────┐
│  Item Image  │  Item Info       │
│              │  - Name           │
│              │  - Category       │
│              │  - Status         │
│              │  - Description    │
├──────────────┴──────────────────┤
│  Availability Timeline (60 days) │
├──────────────────────────────────┤
│  Calendar Month View             │
│  (Shows blocked dates visually)  │
├──────────────────────────────────┤
│  Reserve This Item               │
│  [Date Range Picker]             │
│  [Reserve Button]                │
└──────────────────────────────────┘
```

---

### 2. Dashboard Page

**Location:** `packages/client/src/pages/Dashboard.tsx`

**Changes:**

- Add tab: "Calendar View"
- Show `<ReservationCalendar>` with user's reservations
- Optional: Toggle between list and calendar view
- Show upcoming (next 30 days) prominently

**Layout:**

```
┌──────────────────────────────────┐
│  My Dashboard                     │
│  [List View] [Calendar View]      │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │   March 2026   [< >]       │  │
│  │ Sun Mon Tue Wed Thu Fri Sat│  │
│  │                  1   2   3 │  │
│  │  4   5   6   7   8   9  10 │  │
│  │ [Drill] [Saw]              │  │ <- Events shown on dates
│  │ 11  12  13  14  15  16  17 │  │
│  └────────────────────────────┘  │
├──────────────────────────────────┤
│  Upcoming Reservations (List)    │
│  - Cordless Drill (Mar 20-22)    │
│  - Circular Saw (Mar 25-27)      │
└──────────────────────────────────┘
```

---

### 3. Catalog Page (Optional Enhancement)

**Location:** `packages/client/src/pages/Catalog.tsx`

**Changes:**

- Add compact `<AvailabilityTimeline>` to each item card
- Show quick availability: "Available now" vs "Next available: Mar 20"
- Optional: Filter by "Available now" or "Available on [date]"

---

### 4. Admin Dashboard (Optional)

**Location:** `packages/client/src/pages/admin/AdminDashboard.tsx`

**Changes:**

- Add "Calendar Overview" tab
- Show all reservations/loans on one calendar
- Color-code by user or by item
- Quick checkout from calendar event

---

## 🛠️ Implementation Plan

### Phase 1: Core Calendar Components (4 hours)

1. Add dependencies: `pnpm add react-big-calendar date-fns react-day-picker`
2. Create `ItemAvailabilityCalendar` component
3. Create `DateRangePicker` component
4. Create `AvailabilityTimeline` component
5. Add CSS for calendar styling
6. Add translations for calendar UI

### Phase 2: ItemDetail Integration (2 hours)

1. Fetch item reservations and loans
2. Integrate `ItemAvailabilityCalendar`
3. Replace date inputs with `DateRangePicker`
4. Add availability preview before submit
5. Show conflicts with helpful messages
6. Test date selection and validation

### Phase 3: Dashboard Calendar (2 hours)

1. Create `ReservationCalendar` component
2. Add calendar/list toggle to Dashboard
3. Fetch user's reservations
4. Transform to calendar events
5. Handle event clicks (view/cancel)
6. Add month navigation

### Phase 4: Catalog Enhancement (1 hour)

1. Add compact timeline to item cards
2. Add quick availability text
3. Optional: availability filter

### Phase 5: Polish & Testing (2 hours)

1. Mobile responsive calendar
2. Loading states
3. Error handling
4. E2E tests for calendar booking
5. Accessibility (keyboard navigation)
6. Performance (lazy load calendars)

**Total Estimated Time:** ~11 hours

---

## 🎯 Success Metrics

### User Experience

- ✅ Users can visually see when items are available
- ✅ Booking dates with calendar is faster than typing
- ✅ Conflicts are immediately visible
- ✅ Calendar view makes planning easier

### Technical

- ✅ Calendar loads in <500ms
- ✅ Date selection works on mobile
- ✅ No booking conflicts slip through
- ✅ Calendar is accessible (ARIA labels)

---

## 🎨 Design Notes

### Color Scheme

- **Available:** Green (#10b981)
- **Reserved:** Amber (#f59e0b)
- **Checked Out:** Red (#ef4444)
- **Past Dates:** Gray (#6b7280)
- **Selected Range:** Indigo (#6366f1)
- **Today:** Blue border (#3b82f6)

### Icons

- 📅 Calendar
- ✅ Available
- 🔒 Unavailable
- 📦 Checked Out
- ⏰ Reservation

### Responsive Breakpoints

- **Mobile (<640px):** Single month, compact timeline
- **Tablet (640-1024px):** Full calendar, scrollable timeline
- **Desktop (>1024px):** Side-by-side months, full timeline

---

## 📝 API Usage Examples

### Check if item available for specific dates

```typescript
const { available, conflicts } = await apiClient.checkAvailability(
  itemId,
  "2026-03-20",
  "2026-03-25",
);

if (!available) {
  console.log("Conflicts:", conflicts); // Shows conflicting reservations/loans
}
```

### Get all reservations for an item

```typescript
const reservations = await apiClient.getReservations(); // all user's
// OR create new endpoint:
const itemReservations = await apiClient.getItemReservations(itemId);
```

### Get active loans for an item

```typescript
const activeLoans = await apiClient.getLoans({
  itemId: itemId,
  active: true,
});
```

---

## 🔄 Future Enhancements (Post-MVP)

### V1.1

- Recurring reservations (weekly, monthly)
- Wait list for popular items
- Reservation reminders (email/push)
- Calendar export (iCal format)

### V1.2

- Drag-and-drop to reschedule
- Multi-item booking (reserve multiple items)
- Split view: calendar + map (location view)
- Availability heatmap (popular times)

### V1.3

- AI-suggested booking times
- Automatic conflict resolution
- Group reservations (events)
- Calendar sync (Google Calendar, Outlook)

---

## 🚀 Quick Start (Next Session)

```bash
# Install dependencies
cd packages/client
pnpm add react-big-calendar date-fns react-day-picker

# Create component files
mkdir -p src/components/calendar
touch src/components/calendar/ItemAvailabilityCalendar.tsx
touch src/components/calendar/DateRangePicker.tsx
touch src/components/calendar/AvailabilityTimeline.tsx
touch src/components/calendar/ReservationCalendar.tsx

# Import styles
# Add to index.css: import 'react-big-calendar/lib/css/react-big-calendar.css';
```

Start with `ItemAvailabilityCalendar` on ItemDetail page for immediate visual impact!
