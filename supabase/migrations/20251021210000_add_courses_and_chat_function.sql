DROP TABLE IF EXISTS public.courses CASCADE;

-- 1. Create the 'courses' table
create table if not exists public.courses (
    id uuid not null default gen_random_uuid() primary key,
    name text not null,
    description text,
    created_by uuid references public.profiles(id),
    created_at timestamp with time zone not null default now()
);

comment on table public.courses is 'Stores course information.';

-- 2. Set up Row Level Security (RLS)
alter table public.courses enable row level security;

create policy "Users can see their own courses"
on public.courses for select
using ( auth.uid() = created_by );

create policy "Lecturers can insert courses"
on public.courses for insert
to authenticated
with check ( (select role from public.profiles where id = auth.uid()) = 'lecturer' and auth.uid() = created_by );

create policy "Lecturers can update their own courses"
on public.courses for update
using ( (select role from public.profiles where id = auth.uid()) = 'lecturer' and auth.uid() = created_by );

create policy "Lecturers can delete their own courses"
on public.courses for delete
using ( (select role from public.profiles where id = auth.uid()) = 'lecturer' and auth.uid() = created_by );


-- 3. Create the RPC function to get or create a chat
--    NOTE: This is a placeholder. The logic for finding a class rep
--    and creating a chat needs to be implemented based on your specific schema
--    for 'class_reps', 'chats', and 'chat_participants'.
create or replace function public.create_or_get_chat_with_class_rep(p_course_id uuid)
returns uuid
language plpgsql
as $$
begin
  -- TODO: Implement the logic to:
  -- 1. Find the user_id of the class rep for the given p_course_id.
  -- 2. Check if a 1-on-1 chat already exists between the lecturer (auth.uid()) and the class rep.
  -- 3. If a chat exists, return its id.
  -- 4. If not, create a new chat, add both users as participants, and return the new chat's id.
  -- For now, returning null to avoid errors.
  return null;
end;
$$;
