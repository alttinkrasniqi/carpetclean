-- =========================================================
-- Carpet Cleaning Dashboard — Supabase schema
-- Run this once in Supabase → SQL Editor → New query → Run
-- =========================================================

create table if not exists customers (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  id bigint generated always as identity primary key,
  business_name text not null default 'Carpet Cleaning Co.',
  default_price_per_sqm numeric not null default 1.50
);

create table if not exists orders (
  id bigint generated always as identity primary key,
  order_number text not null unique,
  customer_id bigint not null references customers(id) on delete restrict,
  created_at timestamptz not null default now(),
  collection_date date,
  collection_notes text,
  factory_received_date date,
  cleaning_completed_date date,
  delivery_date date,
  delivery_notes text,
  status text not null default 'New Order',
  notes text,
  price_per_sqm numeric not null,
  is_archived boolean not null default false
);

create table if not exists carpets (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  length numeric not null,
  width numeric not null,
  price_per_sqm numeric not null,
  label text
);

create table if not exists payments (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  amount numeric not null,
  date date not null default current_date,
  note text
);

create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_archived on orders(is_archived);
create index if not exists idx_carpets_order on carpets(order_id);
create index if not exists idx_payments_order on payments(order_id);
create index if not exists idx_payments_date on payments(date);

-- Row Level Security: this is an internal tool with no login yet,
-- so we allow the public "anon" key full read/write access.
-- (If you later add employee logins, tighten these policies.)
alter table customers enable row level security;
alter table orders enable row level security;
alter table carpets enable row level security;
alter table payments enable row level security;
alter table settings enable row level security;

drop policy if exists "allow all customers" on customers;
create policy "allow all customers" on customers for all using (true) with check (true);

drop policy if exists "allow all orders" on orders;
create policy "allow all orders" on orders for all using (true) with check (true);

drop policy if exists "allow all carpets" on carpets;
create policy "allow all carpets" on carpets for all using (true) with check (true);

drop policy if exists "allow all payments" on payments;
create policy "allow all payments" on payments for all using (true) with check (true);

drop policy if exists "allow all settings" on settings;
create policy "allow all settings" on settings for all using (true) with check (true);

-- default settings row
insert into settings (business_name, default_price_per_sqm)
select 'Kristal Carpet Cleaning', 1.50
where not exists (select 1 from settings);
