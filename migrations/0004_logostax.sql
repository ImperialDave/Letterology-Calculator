-- Logostax solves and hosted tables.
-- Solo play stays on the phone. These tables keep a signed-in history and a shared table.

create table if not exists solves (
  id text primary key,
  user_id text not null,
  puzzle_id text not null,
  answer text not null,
  length integer not null,
  kind text not null,
  puzzle_date text not null,
  status text not null,
  guesses integer not null,
  elapsed_ms integer not null,
  hard boolean not null default false,
  played_at timestamptz not null default now(),
  unique (user_id, puzzle_id)
);

create index if not exists solves_user_played_idx on solves (user_id, played_at desc);
create index if not exists solves_answer_idx on solves (answer);
create table if not exists tournaments (
  id text primary key,
  host_id text not null,
  title text not null,
  seats integer not null,
  rounds integer not null,
  length integer not null,
  status text not null,
  created_at timestamptz not null default now(),
  started_at timestamptz
);

create table if not exists tournament_rounds (
  tournament_id text not null references tournaments (id) on delete cascade,
  round_index integer not null,
  answer text not null,
  primary key (tournament_id, round_index)
);

create table if not exists tournament_players (
  tournament_id text not null references tournaments (id) on delete cascade,
  user_id text not null,
  display_name text not null,
  joined_at timestamptz not null default now(),
  primary key (tournament_id, user_id)
);

create index if not exists tournament_players_user_idx on tournament_players (user_id, joined_at desc);

create table if not exists tournament_plays (
  tournament_id text not null references tournaments (id) on delete cascade,
  user_id text not null,
  round_index integer not null,
  guesses jsonb not null default '[]'::jsonb,
  status text not null default 'playing',
  started_at timestamptz,
  finished_at timestamptz,
  elapsed_ms integer not null default 0,
  primary key (tournament_id, user_id, round_index)
);

create index if not exists tournament_plays_table_idx on tournament_plays (tournament_id, round_index);
