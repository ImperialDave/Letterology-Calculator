create table if not exists threshold_sittings (
  id           text primary key,
  created_at   timestamptz not null default now(),
  handle       text not null,
  house        text not null default '',
  hours        text not null default '',
  user_id      text,
  written      jsonb not null,
  scales       jsonb not null,
  scenes       jsonb not null,
  axes         jsonb not null,
  inventory    text not null
);
create index if not exists threshold_sittings_created_at_idx on threshold_sittings (created_at desc);
