# Ting — Roadmap

Community tool lending service. MVP is live. This document organizes further work by phase, priority, and MoSCoW.

**MoSCoW key:** M = Must Have · S = Should Have · C = Could Have · W = Won't Have (this cycle)

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

## Phase 1 — Polish & Trust (next sprint)

Focus: make the existing MVP feel solid and trustworthy before growing the user base.

| Done | # | Prio | MoSCoW | Item | Notes |
|------|-----|------|--------|------|-------|
| [x] | T01 | P0 | M | Fix broken/incomplete i18n keys | Several keys missing in da/no — already flagged in git |
| [x] | T02 | P0 | M | Mobile responsiveness audit | Admin dashboard and item detail not fully usable on small screens |
| [ ] | T47 | P1 | M | 2-column layout on desktop | Item detail and dashboard use wider screen real estate with a sidebar/2-col grid |
| [ ] | T48 | P1 | M | Mobile-friendly navbar menu | Hamburger menu / drawer on small screens; current nav overflows |
| [ ] | T03 | P0 | S | Error handling & user feedback | Replace raw `alert()` calls with toast/inline messages |
| [ ] | T04 | P0 | S | Loading & empty states | Skeleton loaders or spinners; empty state illustrations |
| [ ] | T05 | P1 | S | User profile page | Change name, password, see own activity |
| [ ] | T06 | P1 | S | Item edit by owner | Item owners (not just admins) can edit their own submitted items |
| [ ] | T07 | P1 | S | Reservation status emails | Confirm/cancel emails when reservation is created or cancelled |
| [ ] | T08 | P1 | S | Admin: item approval email | Notify owner when item is approved or rejected with reason |
| [ ] | T09 | P2 | C | Onboarding flow | First-login wizard or welcome screen explaining the service |
| [ ] | T10 | P2 | C | Accessible keyboard navigation | WCAG 2.1 AA compliance pass |

---

## Phase 2 — Discovery & Usability

Focus: make it easier to find items and manage lending.

| Done | # | Prio | MoSCoW | Item | Notes |
|------|-----|------|--------|------|-------|
| [ ] | T11 | P0 | M | Item tags / free-text search improvement | Tags per item, better full-text search across name + description + tags |
| [ ] | T12 | P1 | S | Reservation calendar view | Visual calendar on item detail showing availability |
| [ ] | T13 | P1 | S | Item condition tracking | Admin marks condition (good / fair / needs repair) on check-in |
| [ ] | T14 | P1 | S | Damage report on return | Free-text field when checking in; logged per loan |
| [ ] | T15 | P1 | S | Loan history visible to borrower | Users can see their own full history (not just active loans) |
| [ ] | T16 | P2 | C | Item QR code labels | Generate printable QR codes linking to item detail page |
| [ ] | T17 | P2 | C | Multi-image per item | Upload multiple photos; first is primary |
| [ ] | T18 | P2 | C | Bulk item import (CSV) | Admin imports many items at once |
| [ ] | T19 | W | W | Barcode scanner (mobile camera) | Needs native app or PWA camera API — later |

---

## Phase 3 — Community & Engagement

Focus: social features that encourage participation and reduce admin burden.

| Done | # | Prio | MoSCoW | Item | Notes |
|------|-----|------|--------|------|-------|
| [ ] | T20 | P1 | S | Item reviews & ratings | Members rate items after returning; visible on item page |
| [ ] | T21 | P1 | S | Waitlist / queue for reserved items | Join a queue when an item is fully booked |
| [ ] | T22 | P1 | S | Push notifications (browser) | Reservation reminders, queue notifications |
| [ ] | T23 | P2 | C | Comments / Q&A on items | Members ask questions; owner/admin answers |
| [ ] | T24 | P2 | C | Item wishlist | Members request tools the org doesn't have yet |
| [ ] | T25 | P2 | C | Borrowing stats on item page | "Borrowed X times" social proof |
| [ ] | T26 | P2 | C | Admin statistics dashboard | Usage charts, popular items, overdue trends |
| [ ] | T27 | W | W | Public item catalog (no login) | Requires auth model changes — evaluate later |

---

## Phase 4 — Operations & Scale

Focus: operational tooling and reliability for larger organizations.

| Done | # | Prio | MoSCoW | Item | Notes |
|------|-----|------|--------|------|-------|
| [ ] | T28 | P1 | S | Migrate to PostgreSQL | SQLite is fine for single-node; Postgres for scale / Supabase hosting |
| [ ] | T29 | P1 | S | Recurring reservations | Book "every Tuesday" |
| [ ] | T30 | P1 | S | Fine / deposit system | Optional late fees or deposit tracking |
| [ ] | T31 | P2 | C | Role: Volunteer / trusted member | Can check items in/out but not full admin |
| [ ] | T32 | P2 | C | Organization settings page | Logo, contact info, opening hours, lending rules |
| [ ] | T33 | P2 | C | Audit log | Who changed what and when |
| [ ] | T34 | P2 | C | API rate limiting & security hardening | Rate limit auth endpoints, input sanitization review |
| [ ] | T35 | W | W | Payment integration | Stripe etc. — only if deposit/fine system adopted |
| [ ] | T36 | W | W | Native mobile app | PWA first; native app only if demand warrants it |

---

## Phase 5 — Network Effects (future)

Focus: connecting organizations and broader community features.

| Done | # | Prio | MoSCoW | Item | Notes |
|------|-----|------|--------|------|-------|
| [ ] | T37 | P2 | C | Inter-organization lending | Borrow from a neighboring makerspace |
| [ ] | T38 | P2 | C | Public directory of organizations | Discovery page for the Ting network |
| [ ] | T39 | W | W | AI-powered recommendations | Suggest items based on borrowing history |
| [ ] | T40 | W | W | Marketplace (sell/donate items) | Different product scope — evaluate separately |

---

## Technical Debt & Infrastructure (ongoing)

| Done | # | Prio | MoSCoW | Item |
|------|-----|------|--------|------|
| [ ] | T49 | P0 | M | Establish TDD workflow with Vitest (unit), Vitest Browser Mode (component), and Playwright (E2E) |
| [ ] | T41 | P0 | M | Increase test coverage (E2E + unit) — Playwright tests exist but coverage is spotty |
| [ ] | T42 | P0 | M | CI/CD pipeline (GitHub Actions) — build, test, lint on every PR |
| [ ] | T43 | P1 | S | Environment config validation on startup (Zod/envalid) |
| [ ] | T44 | P1 | S | Structured logging (pino/winston) instead of console.log |
| [ ] | T45 | P2 | C | Docker Compose for local dev |
| [ ] | T46 | P2 | C | OpenAPI / Swagger docs for the REST API |
| [ ] | T50 | P1 | S | SQLite backup procedure — scheduled backup of db file on VPS (cron + offsite copy) |
| [ ] | T51 | P1 | S | DB sync to local dev — script to pull production SQLite db from VPS to local environment |
