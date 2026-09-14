-- =====================================================================
-- BEFIT MIGRATION 04: CLIENT PROFILE & MEASUREMENTS COMPLETION
-- Adds columns to persist goal, height, medical background, and thigh metric
-- =====================================================================

-- 1. Add fitness goal, height, and health background columns to public.profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS goal TEXT,
    ADD COLUMN IF NOT EXISTS height NUMERIC,
    ADD COLUMN IF NOT EXISTS medical_conditions TEXT,
    ADD COLUMN IF NOT EXISTS allergies TEXT,
    ADD COLUMN IF NOT EXISTS injuries TEXT;

-- 2. Add thigh circumference measurement column to public.weight_progress
ALTER TABLE public.weight_progress
    ADD COLUMN IF NOT EXISTS thigh_cm NUMERIC;

-- 3. Documentation comments for schema clarity
COMMENT ON COLUMN public.profiles.goal IS 'Primary fitness objective (e.g. Weight Loss, Muscle Gain, General Fitness)';
COMMENT ON COLUMN public.profiles.height IS 'Client height in centimeters (cm)';
COMMENT ON COLUMN public.profiles.medical_conditions IS 'Medical background & conditions recorded during invitation onboarding';
COMMENT ON COLUMN public.profiles.allergies IS 'Allergies recorded during invitation onboarding';
COMMENT ON COLUMN public.profiles.injuries IS 'Physical injuries recorded during invitation onboarding';
COMMENT ON COLUMN public.weight_progress.thigh_cm IS 'Thigh circumference in centimeters (cm)';
