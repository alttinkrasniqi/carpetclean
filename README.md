# Carpet Cleaning Dashboard — Next.js + Supabase (Vercel-ready)

Same app as the Python version, rebuilt so it can be hosted online on Vercel
and used from any phone/computer — not just on your local machine.

- **Database:** Supabase (Postgres) — always on, free tier is plenty for this
- **Hosting:** Vercel — free tier, deploys in a couple of clicks
- **No login required** (matches the original brief — internal tool, no customer accounts)

---

## 1. Set up the database (one-time)

1. Go to your Supabase project → **SQL Editor** → **New query**
2. Open `supabase-schema.sql` from this folder, copy all of it, paste it in, and click **Run**
   - This creates all tables (customers, orders, carpets, payments, settings) and permissions.
3. Your `.env.local` file already has your project's URL and anon key filled in.

## 2. Run it locally first (to check everything works + load demo data)

```bash
npm install
npm run seed     # loads demo customers/orders into Supabase (wipes existing data first!)
npm run dev
```

Open **http://localhost:3000** — you should see the dashboard with demo data.

> ⚠️ `npm run seed` **deletes and replaces** all customers/orders/payments. Only run it
> when you want to reset to the demo dataset — never on your real data.

## 3. Deploy to Vercel (so it's usable from any phone, anywhere)

**Option A — via GitHub (recommended):**
1. Push this folder to a new GitHub repo (private is fine)
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import that repo
3. Before deploying, add these **Environment Variables** in Vercel's project settings:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://vllzvqgqdyuustkpfawt.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (the long key from `.env.local`)
4. Click **Deploy**. In ~1 minute you'll get a live URL like `carpet-cleaning.vercel.app`

**Option B — via Vercel CLI (no GitHub needed):**
```bash
npm install -g vercel
vercel login
vercel
# When prompted, set the same two environment variables as above
vercel --prod
```

Once deployed, open the Vercel URL from your phone — works from anywhere, no need
for your computer to be on.

## Project structure

```
app/                     → pages (App Router) — one folder per route
  page.js                → Dashboard
  orders/                → Orders list, new order form, order detail
  customers/              → Customers list + detail
  reports/                → Reports + charts
  settings/                → Settings + archived orders
  actions.js               → all database writes (create order, record payment, change status...)
  globals.css               → all styling (same design as the desktop version)
lib/
  supabase.js               → Supabase client
  queries.js                → all database reads
  data.js                    → shared calculations (totals, status list, date ranges)
components/                  → Sidebar, search bar, period switcher
scripts/seed.mjs             → demo data generator
supabase-schema.sql           → run once in Supabase to create tables
```

## What's included (same as the desktop MVP)

- Dashboard with today's stats + switchable period (today/week/month/year/custom)
- "Today's Work" panel (collections, ready for delivery, out for delivery, unpaid)
- Orders list with status filters
- New Order form — multiple carpets per order, live area/price calculation
- Order detail — clickable status workflow, collection/delivery dates, payment recording
- Customers list + full order history per customer
- Global search (order ID, name, phone, address)
- Reports with charts (revenue, orders, status breakdown, paid vs unpaid)
- Settings — configurable default price per m² (old orders keep their original price)
- Archive/restore instead of hard delete, so reports never break

## Notes

- The Supabase **anon key** is safe to expose publicly (it's designed for this) —
  access control is handled by database policies, not by hiding the key. Right now
  the policies allow full read/write since there's no login system yet. If you
  later add employee accounts, tighten the policies in Supabase.
- This project could not be seeded automatically from this environment (no network
  access to your Supabase project from the sandbox) — run `npm run seed` yourself
  locally as the first step above.
