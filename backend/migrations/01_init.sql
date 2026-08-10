-- =====================================================================
-- BEFIT GYM MANAGEMENT SYSTEM DATABASE SCHEMA MIGRATION
-- STEP 4 - DATABASE TABLE EXECUTION
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
-- The UNIQUE constraint on client_id ensures each client is assigned to one primary trainer at a time.
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
-- 3. ASSIGN TIMESTAMP TRIGGERS
-- =====================================================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON public.workout_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_schedules_updated_at BEFORE UPDATE ON public.workout_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diet_plans_updated_at BEFORE UPDATE ON public.diet_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diet_meals_updated_at BEFORE UPDATE ON public.diet_meals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- 4. SECURITY DEFINER HELPER
-- =====================================================================

-- Queries the profiles.role table securely (bypassing RLS checks on profiles to avoid infinite recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

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

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Trainers can view client profiles" ON public.profiles FOR SELECT USING (public.get_user_role(auth.uid()) = 'trainer' AND role = 'client');
CREATE POLICY "Users can view trainers" ON public.profiles FOR SELECT USING (role = 'trainer');
CREATE POLICY "Trainers can insert client profiles" ON public.profiles FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'trainer' AND role = 'client');
CREATE POLICY "Trainers can update client profiles" ON public.profiles FOR UPDATE USING (public.get_user_role(auth.uid()) = 'trainer' AND role = 'client');

-- Trainer-Client Assignment Policies
CREATE POLICY "Clients can view their trainer assignment" ON public.trainer_client FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Trainers can manage their client assignments" ON public.trainer_client FOR ALL USING (trainer_id = auth.uid());

-- Attendance Policies
CREATE POLICY "Clients can view their own attendance" ON public.attendance FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Trainers can manage attendance for assigned clients" ON public.attendance FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.trainer_client
    WHERE trainer_client.trainer_id = auth.uid()
    AND trainer_client.client_id = attendance.client_id
  )
);

-- Workout Plans Policies
CREATE POLICY "Clients can view their own workout plans" ON public.workout_plans FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Trainers can manage their own created workout plans" ON public.workout_plans FOR ALL USING (trainer_id = auth.uid());

-- Workout Schedules Policies
CREATE POLICY "Clients can view their own workout schedules" ON public.workout_schedules FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workout_plans
    WHERE workout_plans.id = workout_schedules.workout_plan_id
    AND workout_plans.client_id = auth.uid()
  )
);
CREATE POLICY "Trainers can manage schedules on their plans" ON public.workout_schedules FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.workout_plans
    WHERE workout_plans.id = workout_schedules.workout_plan_id
    AND workout_plans.trainer_id = auth.uid()
  )
);

-- Exercises Policies
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Trainers can manage exercises" ON public.exercises FOR ALL USING (public.get_user_role(auth.uid()) = 'trainer');

-- Diet Plans Policies
CREATE POLICY "Clients can view their own diet plans" ON public.diet_plans FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Trainers can manage their created diet plans" ON public.diet_plans FOR ALL USING (trainer_id = auth.uid());

-- Diet Meals Policies
CREATE POLICY "Clients can view their own diet meals" ON public.diet_meals FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.diet_plans
    WHERE diet_plans.id = diet_meals.diet_plan_id
    AND diet_plans.client_id = auth.uid()
  )
);
CREATE POLICY "Trainers can manage meals on their diet plans" ON public.diet_meals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.diet_plans
    WHERE diet_plans.id = diet_meals.diet_plan_id
    AND diet_plans.trainer_id = auth.uid()
  )
);

-- Weight Progress Policies
CREATE POLICY "Clients can manage their own weight progress" ON public.weight_progress FOR ALL USING (client_id = auth.uid());
CREATE POLICY "Trainers can view progress of assigned clients" ON public.weight_progress FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.trainer_client
    WHERE trainer_client.trainer_id = auth.uid()
    AND trainer_client.client_id = weight_progress.client_id
  )
);

-- Payments Policies
CREATE POLICY "Clients can view their own payments" ON public.payments FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Trainers can manage payments for assigned clients" ON public.payments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.trainer_client
    WHERE trainer_client.trainer_id = auth.uid()
    AND trainer_client.client_id = payments.client_id
  )
);

-- Notifications Policies
CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Trainers can insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'trainer');

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
