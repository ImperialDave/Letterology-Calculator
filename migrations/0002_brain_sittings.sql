create table if not exists brain_sittings (
  id           text primary key,
  created_at   timestamptz not null default now(),
  name         text not null,
  guest        boolean not null default true,
  user_id      text,
  token        text not null,
  seed         integer not null,
  lean         integer not null,
  grade        text not null,
  verdict      text not null,
  title        text not null,
  pattern      text not null,
  answers      jsonb not null,
  inventory    text not null
);
create index if not exists brain_sittings_created_at_idx on brain_sittings (created_at desc);
create index if not exists brain_sittings_grade_idx on brain_sittings (grade);
create index if not exists brain_sittings_token_idx on brain_sittings (token);
