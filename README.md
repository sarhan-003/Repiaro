# Home All-Rounder — Smart Home Services (Phase 1 frontend)

"Your Home, Our Priority." A home-services marketplace with a **ride-hailing style** booking flow (inspired by apps like Rapido):
pick a service, see the price upfront, get matched with the nearest available professional, track them, share an OTP to
start the job, pay after the service and rate.

**Phase 1 is frontend only.** All professionals, admins, reviews, prices and bookings are fictional demo data kept in the
browser (`localStorage`). No server, no real sign-in, no payments. Professional movement and acceptance are simulated
("demo autopilot"). Photos are free-to-use stock images from [Pexels](https://www.pexels.com); the people shown are not the
providers named.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
```

## Four separate apps

| App | URL | Who | Linked from the customer site? |
|---|---|---|---|
| Customer website | `/` | Households booking services | — |
| Partner app | `/partner` | Service professionals ("captains") | Footer only ("Partner app for professionals") |
| Admin console | `/admin` | Operations admins who manage service providers in their assigned categories | **No**, open by URL |
| Super Admin console | `/superadmin` | Platform owner | **No**, open by URL |

The consoles use their own layout (no customer navbar or footer). Access is a **demo gate**: there is no real
authentication in Phase 1, so the gate just lets you choose a role.

## Customer flow (ride-hailing style)

1. **Set location** (pill in the header) — like a pickup point; used to find nearby pros.
2. **Pick a service** on Home → `/book-now/:category`. Choose an option card with its **upfront fare**
   (surge shown when a super admin enables high demand), **Now** or **Schedule**, address, contact and **Cash/UPI after service**.
3. **Matching** (`/track/:id`): the request is offered to **one professional at a time**, nearest first
   (based in your locality → serves your locality → elsewhere), with a countdown. On decline or timeout it moves to the next.
   With no one left it becomes **No pro found**, with *Search again* / *Schedule instead*.
4. **Tracking:** assigned → on the way (live ETA + route bar) → arrived → **share the 4-digit OTP** → work in progress → completed.
   Free cancellation until the professional arrives.
5. **Pay after service and rate.** Ratings appear in the partner app and the admin's booking details.

Also: **Book again** shortcuts, a floating active-booking bar, saved profile (name/phone/address in this browser),
browse/compare professionals and request a specific pro (offered first, with automatic fallback).

## Partner app (`/partner`)

On/Off-duty toggle · incoming offer card with countdown, net earnings and Accept/Decline · job steps
(*Start trip* → *I've arrived* → *Verify OTP & start* → *Complete job*) · today's earnings after commission ·
scheduled jobs · history · ratings. Use the **Signed in as (demo switch)** to act as any professional.
Suspended or pending accounts can't go on duty.

While the partner app is open for a professional, the demo autopilot leaves that professional alone, so offers wait
for **your** response. Tip: open the customer site and the partner app in two tabs.

## Admin console (`/admin`)

Choose an active admin at the gate. Each admin only sees their **assigned categories**.

- **Overview:** searching/in-progress counts, pros online, completed today, GMV, unfulfilled, live dispatch board.
- **Bookings:** search and filter; view the full record with timeline; **Reassign** (drops the pro and finds the next),
  **Search again** (no pro found), **Cancel**.
- **Service providers:** duty status, jobs done, rating; **Suspend / Reactivate / Set offline**.
  Suspended providers vanish from the customer site and matching.
- **Applications:** review new providers (demo documents) and **Approve / Reject**.

## Super Admin console (`/superadmin`)

- **Overview:** GMV, platform revenue (commission + fees), fulfilment rate, providers and admins, bookings by category, recent activity.
- **Admins:** add admins, assign categories, enable/disable. A disabled admin can't enter the console.
- **Services & pricing:** pause/resume categories (hidden from customers), demand multiplier (1×–2×), edit fares per service.
- **Platform settings:** commission %, convenience fee, offer timeout, demo autopilot and simulated timings; reset all demo data.
- **Audit log:** every admin and super admin action.

## Project structure

```
src/
  data/sampleData.js            Providers, applicants, service menu & fares, admins, default settings, seed bookings
  context/PlatformContext.jsx   Settings, category pricing, admins, provider accounts, audit log, console session
  context/BookingContext.jsx    Bookings, availability, dispatch loop, customer/partner/admin actions
  context/CustomerContext.jsx   Customer location and saved contact details
  utils/dispatch.js             Matching rules (ranking, busy check, offers, timeouts, autopilot)
  utils/pricing.js              Upfront fare, surge, partner earnings, platform revenue
  utils/bookingHelpers.js       Statuses, allowed transitions per actor, validation, storage sanitising
  pages/                        Customer pages; pages/partner, pages/admin, pages/superadmin
  components/console/           Console layout, demo gate, shared console UI
```

## Phase 2 integration points

- `utils/dispatch.js` → server-side dispatch service (same rules), real-time updates instead of the 1-second loop.
- `BookingContext` / `PlatformContext` → API calls with authorisation per role (customer, partner, admin, super admin).
- The demo gates → real authentication (OTP for customers/partners, SSO for staff).
- Live map tracking, calling/chat, payments and document verification are out of scope for Phase 1.

## Known limitations

- Several open tabs each run the dispatch loop. Data stays consistent through storage sync, but timings can differ slightly.
- Timings are compressed for demos (configurable in Platform settings).
