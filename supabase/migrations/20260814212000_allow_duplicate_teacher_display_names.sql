-- A display name labels a teacher's own student pages; it is not an account
-- identifier. Allow different teachers to use the same natural display name.
drop index if exists public.teachers_username_key;
