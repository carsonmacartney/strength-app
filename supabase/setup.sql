-- Tin Shifters PR tracking - run this once in the Supabase SQL Editor.

create table tin_shifters_prs (
  id uuid primary key default gen_random_uuid(),
  exercise_id text not null,
  name text not null,
  entry_values jsonb not null,
  date date not null,
  created_at timestamptz not null default now()
);

alter table tin_shifters_prs enable row level security;

-- Everyone (including anonymous visitors) can read all entries.
create policy "Anyone can read PRs"
  on tin_shifters_prs for select
  to anon
  using (true);

-- Only the fixed club roster can insert. No update/delete policies exist,
-- so those stay blocked by default - every submission is a new row, history
-- is never overwritten.
create policy "Only roster names can submit PRs"
  on tin_shifters_prs for insert
  to anon
  with check (
    name in (
      'Carse', 'Matt G', 'Will G', 'Brett', 'Milts', 'Adam', 'Marek', 'Marc',
      'Grub', 'Dan', 'Gravy', 'Jacko', 'Tommy B', 'Dando', 'Sam D'
    )
  );
