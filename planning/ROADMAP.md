# Ting — Roadmap

Community tool lending service. MVP is live. This document organizes further work by phase, priority, and MoSCoW.

**MoSCoW key:** M = Must Have · S = Should Have · C = Could Have · W = Won't Have (this cycle)

---

## Known Issues (fix before new features)

| # | Status | Area | Description |
|---|--------|------|-------------|
| B01 | open | navbar / org | Navbar shows wrong organization on startup — "Oslo Tool Library" displays but items are from Bergen. Likely a race condition or wrong default-org in context. |

---

## Current MVP State (done)

- JWT auth with admin/member roles
- Multi-organization support
- Items catalog with search, categories, image upload
- Locations for items
- Reservations with conflict detection
- Check-in / check-out loans
- Admin dashboard (items, users, loans, categories, locations, item approval)
- Item manuals (PDF upload, links, text)
- User ownership / item submission flow with admin approval
- Email reminders (due dates, overdue)
- i18n: Norwegian, Danish, English

---

## Phase 1 — Polish & Trust

Focus: make the existing MVP feel solid and trustworthy before growing the user base.

| Done | # | Prio | MoSCoW | Item | Notes |
|------|-----|------|--------|------|-------|
| ✅ | T01 | P0 | M | Fix broken/incomplete i18n keys | Several keys missing in da/no |
| ✅ | T02 | P0 | M | Mobile responsiveness audit | Admin dashboard and item detail |
| ✅ | T47 | P1 | M | 2-column layout on desktop | Item detail and dashboard |
| ✅ | T48 | P1 | M | Mobile-friendly navbar menu | Hamburger menu / drawer on small screens |
| ✅ | T03 | P0 | S | Error handling & user feedback | Replace raw `alert()` calls with toast/inline messages |
| ✅ | T04 | P0 | S | Loading & empty states | Skeleton loaders or spinners; empty state illustrations |
| ✅ | T05 | P1 | S | User profile page | Change name, password, see own activity |
| ✅ | T06 | P1 | S | Item edit by owner | Item owners (not just admins) can edit their own submitted items |
| ✅ | T07 | P1 | S | Reservation status emails | Confirm/cancel emails when reservation is created or cancelled |
| ✅ | T08 | P1 | S | Admin: item approval email | Notify owner when item is approved or rejected with reason |
| ✅ | T09 | P2 | C | Onboarding flow | First-login wizard or welcome screen explaining the service |
| ✅ | T10 | P2 | C | Accessible keyboard navigation | WCAG 2.1 AA compliance pass |
| [ ] | T52 | P0 | M | Email verification on registration | Users currently register without verifying their address; required before password reset can be trusted |
| [ ] | T53 | P1 | M | Password reset via email | Token-based reset link; currently no recovery path if password is lost |
| [ ] | T54 | P1 | S | Refresh tokens / persistent sessions | JWTs expire with no renewal; users get logged out unexpectedly. Add refresh tokens or sliding sessions with "remember me" |

---

## Phase 2 — Discovery & Usability

Focus: make it easier to find items and manage lending.

| Done | # | Prio | MoSCoW | Item | Notes |
|------|-----|------|--------|------|-------|
| ✅ | T11 | P0 | M | Item tags / free-text search improvement | Tags per item, better full-text search across name + description + tags |
| ✅ | T12 | P1 | S | Reservation calendar view | Visual calendar on item detail showing availability |
| ✅ | T13 | P1 | S | Item condition tracking | Admin marks condition (good / fair / needs repair) on check-in |
| ✅ | T14 | P1 | S | Damage report on return | Free-text field when checking in; logged per loan |
| ✅ | T15 | P1 | S | Loan history visible to borrower | Users can see their own full history (not just active loans) |
| [ ] | T16 | P2 | C | Item QR code labels | Generate printable QR codes linking to item detail page |
| ✅ | T17 | P2 | C | Multi-image per item | Upload multiple photos; first is primary |
| [ ] | T18 | P2 | C | Bulk item import (CSV) | Admin imports many items at once |
| [ ] | T57 | P1 | S | Email notification preferences | User can toggle which system emails they receive (reminders, confirmations, etc.) |

---

## Phase 3 — Community & Engagement

Focus: social features that encourage participation and reduce admin burden.

| Done | # | Prio | MoSCoW | Item | Notes |
|------|-----|------|--------|------|-------|
| ✅ | T20 | P1 | S | Item reviews & ratings | Members rate items after returning; visible on item page |
| [ ] | T21 | P1 | S | Waitlist / queue for reserved items | Join a queue when an item is fully booked. Fix B01 first — org context must be reliable before building on reservation layer |
| [ ] | T22 | P1 | S | Push notifications (browser) | Reservation reminders, queue notifications |
| ✅ | T23 | P2 | C | Comments / Q&A on items | Members ask questions; owner/admin answers |
| [ ] | T24 | P2 | C | Item wishlist | Members request tools the org doesn't have yet |
| [ ] | T25 | P2 | C | Borrowing stats on item page | "Borrowed X times" social proof |
| [ ] | T26 | P1 | S | Admin statistics dashboard | Usage charts, popular items, overdue trends. Bumped from P2 — operational value is high once real users are lending |
| [ ] | T58 | P2 | C | Admin weekly digest email | Summary of activity (loans, overdue, new members) sent to org admins |

---

## Phase 4 — Operations & Scale

Focus: operational tooling and reliability for larger organizations.

