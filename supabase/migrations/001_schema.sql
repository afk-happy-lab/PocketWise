-- PocketWise schema. All money is integer paise. RLS on every table.
-- Sign convention: net > 0 => group owes member; net < 0 => member owes group.
create extension if not exists pgcrypto;

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', email text,
  currency text not null default 'INR', created_at timestamptz not null default now()
);
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, full_name, email) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Personal money. Group expenses are NOT copied here (see docs/ACCOUNTING.md): no double counting.
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  amount_paise bigint not null check (amount_paise > 0),
  category text not null, description text not null default '', notes text,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on transactions(user_id, occurred_on desc);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  month date not null check (month = date_trunc('month', month)::date),
  overall_paise bigint check (overall_paise > 0),
  unique (user_id, month)
);
create table category_budgets (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references budgets(id) on delete cascade,
  category text not null, limit_paise bigint not null check (limit_paise > 0),
  unique (budget_id, category)
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0), description text, icon text not null default 'people',
  created_by uuid not null references profiles(id), created_at timestamptz not null default now()
);
-- Members are soft-removed (left_at) so historical obligations are never erased.
create table group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id),
  role text not null default 'member' check (role in ('admin','member')),
  joined_at timestamptz not null default now(), left_at timestamptz,
  primary key (group_id, user_id)
);
create index on group_members(user_id);

create table group_expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  paid_by uuid not null references profiles(id),
  amount_paise bigint not null check (amount_paise > 0),
  description text not null, category text not null default 'Others', notes text,
  split_type text not null check (split_type in ('equal','exact','percentage')),
  occurred_on date not null default current_date,
  created_by uuid not null references profiles(id), created_at timestamptz not null default now()
);
create table group_expense_shares (
  expense_id uuid references group_expenses(id) on delete cascade,
  user_id uuid references profiles(id),
  share_paise bigint not null check (share_paise >= 0),
  primary key (expense_id, user_id)
);
create table group_settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  from_user uuid not null references profiles(id), to_user uuid not null references profiles(id),
  amount_paise bigint not null check (amount_paise > 0), note text,
  settled_on date not null default current_date,
  created_by uuid not null references profiles(id), created_at timestamptz not null default now(),
  check (from_user <> to_user)
);
create index on group_expenses(group_id, occurred_on desc);
create index on group_settlements(group_id);

-- Helpers (security definer avoids recursive RLS on group_members)
create function is_group_member(g uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from group_members where group_id = g and user_id = auth.uid() and left_at is null) $$;
create function is_group_admin(g uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from group_members where group_id = g and user_id = auth.uid() and left_at is null and role = 'admin') $$;

-- Creator becomes admin automatically
create function add_creator_as_admin() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into group_members(group_id, user_id, role) values (new.id, new.created_by, 'admin'); return new; end $$;
create trigger groups_creator after insert on groups for each row execute function add_creator_as_admin();

-- Atomic, server-validated expense creation. The client never writes shares directly.
create function create_group_expense(
  p_group uuid, p_paid_by uuid, p_amount bigint, p_description text, p_category text,
  p_notes text, p_split_type text, p_date date, p_shares jsonb  -- {"<uuid>": paise}
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_sum bigint; r record;
begin
  if not is_group_member(p_group) then raise exception 'not a member of this group'; end if;
  if p_amount <= 0 then raise exception 'amount must be positive'; end if;
  if not exists(select 1 from group_members where group_id = p_group and user_id = p_paid_by and left_at is null)
    then raise exception 'payer must be an active member'; end if;
  select coalesce(sum(value::bigint),0) into v_sum from jsonb_each_text(p_shares);
  if v_sum <> p_amount then raise exception 'shares (%) must equal amount (%)', v_sum, p_amount; end if;
  for r in select key, value from jsonb_each_text(p_shares) loop
    if r.value::bigint < 0 then raise exception 'negative share'; end if;
    if not exists(select 1 from group_members where group_id = p_group and user_id = r.key::uuid and left_at is null)
      then raise exception 'participant is not an active member'; end if;
  end loop;
  insert into group_expenses(group_id,paid_by,amount_paise,description,category,notes,split_type,occurred_on,created_by)
    values (p_group,p_paid_by,p_amount,p_description,p_category,p_notes,p_split_type,p_date,auth.uid()) returning id into v_id;
  insert into group_expense_shares select v_id, key::uuid, value::bigint from jsonb_each_text(p_shares);
  return v_id;
end $$;

-- RLS
alter table profiles enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table category_budgets enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_expenses enable row level security;
alter table group_expense_shares enable row level security;
alter table group_settlements enable row level security;

create policy profiles_read on profiles for select using (
  id = auth.uid() or exists(select 1 from group_members a join group_members b on a.group_id=b.group_id
    where a.user_id = auth.uid() and b.user_id = profiles.id and a.left_at is null));
create policy profiles_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy tx_own on transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy budgets_own on budgets for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy catb_own on category_budgets for all
  using (exists(select 1 from budgets b where b.id = budget_id and b.user_id = auth.uid()))
  with check (exists(select 1 from budgets b where b.id = budget_id and b.user_id = auth.uid()));

create policy groups_read on groups for select using (is_group_member(id) or created_by = auth.uid());
create policy groups_insert on groups for insert with check (created_by = auth.uid());
create policy groups_update on groups for update using (is_group_admin(id));
create policy members_read on group_members for select using (is_group_member(group_id));
create policy members_admin_add on group_members for insert with check (is_group_admin(group_id));
create policy members_admin_update on group_members for update using (is_group_admin(group_id) or user_id = auth.uid());
create policy expenses_read on group_expenses for select using (is_group_member(group_id));
create policy shares_read on group_expense_shares for select
  using (exists(select 1 from group_expenses e where e.id = expense_id and is_group_member(e.group_id)));
create policy settle_read on group_settlements for select using (is_group_member(group_id));
-- No direct INSERT/UPDATE/DELETE on expenses, shares or settlements: writes go through RPCs (added in Phase 4).
