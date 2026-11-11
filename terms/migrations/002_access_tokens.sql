alter table agreements add column if not exists client_token text;
alter table agreements add column if not exists freelancer_token text;

update agreements
set
  client_token = coalesce(client_token, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')),
  freelancer_token = coalesce(freelancer_token, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
where client_token is null or freelancer_token is null;

create unique index if not exists agreements_client_token_uidx on agreements (client_token);
create unique index if not exists agreements_freelancer_token_uidx on agreements (freelancer_token);

create table if not exists create_attempts (
  id bigserial primary key,
  ip text not null,
  created_at timestamptz not null default now()
);
create index if not exists create_attempts_ip_created_idx on create_attempts (ip, created_at);