| Done | # | Prio | MoSCoW | Item | Notes |
|------|-----|------|--------|------|-------|
| [ ] | T28 | P2 | C | Migrate to PostgreSQL | SQLite is the current target; T50/T51 invest in SQLite backup/sync, so Postgres migration is only warranted at scale. Revisit when multi-node or Supabase hosting is needed |
| [ ] | T29 | P1 | S | Recurring reservations | Book "every Tuesday" |
| [ ] | T30 | P1 | S | Fine / deposit system | Optional late fees or deposit tracking |
| [ ] | T31 | P2 | C | Role: Volunteer / trusted member | Can check items in/out but not full admin |
| [ ] | T32 | P2 | C | Organization settings page | Logo, contact info, opening hours, lending rules |
| [ ] | T33 | P2 | C | Audit log | Who changed what and when |
| [ ] | T34 | P2 | C | API rate limiting & security hardening | Rate limit auth endpoints, input sanitization review |
| [ ] | T55 | P2 | C | Two-factor authentication (TOTP) | Authenticator app support for members who want extra security |
| [ ] | T56 | P2 | C | OAuth / social login | Sign in with Google; reduces friction for new members |

---

## Phase 5 — Network Effects (future)

Focus: connecting organizations and broader community features.

| Done | # | Prio | MoSCoW | Item | Notes |
|------|-----|------|--------|------|-------|
| [ ] | T37 | P2 | C | Inter-organization lending | Borrow from a neighboring makerspace |
| [ ] | T38 | P2 | C | Public directory of organizations | Discovery page for the Ting network |

---

## Design Refresh — Visual Identity

Focus: replace the generic Tailwind-default look with a distinct, warm visual identity that feels community-oriented and trustworthy.

| Done | # | Prio | MoSCoW | Item | Notes |
|------|-----|------|--------|------|-------|
| [ ] | T52 | P0 | M | Design token overhaul | Replace generic indigo palette with a warm, earthy brand palette (primary, surface, accent, semantic colors defined as CSS custom properties) |
| [ ] | T53 | P0 | M | Typography system | Pick a distinctive typeface pair (display + body); establish consistent scale (h1–h4, body, label, caption) across all pages |
| [ ] | T54 | P0 | M | Navbar redesign | White/light background, logo lockup, clear active-link indicator, org switcher integrated cleanly; remove flat indigo bar |
| [ ] | T55 | P1 | S | ItemCard redesign | Taller image area with aspect-ratio lock, status badge as overlay, hover lift + subtle scale, better tag + rating placement |
| [ ] | T56 | P1 | S | Catalog page layout | Filter sidebar with section headers and icon per category; search bar with clear button; result count + sort dropdown |
| [ ] | T57 | P1 | S | ItemDetail hero section | Full-width image carousel / lightbox at top, availability pill prominent, sticky reservation sidebar on desktop |
| [ ] | T58 | P1 | S | Button & form component polish | Consistent primary/secondary/ghost/danger variants; proper focus rings; unified input, select, textarea sizing |
| [ ] | T59 | P2 | C | Empty state illustrations | SVG illustrations for no-results, no-loans, no-items — branded and friendly rather than plain text |
| [ ] | T60 | P2 | C | Dark mode | CSS custom-property-based theming makes this straightforward once T52 is done |
| [ ] | T61 | P2 | C | Micro-animations | Skeleton loaders on cards, page fade-in, toast slide-in, button press feedback — using Tailwind transitions only |
| [ ] | T62 | P2 | C | CSS theme support | Allow per-organization color themes via CSS custom properties; org admin picks a primary color, system generates a full token set; requires T52 |

---

## Technical Debt & Infrastructure (ongoing)

| Done | # | Prio | MoSCoW | Item | Notes |
|------|-----|------|--------|------|-------|
| ✅ | T49 | P0 | M | Establish TDD workflow | Vitest (unit + component) and Playwright (E2E) configured; TDD_RULES.md in place |
| [ ] | T41 | P0 | M | Increase test coverage | Server routes for categories, comments, loans, locations, reservations, reviews, users have no tests. Two E2E spec files (app.spec.ts, complete.spec.ts) overlap — consolidate into one. Target: >80% coverage on server routes |
| [ ] | T42 | P0 | M | CI pipeline on PRs (GitHub Actions) | `fly-deploy.yml` exists for CD (deploy on push to main) but no test/lint/build step runs on PRs. Add a separate CI workflow |
| [ ] | T43 | P1 | S | Environment config validation on startup | Zod/envalid |
| [ ] | T44 | P1 | S | Structured logging | pino/winston instead of console.log |
| [ ] | T50 | P1 | S | SQLite backup procedure | Scheduled backup of db file on VPS (cron + offsite copy) |
| [ ] | T51 | P1 | S | DB sync to local dev | Script to pull production SQLite db from VPS to local environment |
| [ ] | T45 | P2 | C | Docker Compose for local dev | |
| [ ] | T46 | P2 | C | OpenAPI / Swagger docs for the REST API | |

---

## Deferred / Won't Have (this cycle)

These are explicitly out of scope for now. Re-evaluate when scope changes.

| # | Item | Reason |
|---|------|--------|
| T19 | Barcode scanner (mobile camera) | Needs native app or PWA camera API |
| T27 | Public item catalog (no login) | Requires auth model changes — evaluate later |
| T35 | Payment integration (Stripe etc.) | Only if fine/deposit system (T30) is adopted |
| T36 | Native mobile app | PWA first; native only if demand warrants it |
| T39 | AI-powered recommendations | Evaluate after borrowing history data exists |
| T40 | Marketplace (sell/donate items) | Different product scope |
