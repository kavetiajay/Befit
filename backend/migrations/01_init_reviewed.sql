-- =====================================================================
-- BEFIT GYM MANAGEMENT SYSTEM DATABASE SCHEMA MIGRATION (REVIEWED)
-- STEP 4 - DATABASE TABLE EXECUTION (SECURITY HARDENED)
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. UTILITY FUNCTIONS & TRIGGERS
-- =====================================================================

-- Reusable function to automatically update "updated_at" timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to prevent profiles role change (self-promotion protection)
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        RAISE EXCEPTION 'User role changes are strictly prohibited after creation.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- =====================================================================
-- 2. TABLE DEFINITIONS
-- =====================================================================

-- Table: profiles
-- Stores user data for both trainers and clients, referencing Supabase Auth.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    profile_image_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('trainer', 'client')),
    dob DATE,
    gender TEXT,
    address TEXT,
    emergency_contact TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: trainer_client
-- Maps trainer-to-client assignments.
-- The UNIQUE constraint on client_id ensures each client has exactly one primary trainer.
CREATE TABLE public.trainer_client (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: attendance
-- Records daily check-ins for clients.
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
    check_in_time TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_client_attendance_date UNIQUE (client_id, date)
);

-- Table: workout_plans
-- Parent plan headers created by trainers and assigned to clients.
CREATE TABLE public.workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    goal TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: exercises
-- Global dictionary of reusable exercises.
CREATE TABLE public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    muscle_group TEXT,
    equipment TEXT,
    instructions TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: workout_schedules
-- Detailed exercise tasks mapped to days of the week under a parent workout plan.
CREATE TABLE public.workout_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
    sets INTEGER NOT NULL,
    reps TEXT NOT NULL,
    weight_kg NUMERIC,
    duration_seconds INTEGER,
    rest_seconds INTEGER,
    order_index INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: diet_plans
-- Nutrition logs and calorie/macronutrient plans created by trainers for clients.
CREATE TABLE public.diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    goal TEXT,
    calories INTEGER,
    protein_grams INTEGER,
    carbs_grams INTEGER,
    fat_grams INTEGER,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: diet_meals
-- Individual food items configured inside a parent diet plan.
CREATE TABLE public.diet_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diet_plan_id UUID NOT NULL REFERENCES public.diet_plans(id) ON DELETE CASCADE,
    meal_type TEXT NOT NULL,
    food_name TEXT NOT NULL,
    quantity TEXT NOT NULL,
    calories INTEGER,
    protein_grams INTEGER,
    carbs_grams INTEGER,
    fat_grams INTEGER,
    meal_time TIME,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: weight_progress
-- Logs body stats, weight updates, and measurements over time for client charts.
CREATE TABLE public.weight_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight_kg NUMERIC NOT NULL,
    body_fat_pct NUMERIC,
    chest_cm NUMERIC,
    waist_cm NUMERIC,
    hips_cm NUMERIC,
    biceps_cm NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_client_progress_date UNIQUE (client_id, date)
);

-- Table: payments
-- Membership billing, processing transaction history, renewal terms, and invoices.
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMPTZ,
    due_date DATE NOT NULL,
    membership_start DATE NOT NULL,
    membership_end DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue', 'expired')),
    payment_method TEXT CHECK (payment_method IN ('cash', 'upi', 'card', 'bank_transfer')),
    transaction_id TEXT UNIQUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: notifications
-- Alerts generated for membership due dates, diet/workout updates, and messages.
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('payment', 'workout', 'diet', 'attendance', 'general')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ
);

-- =====================================================================
-- 3. ASSIGN TRIGGERS
-- =====================================================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON public.workout_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_schedules_updated_at BEFORE UPDATE ON public.workout_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diet_plans_updated_at BEFORE UPDATE ON public.diet_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diet_meals_updated_at BEFORE UPDATE ON public.diet_meals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Bind the role-change prevention trigger to public.profiles
CREATE TRIGGER check_profile_role_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_change();

-- =====================================================================
-- 4. SECURITY DEFINER HELPERS (Recursion & search_path hardened)
-- =====================================================================

