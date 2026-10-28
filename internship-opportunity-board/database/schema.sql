-- Internship Opportunity Board database schema
-- Run this script in Supabase Dashboard > SQL Editor.
-- The Express server uses the service-role key on the server only and performs authorization checks.
-- RLS is enabled as defense in depth; never expose the service-role key to the browser.

create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  name varchar(80) not null check (char_length(trim(name)) between 2 and 80),
  email varchar(254) not null unique,
  password_hash text not null,
  role varchar(20) not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.internships (
  id uuid primary key default gen_random_uuid(),
  title varchar(140) not null,
  company varchar(120) not null,
  field varchar(80) not null,
  location varchar(120) not null,
  work_mode varchar(20) not null check (work_mode in ('Remote', 'Hybrid', 'On-site')),
  stipend varchar(100),
  duration varchar(80),
  skills text[] not null default '{}',
  description varchar(4000) not null,
  apply_url text not null check (apply_url ~* '^https?://'),
  deadline date,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_internships (
  user_id uuid not null references public.app_users(id) on delete cascade,
  internship_id uuid not null references public.internships(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, internship_id)
);

create index if not exists internships_created_at_idx on public.internships (created_at desc);
create index if not exists internships_field_idx on public.internships (field);
create index if not exists internships_work_mode_idx on public.internships (work_mode);
create index if not exists saved_internships_internship_id_idx on public.saved_internships (internship_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_users_set_updated_at on public.app_users;
create trigger app_users_set_updated_at before update on public.app_users
for each row execute function public.set_updated_at();

drop trigger if exists internships_set_updated_at on public.internships;
create trigger internships_set_updated_at before update on public.internships
for each row execute function public.set_updated_at();

alter table public.app_users enable row level security;
alter table public.internships enable row level security;
alter table public.saved_internships enable row level security;

-- No anonymous/authenticated table policies are created because this MVP accesses
-- PostgreSQL only through the Express backend with the service-role key.
-- The service-role key bypasses RLS and MUST remain in backend/.env only.
-- Backend routes enforce student/admin permissions before changing data.

-- Optional demo listings (safe to run once; URLs are illustrative demo destinations).
insert into public.internships
(title, company, field, location, work_mode, stipend, duration, skills, description, apply_url, deadline)
select 'Frontend Developer Intern', 'BrightLabs Demo', 'Software Development', 'Remote', 'Remote', '₹10,000/month', '3 months',
       array['HTML', 'CSS', 'JavaScript'], 'Demo listing: build accessible web pages, collaborate with mentors, and learn practical frontend development. Replace this sample with a real opportunity before publishing.',
       'https://example.com/', current_date + 30
where not exists (select 1 from public.internships where title = 'Frontend Developer Intern' and company = 'BrightLabs Demo');

insert into public.internships
(title, company, field, location, work_mode, stipend, duration, skills, description, apply_url, deadline)
select 'UI/UX Design Intern', 'Northstar Demo', 'Design', 'Hyderabad', 'Hybrid', '₹8,000/month', '2 months',
       array['Figma', 'Wireframing', 'Prototyping'], 'Demo listing: help prepare wireframes, improve user flows, and create simple prototypes with feedback from a design mentor. Replace this sample with a real opportunity before publishing.',
       'https://example.com/', current_date + 45
where not exists (select 1 from public.internships where title = 'UI/UX Design Intern' and company = 'Northstar Demo');

insert into public.internships
(title, company, field, location, work_mode, stipend, duration, skills, description, apply_url, deadline)
select 'Data Analyst Intern', 'DataSpring Demo', 'Data Analytics', 'Remote', 'Remote', 'Unpaid', '6 weeks',
       array['Excel', 'SQL', 'Data Visualization'], 'Demo listing: practice cleaning datasets, preparing summaries, and explaining findings clearly. This is sample content only, not a real vacancy.',
       'https://example.com/', current_date + 60
where not exists (select 1 from public.internships where title = 'Data Analyst Intern' and company = 'DataSpring Demo');
