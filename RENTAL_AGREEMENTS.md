# Rental agreement feature

Admin and Staff can open **Rental Agreements** (`/rentals`) to select an existing rental property, record its tenant, monthly agreement rent and actual start date, and select 7/15/30/60/90 days of advance notice (30 by default).

- A start of 17 October 2026 ends on 16 October 2027.
- Expired agreements remain occupied until staff confirm actual move-out.
- Separate anniversary events occur every 17 October while occupied; missed anniversaries remain visible when staff next open the app.
- Each staff member's read notifications are stored in the database.
- Move-out atomically marks the property Available, preserves the agreement history, stops occupancy reminders, and produces a separate move-out notification for staff.
- Anniversary events are reminders, not legal agreement renewals. February 29 anniversaries are clamped to February 28 in non-leap years.
- Notifications are in-app, refreshed every minute and on window focus. No email, SMS, push delivery, or background scheduler is included.

## Completed admin workflow

- Responsive agreement cards show tenant/contact, property, RA-ID, current dates, monthly agreement rent, status and next reminder. Rent is stored on the agreement; missing historical amounts display “Not recorded” rather than borrowing the current listing price.
- Search covers tenant, property name/ID and RA-ID. Filters cover Active, Expiring Soon (within 30 days), Expired and Completed. Expiry/creation sorting and 12-record pagination operate on the fetched agreement list.
- Create, edit and renewal forms validate inputs and prevent duplicate submissions. Editing changes tenant/contact, rent and reminder lead time; original occupancy dates remain intact.
- Renewal opens a confirmation dialog after the current period expires. Each renewal records the immediately following annual period, retaining the prior tenant details, dates, rent and reminder settings in history. Record missed periods one at a time. Future renewals are deliberately not scheduled by this workflow.
- Details display original occupancy, current period, current property status returned by the API, saved edit/renewal/move-out history and current reminder events.
- Confirm Move-Out captures actual date and optional notes. All actions wait for API confirmation; version checks reject stale edits and move-outs, then refresh the latest agreement. Completed agreements remain read-only.
- Expiry never changes property availability. Renewal never changes the original anniversary date. Each renewed period gets a new expiry event ID so reading a prior period's reminder does not suppress the next one.
- The existing rental GET response supplies the authoritative notification list. The frontend only uses its previous computed-notification fallback for older servers without `alerts`; it never merges the two sources. Read/unread state is per staff account and persisted through the existing `/read` endpoint.
- Dashboard cards use the same provider data for active agreements (including those expiring soon), expiry within 30 days, expired occupied agreements, and actual move-outs in the last 30 days.
- Current reminders are derived from saved agreements, not a permanent delivery log. Renewed periods remain in agreement history; expired-period reminder events stop appearing after renewal. There is no email or push delivery history.

## Existing features reused and API additions

Reused the original `/rentals` route, `RentalContext`, `RentalAgreements`, date rules, property context refresh, authentication context/session validation, sidebar/header, dashboard, shared Modal and existing `/api/rentals` router. Customer-submission notifications remain separate.

The existing backend did not support edit, renewal, unread, rent snapshots or history. The same rental router now adds `POST /:id/edit` and `POST /:id/renew`, extends `POST /read` with `read: false`, and extends move-out with notes/version checks. GET returns history, version, rent, property status, timestamps, notifications and capability flags. The UI disables unsupported actions on older deployments instead of calling guessed endpoints.

All routes retain active Admin/Staff checks against the database. The frontend handles 401 through the existing auth session recheck, clears protected rental data on 401/403, prevents stale responses crossing accounts, and hides management actions from other roles.

## Deployment

Backend files are installed in the sibling `backend` repository. Apply its migration to the intended database before deploying the new backend and frontend:

```powershell
cd ../backend
node scripts/migrate-rentals.mjs
```

