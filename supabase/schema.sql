-- ==========================================
-- TRUNG BẮC CẠN - SUPABASE SCHEMA
-- ==========================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
create type user_role as enum ('admin', 'office', 'field_worker');
create type form_status as enum ('draft', 'pending_sync', 'synced', 'submitted', 'approved', 'rejected');

-- 3. TABLES

-- Workspaces (Tenants)
create table workspaces (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  workspace_id uuid references workspaces(id) on delete set null,
  role user_role default 'field_worker' not null,
  full_name text,
  phone_number text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Projects
create table projects (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  name text not null,
  description text,
  location text,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references profiles(id) on delete set null
);

-- Field Forms (Nhập liệu hiện trường)
create table field_forms (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  project_id uuid references projects(id) on delete cascade not null,
  submitted_by uuid references profiles(id) on delete set null,
  title text not null,
  form_data jsonb not null default '{}'::jsonb, -- Dữ liệu form linh hoạt
  status form_status default 'synced' not null,
  device_local_id text, -- Để map với IndexedDB local ID
  synced_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Form Media (Ảnh/Chứng từ đính kèm)
create table form_media (
  id uuid default uuid_generate_v4() primary key,
  form_id uuid references field_forms(id) on delete cascade not null,
  storage_path text not null, -- Path trong Supabase Storage bucket
  file_name text not null,
  file_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ROW LEVEL SECURITY (RLS)

alter table workspaces enable row level security;
alter table profiles enable row level security;
alter table projects enable row level security;
alter table field_forms enable row level security;
alter table form_media enable row level security;

-- Policies for Profiles
create policy "Users can view profiles in their workspace" 
on profiles for select 
using (workspace_id = (select workspace_id from profiles where id = auth.uid()));

create policy "Users can update own profile" 
on profiles for update 
using (id = auth.uid());

-- Policies for Projects
create policy "Users can view projects in their workspace" 
on projects for select 
using (workspace_id = (select workspace_id from profiles where id = auth.uid()));

-- Policies for Field Forms
create policy "Users can view forms in their workspace" 
on field_forms for select 
using (workspace_id = (select workspace_id from profiles where id = auth.uid()));

create policy "Field workers can insert forms" 
on field_forms for insert 
with check (workspace_id = (select workspace_id from profiles where id = auth.uid()));

create policy "Field workers can update own forms" 
on field_forms for update 
using (submitted_by = auth.uid());

-- 5. TRIGGERS
-- Automatically create profile on auth.users insert (Supabase specific function needed here)
