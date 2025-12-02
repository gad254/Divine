import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ogdsnbkhbunutzagjcps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nZHNuYmtoYnVudXR6YWdqY3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODA4MzgsImV4cCI6MjA4MDI1NjgzOH0.Zcwk98M5ReT-7z9EShwC40WnFtyVwwNxiDwxjNsKUkM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * SQL Schema Requirement:
 * 
 * create table public.profiles (
 *   id uuid references auth.users on delete cascade not null primary key,
 *   name text,
 *   age int,
 *   bio text,
 *   location text,
 *   job text,
 *   interests text[],
 *   photos jsonb,
 *   image_seed int,
 *   is_verified boolean default false,
 *   coins int default 100,
 *   is_boost_active boolean default false,
 *   boost_end_time bigint
 * );
 */