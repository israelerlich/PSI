create extension if not exists pgcrypto;

create type public.modality as enum ('online', 'presencial');
create type public.session_status as enum (
  'AGENDADA',
  'REMANEJADA',
  'CANCELADA',
  'CONCLUIDA',
  'NAO_COMPARECEU'
);
create type public.payment_status as enum ('PENDENTE', 'PAGO');
create type public.invoice_status as enum (
  'not_required',
  'ready',
  'queued',
  'issued',
  'failed'
);
create type public.charge_status as enum (
  'not_sent',
  'pix_sent',
  'paid',
  'overdue'
);
create type public.receipt_status as enum ('not_ready', 'ready', 'sent');
create type public.record_template as enum ('DAP', 'BIRP');
create type public.session_origin as enum (
  'dashboard',
  'whatsapp_sdr',
  'whatsapp_recepcionista'
);
create type public.notification_type as enum (
  'lead',
  'session',
  'reschedule',
  'cancel',
  'handoff',
  'conflict'
);

create table public.psychologist_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  crp text not null,
  whatsapp text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agent_settings (
  psychologist_id uuid primary key references public.psychologist_profiles (id) on delete cascade,
  persona text not null default 'Acolhedor e objetivo',
  pricing_strategy text not null default 'Discutir valores pessoalmente',
  price_min_cents integer,
  price_max_cents integer,
  child_care_enabled boolean not null default false,
  waitlist_acceptance_hours integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.availability_windows (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologist_profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  modality public.modality not null,
  created_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologist_profiles (id) on delete cascade,
  full_name text not null,
  whatsapp text not null,
  email text,
  birth_date date,
  modality public.modality not null,
  general_notes text,
  archived boolean not null default false,
  created_from text not null default 'dashboard' check (created_from in ('dashboard', 'sdr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (psychologist_id, whatsapp)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologist_profiles (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  modality public.modality not null,
  status public.session_status not null default 'AGENDADA',
  payment_status public.payment_status not null default 'PENDENTE',
  confirmation_status text not null default 'pending' check (
    confirmation_status in (
      'pending',
      'confirmed',
      'reschedule_requested',
      'rescheduled',
      'manual_review'
    )
  ),
  attendance_status text not null default 'expected' check (
    attendance_status in ('expected', 'present', 'missed', 'excused')
  ),
  amount_cents integer check (amount_cents >= 0),
  invoice_status public.invoice_status not null default 'not_required',
  charge_status public.charge_status not null default 'not_sent',
  receipt_status public.receipt_status not null default 'not_ready',
  origin public.session_origin not null default 'dashboard',
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create table public.personal_blocks (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologist_profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  conflict_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create table public.clinical_records (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologist_profiles (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete restrict,
  session_id uuid references public.sessions (id) on delete set null,
  template public.record_template not null,
  content jsonb not null,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologist_profiles (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete restrict,
  session_id uuid references public.sessions (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.billing_entries (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologist_profiles (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete restrict,
  session_id uuid references public.sessions (id) on delete set null,
  service_type text not null,
  service_date timestamptz not null,
  amount_cents integer not null check (amount_cents >= 0),
  payment_status public.payment_status not null default 'PENDENTE',
  charge_status public.charge_status not null default 'not_sent',
  invoice_status public.invoice_status not null default 'not_required',
  receipt_status public.receipt_status not null default 'not_ready',
  due_date timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologist_profiles (id) on delete cascade,
  title text not null,
  category text not null check (
    category in ('confirmacao', 'reagendamento', 'documentos', 'orientacao', 'cobranca')
  ),
  channel text not null default 'whatsapp' check (channel in ('whatsapp', 'email')),
  approved boolean not null default false,
  tone text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologist_profiles (id) on delete cascade,
  title text not null,
  trigger_description text not null,
  action_description text not null,
  status text not null default 'active' check (status in ('active', 'paused')),
  human_tone text not null,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clinical_attachments (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologist_profiles (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete restrict,
  title text not null,
  kind text not null check (kind in ('documento', 'anexo', 'termo', 'encaminhamento')),
  storage_path text,
  protected boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.patient_consents (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologist_profiles (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete restrict,
  title text not null,
  status text not null default 'pending' check (status in ('signed', 'pending', 'expired')),
  signed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.patient_timeline (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologist_profiles (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete restrict,
  happened_at timestamptz not null,
  title text not null,
  detail text not null,
  kind text not null check (
    kind in ('sessao', 'evolucao', 'documento', 'financeiro', 'mensagem')
  ),
  created_at timestamptz not null default now()
);

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologist_profiles (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  desired_modality public.modality,
  position integer not null,
  status text not null default 'waiting' check (status in ('waiting', 'offered', 'accepted', 'expired', 'removed')),
  offered_slot_start timestamptz,
  offered_slot_end timestamptz,
  offer_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologist_profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  detail text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologist_profiles (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete set null,
  phone text not null,
  role text not null check (role in ('sdr', 'recepcionista')),
  state jsonb not null default '{}'::jsonb,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique (psychologist_id, phone)
);

create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.whatsapp_conversations (id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  created_at timestamptz not null default now()
);

create index sessions_psychologist_starts_idx on public.sessions (psychologist_id, starts_at);
create index patients_psychologist_archived_idx on public.patients (psychologist_id, archived);
create index clinical_records_patient_created_idx on public.clinical_records (patient_id, created_at desc);
create index notes_patient_created_idx on public.notes (patient_id, created_at desc);
create index billing_entries_patient_service_idx on public.billing_entries (patient_id, service_date desc);
create index billing_entries_psychologist_due_idx on public.billing_entries (psychologist_id, due_date);
create index clinical_attachments_patient_created_idx on public.clinical_attachments (patient_id, created_at desc);
create index patient_consents_patient_status_idx on public.patient_consents (patient_id, status);
create index patient_timeline_patient_happened_idx on public.patient_timeline (patient_id, happened_at desc);
create index notifications_psychologist_created_idx on public.notifications (psychologist_id, created_at desc);

create or replace function public.prevent_clinical_record_delete_before_retention()
returns trigger
language plpgsql
as $$
begin
  if old.created_at > now() - interval '5 years' then
    raise exception 'Clinical records must be retained for at least 5 years.';
  end if;

  return old;
end;
$$;

create trigger clinical_records_retention_guard
before delete on public.clinical_records
for each row execute function public.prevent_clinical_record_delete_before_retention();

create or replace function public.prevent_session_note_delete_before_retention()
returns trigger
language plpgsql
as $$
begin
  if old.session_id is not null and old.created_at > now() - interval '5 years' then
    raise exception 'Session notes must be retained for at least 5 years.';
  end if;

  return old;
end;
$$;

create trigger notes_retention_guard
before delete on public.notes
for each row execute function public.prevent_session_note_delete_before_retention();

alter table public.psychologist_profiles enable row level security;
alter table public.agent_settings enable row level security;
alter table public.availability_windows enable row level security;
alter table public.patients enable row level security;
alter table public.sessions enable row level security;
alter table public.personal_blocks enable row level security;
alter table public.clinical_records enable row level security;
alter table public.notes enable row level security;
alter table public.billing_entries enable row level security;
alter table public.message_templates enable row level security;
alter table public.automation_rules enable row level security;
alter table public.clinical_attachments enable row level security;
alter table public.patient_consents enable row level security;
alter table public.patient_timeline enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.notifications enable row level security;
alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_messages enable row level security;

create policy "profiles are owned by the authenticated psychologist"
on public.psychologist_profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "agent settings are owned by psychologist"
on public.agent_settings
for all
using (auth.uid() = psychologist_id)
with check (auth.uid() = psychologist_id);

create policy "availability is owned by psychologist"
on public.availability_windows
for all
using (auth.uid() = psychologist_id)
with check (auth.uid() = psychologist_id);

create policy "patients are owned by psychologist"
on public.patients
for all
using (auth.uid() = psychologist_id)
with check (auth.uid() = psychologist_id);

create policy "sessions are owned by psychologist"
on public.sessions
for all
using (auth.uid() = psychologist_id)
with check (auth.uid() = psychologist_id);

create policy "blocks are owned by psychologist"
on public.personal_blocks
for all
using (auth.uid() = psychologist_id)
with check (auth.uid() = psychologist_id);

create policy "clinical records are owned by psychologist"
on public.clinical_records
for all
using (auth.uid() = psychologist_id)
with check (auth.uid() = psychologist_id);

create policy "notes are owned by psychologist"
on public.notes
for all
using (auth.uid() = psychologist_id)
with check (auth.uid() = psychologist_id);

create policy "billing entries are owned by psychologist"
on public.billing_entries
for all
using (auth.uid() = psychologist_id)
with check (auth.uid() = psychologist_id);

create policy "message templates are owned by psychologist"
on public.message_templates
for all
using (auth.uid() = psychologist_id)
with check (auth.uid() = psychologist_id);

create policy "automation rules are owned by psychologist"
on public.automation_rules
for all
using (auth.uid() = psychologist_id)
with check (auth.uid() = psychologist_id);

create policy "clinical attachments are owned by psychologist"
on public.clinical_attachments
for all
using (auth.uid() = psychologist_id)
with check (auth.uid() = psychologist_id);

create policy "patient consents are owned by psychologist"
on public.patient_consents
for all
using (auth.uid() = psychologist_id)
with check (auth.uid() = psychologist_id);

create policy "patient timeline is owned by psychologist"
on public.patient_timeline
for all
using (auth.uid() = psychologist_id)
with check (auth.uid() = psychologist_id);

create policy "waitlist is owned by psychologist"
on public.waitlist_entries
for all
using (auth.uid() = psychologist_id)
with check (auth.uid() = psychologist_id);

create policy "notifications are owned by psychologist"
on public.notifications
for all
using (auth.uid() = psychologist_id)
with check (auth.uid() = psychologist_id);

create policy "conversations are owned by psychologist"
on public.whatsapp_conversations
for all
using (auth.uid() = psychologist_id)
with check (auth.uid() = psychologist_id);

create policy "messages follow conversation owner"
on public.whatsapp_messages
for all
using (
  exists (
    select 1
    from public.whatsapp_conversations c
    where c.id = whatsapp_messages.conversation_id
      and c.psychologist_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.whatsapp_conversations c
    where c.id = whatsapp_messages.conversation_id
      and c.psychologist_id = auth.uid()
  )
);
