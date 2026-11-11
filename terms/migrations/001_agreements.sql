create table if not exists agreements (
  id text primary key,
  payload text not null,
  freelancer_signed_name text,
  freelancer_signature text,
  freelancer_signed_at timestamptz,
  client_signed_name text,
  client_signature text,
  client_signed_at timestamptz,
  created_at timestamptz not null default now()
);