The script uses that backend's configured `DATABASE_URL`. Migrations have **not** been run against a live database during implementation. The runner applies both `20261016_rental_agreements.sql` and the additive `20261016_rental_history.sql`. The first adds agreement/read-receipt tables, a partial unique index for one occupant per property, and an occupancy guard trigger. The second adds current-period start, rent snapshot, JSON history, version and move-out notes without deleting data. Rental history prevents property deletion through a foreign key.

Apply both migrations to staging first, deploy the backend before the frontend, and verify real PostgreSQL transactions and trigger behavior. Then repeat the migration/deployment sequence against the intended production configuration. Existing agreements retain their original dates; previously unrecorded rent/history is not fabricated.

## Verification

Frontend: `node --test tests/*.test.js`, `npm.cmd run build`, `npm.cmd run lint`.

Backend: `node --test tests/rentals.test.js`. This exercises authenticated HTTP routes with an isolated in-memory PostgreSQL emulator. PL/pgSQL trigger execution and real PostgreSQL transaction/concurrency behavior still require staging verification after applying the migration.

Polish verification: frontend tests cover date boundaries, API errors/authentication, search/filter/sort/pagination, validation, renewal notification identities and rendering the actual page through Vite SSR. Backend lifecycle tests cover unauthorized/disabled staff, duplicate tenancy, read/unread isolation, editing, preserved renewal history, stale versions, move-out notes and completed-agreement protection. SSR is not browser interaction testing.

Browser verification was attempted but blocked before connection: the browser tool reports a missing `sandboxPolicy` field. Desktop/mobile visual checks, keyboard dialog behavior, console inspection and a full click-through remain manual staging checks.

## Files changed in the polish pass

| File | Change |
| --- | --- |
| `src/pages/RentalAgreements.jsx` | Extended the existing page with search/filter/sort/pagination, cards, details/history, create/edit/renew/move-out dialogs and notification controls. |
| `src/context/RentalContext.jsx` | Backend notifications/capabilities, refresh results, read/unread persistence, session/permission and stale-response handling. |
| `src/utils/rentalApi.js` | Extracted the rental request helper with authenticated requests and explicit HTTP/API failure handling. |
| `src/utils/rentalView.js` | Date display, statuses, next reminder, summaries, search/sort/pagination and form validation. |
| `src/utils/rentalDates.js` | Distinct expiry event IDs for renewed periods; original anniversary rules retained. |
| `src/components/RentalSummary.jsx` | Compact dashboard overview using shared API data. |
| `src/pages/Dashboard.jsx` | Added rental overview without changing existing dashboard sections. |
| `src/components/Layout.jsx` | Staff-only rental navigation and loading/error-aware notification badge. |
| `src/components/Modal.jsx` | Accessible dialog names, keyboard focus containment and focus restoration. |
| `tests/rentalApi.test.js` | Authenticated request contracts and failed response tests. |
| `tests/rentalView.test.js` | Filters, pagination, status boundaries, validation and renewal alerts. |
| `tests/rentalPage.test.js`, `tests/fixtures/rentalPage.jsx` | Actual JSX rendering tests for populated/empty/loading/error/permission states. |
| `../backend/routes/rentalRoutes.js` | Extended existing router with edit/renew, history, capability flags, alerts and unread/notes/version support. |
| `../backend/services/rentalDates.js` | Matching shared annual date/notification rules. |
| `../backend/sql/migrations/20261016_rental_history.sql` | Additive history/rent/version/notes fields. |
| `../backend/scripts/migrate-rentals.mjs` | Runs both rental migrations. |
| `../backend/tests/rentals.test.js` | Expanded authenticated lifecycle regression coverage. |
| `RENTAL_AGREEMENTS.md` | Workflow, API contracts, deployment, limitations and verification notes. |

The earlier `src/App.jsx` rental route/provider wiring is preserved. Previously modified backend `propertyRoutes.js`, `submissionRoutes.js` and `server.js` were hash-checked and left unchanged in this pass.
