-- =====================================================================
-- BEFIT GYM MANAGEMENT SYSTEM SCHEMA VERIFICATION QUERIES
-- STEP 4 - DATABASE TABLE EXECUTION
-- =====================================================================

-- Run these queries in the Supabase SQL Editor to verify the migration status.

-- 1. VERIFY ALL 11 TABLES EXIST IN THE PUBLIC SCHEMA
-- Should return exactly 11 rows.
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'trainer_client', 'attendance', 'workout_plans', 
    'exercises', 'workout_schedules', 'diet_plans', 'diet_meals', 
    'weight_progress', 'payments', 'notifications'
  )
ORDER BY table_name;

-- 2. VERIFY ROW LEVEL SECURITY (RLS) IS ENABLED
-- rowsecurity should be "true" for all 11 tables.
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 'trainer_client', 'attendance', 'workout_plans', 
    'exercises', 'workout_schedules', 'diet_plans', 'diet_meals', 
    'weight_progress', 'payments', 'notifications'
  )
ORDER BY tablename;

-- 3. CHECK THE APPLIED RLS POLICIES
-- Displays a list of all active security policies.
SELECT tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. CHECK THE CREATED INDEXES
-- Displays a list of performance indexes.
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'trainer_client', 'attendance', 'workout_plans', 
    'exercises', 'workout_schedules', 'diet_plans', 'diet_meals', 
    'weight_progress', 'payments', 'notifications'
  )
ORDER BY tablename, indexname;

-- 5. CONFIRM DATABASE IS EMPTY (NO SAMPLE/FAKE DATA)
-- All counts must return 0.
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM public.trainer_client) as trainer_client_count,
  (SELECT COUNT(*) FROM public.attendance) as attendance_count,
  (SELECT COUNT(*) FROM public.workout_plans) as workout_plans_count,
  (SELECT COUNT(*) FROM public.exercises) as exercises_count,
  (SELECT COUNT(*) FROM public.workout_schedules) as workout_schedules_count,
  (SELECT COUNT(*) FROM public.diet_plans) as diet_plans_count,
  (SELECT COUNT(*) FROM public.diet_meals) as diet_meals_count,
  (SELECT COUNT(*) FROM public.weight_progress) as weight_progress_count,
  (SELECT COUNT(*) FROM public.payments) as payments_count,
  (SELECT COUNT(*) FROM public.notifications) as notifications_count;
