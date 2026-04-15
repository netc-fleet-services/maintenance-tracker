# Fleet Maintenance Tracker — Full Build Specification

## 1. Overview

Single Page Application for tracking fleet readiness across **100+ trucks / 5 locations**.

Frontend hosted on GitHub Pages.
Backend uses Supabase:

* Postgres database
* Auth
* Realtime updates
* Scheduled email summaries

Purpose:

* Know what trucks are available now
* Track issues
* Track repairs
* Track routine maintenance upcoming
* Notify stakeholders when status changes

---

## 2. Core Truck Statuses

Every truck belongs to one of three statuses:

1. **Ready for Use**

   * No known issues

2. **Known Issues**

   * Operable but needs attention

3. **Out of Service**

   * Not available for dispatch

Truck may move between any statuses at any time.
No forced workflow.

---

## 3. Fleet Scale

* 100+ trucks
  n- 5 locations
* Unique identifiers:

  * Unit Number
  * VIN Number

---

## 4. User Roles & Permissions

## Admin

* Full access
* Manage trucks
* Manage notifications
* Manage users (optional future)
* Change status
* Add notes

## Dispatcher

* Full operational access
* Change status
* Add notes
* Update maintenance notes

## Mechanic

* View all trucks
* Change status
* Add mechanic notes
* Update repair progress
* Cannot manage notifications
* Cannot manage trucks

## Driver

* View all trucks
* Add issue notes only
* Cannot change system settings

---

## 5. Application Pages (SPA Routes)

## Main Dashboard

Primary page with 3 sections:

### Ready for Use

### Known Issues

### Out of Service

Each section displays truck table.

## Admin Settings

* Notification recipients
* Maintenance intervals
* Add/edit trucks

## Truck Detail Drawer / Modal

When row clicked:

* Full notes history
  n- Status history
* Maintenance history

---

## 6. Dashboard Layout

Use **three stacked responsive tables** (recommended).

## Table Columns

| Unit | VIN | Location | Driver Notes | Mechanic Notes | Last Work Done | Last Status Change | Changed By | Next PM Due |

For Known Issues / OOS tables add:

| Waiting On |

Examples:

* waiting on tires
* waiting on hydraulic hose
* waiting on vendor

---

## 7. Why Three Tables Instead of One

Recommended because:

* Immediate visibility of availability
* Dispatch can scan Ready trucks fast
* Mechanics focus on problem sections
* Cleaner for 100+ units

---

## 8. Truck Actions

Each row includes actions:

* Move to Ready
* Move to Known Issues
* Move to Out of Service
* Add Note
* Edit Truck
* View History

Status can jump freely.

---

## 9. Notes Model

Separate note types:

## Driver Notes

Examples:

* brake warning light on
* wheel lift slow

## Mechanic Notes

Examples:

* diagnosed alternator failure
* waiting on parts

## Last Work Done

Examples:

* replaced battery
* PM service completed

All notes timestamped.

---

## 10. Routine Maintenance Module

Track:

* Last PM Date
* Last PM Mileage
* Next PM Due Date
* Next PM Mileage

Display badges:

* Green = OK
* Yellow = Due Soon
* Red = Overdue

Future logic can be customized later.

---

## 11. Notifications

Daily summary emails only.

Three recipient groups configurable by admin:

1. Trucks moved to Ready
2. Trucks moved to Known Issues
3. Trucks moved to Out of Service

Daily email includes:

* truck
* old status
* new status
* timestamp
* changed by
* notes summary

Use Supabase Edge Function or cron job.

---

## 12. Realtime Updates

Use Supabase realtime subscriptions so:

* Dispatch sees changes instantly
* Shop sees updates instantly
* No manual refresh needed

---

## 13. Database Schema

## trucks

| id | uuid |
| unit_number | text unique |
| vin | text unique |
| location_id | uuid |
| current_status | text |
| active | boolean |
| created_at |

## locations

| id | uuid |
| name | text |

## truck_notes

| id |
| truck_id |
| note_type |
| body |
| created_by |
| created_at |

note_type:

* driver
* mechanic
* work_done

## status_history

| id |
| truck_id |
| old_status |
| new_status |
| changed_by |
| created_at |
| comment |

## maintenance

n
| id |
| truck_id |
| last_pm_date |
| last_pm_mileage |
| next_pm_date |
| next_pm_mileage |

## notification_settings

| id |
| status_type |
| emails |

---

## 14. Row Level Security (Supabase)

Admins: full access
Dispatchers: operational full access
Mechanics: no settings access
Drivers: read + insert notes only

---

## 15. Frontend Stack

* Vite
* React
* Tailwind CSS v4
* Supabase JS client
* React Query optional

---

## 16. Styling

Use previously supplied NETC Fleet theme system:

* Midnight default
* Daylight optional
* Gold accents
* Dark surfaces

UI style:

* industrial / clean / operations dashboard

---

## 17. Key Components

* Header
* Location Filter
* Status Tables
* Truck Row
* Status Change Modal
* Notes Drawer
* Admin Settings Form
* Maintenance Badge
* Search Bar

---

## 18. Filters

Allow filtering by:

* location
* status
* due maintenance
* unit number
* keyword search

---

## 19. Audit Trail

Store every status change:

* who changed it
* when
* from what
* to what
* note

Critical for accountability.

---

## 20. GitHub Pages Deployment

Build static frontend:

npm run build

Deploy /dist to GitHub Pages.

Supabase handles backend/API.

---

## 21. Build Phases

## Phase 1 MVP

* Login
* Truck tables
* Status changes
* Notes
* Search

## Phase 2

* Maintenance due logic
* Daily email summaries
* Filters

## Phase 3

* Analytics dashboard
* Downtime reporting
* Mobile enhancements

---

## 22. Recommended UX Notes

For 100+ trucks:

* sticky table headers
* pagination or virtualization
* quick search always visible
* color-coded statuses
* confirm before OOS changes

---

## 23. Success Criteria

Dispatch can know usable fleet in under 10 seconds.
Mechanics know priorities immediately.
Management receives concise daily summaries.
All truck status changes are traceable.