-- Queries profiles.role securely. Explicit search_path stops search hijacking.
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Verifies if a client is assigned to a specific trainer. Safe from RLS recursion.
CREATE OR REPLACE FUNCTION public.is_client_assigned_to_trainer(client_uuid UUID, trainer_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trainer_client
    WHERE client_id = client_uuid AND trainer_id = trainer_uuid
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_catalog;

-- =====================================================================
-- 5. ROW-LEVEL SECURITY (RLS) ACTIVATION
-- =====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_client ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 6. RLS POLICIES DEFINITION
-- =====================================================================

-- 6.1 PROFILES POLICIES
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_select_trainers" ON public.profiles FOR SELECT TO authenticated USING (role = 'trainer');
CREATE POLICY "profiles_select_assigned_clients" ON public.profiles FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'trainer' AND role = 'client');
CREATE POLICY "profiles_insert_own_client" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id AND role = 'client');
CREATE POLICY "profiles_insert_clients_by_trainer" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'trainer' AND role = 'client');
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_clients_by_trainer" ON public.profiles FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'trainer' AND role = 'client') WITH CHECK (public.get_user_role(auth.uid()) = 'trainer' AND role = 'client');

-- 6.2 TRAINER-CLIENT ASSIGNMENT POLICIES
CREATE POLICY "trainer_client_select" ON public.trainer_client FOR SELECT TO authenticated USING (client_id = auth.uid() OR trainer_id = auth.uid());
CREATE POLICY "trainer_client_insert" ON public.trainer_client FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid() AND public.get_user_role(client_id) = 'client');
CREATE POLICY "trainer_client_update" ON public.trainer_client FOR UPDATE TO authenticated USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid() AND public.get_user_role(client_id) = 'client');
CREATE POLICY "trainer_client_delete" ON public.trainer_client FOR DELETE TO authenticated USING (trainer_id = auth.uid());

-- 6.3 ATTENDANCE POLICIES
CREATE POLICY "attendance_select_client" ON public.attendance FOR SELECT TO authenticated USING (client_id = auth.uid());
CREATE POLICY "attendance_select_trainer" ON public.attendance FOR SELECT TO authenticated USING (public.is_client_assigned_to_trainer(client_id, auth.uid()));
CREATE POLICY "attendance_insert_trainer" ON public.attendance FOR INSERT TO authenticated WITH CHECK (public.is_client_assigned_to_trainer(client_id, auth.uid()));
CREATE POLICY "attendance_update_trainer" ON public.attendance FOR UPDATE TO authenticated USING (public.is_client_assigned_to_trainer(client_id, auth.uid())) WITH CHECK (public.is_client_assigned_to_trainer(client_id, auth.uid()));
CREATE POLICY "attendance_delete_trainer" ON public.attendance FOR DELETE TO authenticated USING (public.is_client_assigned_to_trainer(client_id, auth.uid()));

-- 6.4 WORKOUT PLANS POLICIES
CREATE POLICY "workout_plans_select_client" ON public.workout_plans FOR SELECT TO authenticated USING (client_id = auth.uid());
CREATE POLICY "workout_plans_select_trainer" ON public.workout_plans FOR SELECT TO authenticated USING (trainer_id = auth.uid());
CREATE POLICY "workout_plans_insert_trainer" ON public.workout_plans FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid() AND public.is_client_assigned_to_trainer(client_id, auth.uid()));
CREATE POLICY "workout_plans_update_trainer" ON public.workout_plans FOR UPDATE TO authenticated USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid() AND public.is_client_assigned_to_trainer(client_id, auth.uid()));
CREATE POLICY "workout_plans_delete_trainer" ON public.workout_plans FOR DELETE TO authenticated USING (trainer_id = auth.uid());

-- 6.5 EXERCISES POLICIES (Authentication required)
CREATE POLICY "exercises_select" ON public.exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "exercises_write_trainer" ON public.exercises FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'trainer') WITH CHECK (public.get_user_role(auth.uid()) = 'trainer');

-- 6.6 WORKOUT SCHEDULES POLICIES
CREATE POLICY "workout_schedules_select_client" ON public.workout_schedules FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.workout_plans
    WHERE workout_plans.id = workout_schedules.workout_plan_id
    AND workout_plans.client_id = auth.uid()
  )
);
CREATE POLICY "workout_schedules_select_trainer" ON public.workout_schedules FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.workout_plans
    WHERE workout_plans.id = workout_schedules.workout_plan_id
    AND workout_plans.trainer_id = auth.uid()
  )
);
CREATE POLICY "workout_schedules_write_trainer" ON public.workout_schedules FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.workout_plans
    WHERE workout_plans.id = workout_schedules.workout_plan_id
    AND workout_plans.trainer_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_plans
    WHERE workout_plans.id = workout_schedules.workout_plan_id
    AND workout_plans.trainer_id = auth.uid()
  )
);

-- 6.7 DIET PLANS POLICIES
CREATE POLICY "diet_plans_select_client" ON public.diet_plans FOR SELECT TO authenticated USING (client_id = auth.uid());
CREATE POLICY "diet_plans_select_trainer" ON public.diet_plans FOR SELECT TO authenticated USING (trainer_id = auth.uid());
CREATE POLICY "diet_plans_insert_trainer" ON public.diet_plans FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid() AND public.is_client_assigned_to_trainer(client_id, auth.uid()));
CREATE POLICY "diet_plans_update_trainer" ON public.diet_plans FOR UPDATE TO authenticated USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid() AND public.is_client_assigned_to_trainer(client_id, auth.uid()));
CREATE POLICY "diet_plans_delete_trainer" ON public.diet_plans FOR DELETE TO authenticated USING (trainer_id = auth.uid());

-- 6.8 DIET MEALS POLICIES
CREATE POLICY "diet_meals_select_client" ON public.diet_meals FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.diet_plans
    WHERE diet_plans.id = diet_meals.diet_plan_id
    AND diet_plans.client_id = auth.uid()
  )
);
CREATE POLICY "diet_meals_select_trainer" ON public.diet_meals FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.diet_plans
    WHERE diet_plans.id = diet_meals.diet_plan_id
    AND diet_plans.trainer_id = auth.uid()
  )
);
CREATE POLICY "diet_meals_write_trainer" ON public.diet_meals FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.diet_plans
    WHERE diet_plans.id = diet_meals.diet_plan_id
    AND diet_plans.trainer_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.diet_plans
    WHERE diet_plans.id = diet_meals.diet_plan_id
    AND diet_plans.trainer_id = auth.uid()
  )
);

-- 6.9 WEIGHT PROGRESS POLICIES
CREATE POLICY "weight_progress_select_client" ON public.weight_progress FOR SELECT TO authenticated USING (client_id = auth.uid());
CREATE POLICY "weight_progress_write_client" ON public.weight_progress FOR ALL TO authenticated USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());
CREATE POLICY "weight_progress_select_trainer" ON public.weight_progress FOR SELECT TO authenticated USING (public.is_client_assigned_to_trainer(client_id, auth.uid()));
CREATE POLICY "weight_progress_write_trainer" ON public.weight_progress FOR ALL TO authenticated USING (public.is_client_assigned_to_trainer(client_id, auth.uid())) WITH CHECK (public.is_client_assigned_to_trainer(client_id, auth.uid()));

-- 6.10 PAYMENTS POLICIES (Client SELECT only protection)
CREATE POLICY "payments_select_client" ON public.payments FOR SELECT TO authenticated USING (client_id = auth.uid());
CREATE POLICY "payments_select_trainer" ON public.payments FOR SELECT TO authenticated USING (public.is_client_assigned_to_trainer(client_id, auth.uid()));
CREATE POLICY "payments_write_trainer" ON public.payments FOR ALL TO authenticated USING (public.is_client_assigned_to_trainer(client_id, auth.uid())) WITH CHECK (public.is_client_assigned_to_trainer(client_id, auth.uid()));

-- 6.11 NOTIFICATIONS POLICIES
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND (NEW.title = OLD.title AND NEW.message = OLD.message AND NEW.type = OLD.type AND NEW.user_id = OLD.user_id));
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_insert_trainer" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'trainer' AND public.is_client_assigned_to_trainer(user_id, auth.uid()));

-- =====================================================================
-- 7. PERFORMANCE INDEXES
-- =====================================================================

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_trainer_client_trainer ON public.trainer_client(trainer_id);
CREATE INDEX idx_trainer_client_client ON public.trainer_client(client_id);
CREATE INDEX idx_attendance_client_date ON public.attendance(client_id, date);
CREATE INDEX idx_workout_plans_client ON public.workout_plans(client_id);
CREATE INDEX idx_workout_plans_active ON public.workout_plans(is_active);
CREATE INDEX idx_workout_schedules_plan ON public.workout_schedules(workout_plan_id);
CREATE INDEX idx_diet_plans_client ON public.diet_plans(client_id);
CREATE INDEX idx_diet_plans_active ON public.diet_plans(is_active);
CREATE INDEX idx_diet_meals_plan ON public.diet_meals(diet_plan_id);
CREATE INDEX idx_weight_progress_client_date ON public.weight_progress(client_id, date);
CREATE INDEX idx_payments_client ON public.payments(client_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_due_date ON public.payments(due_date);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read);
