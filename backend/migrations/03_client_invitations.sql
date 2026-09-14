-- =====================================================================
-- BEFIT CLIENT INVITATION SYSTEM SCHEMA MIGRATION
-- STEP 1: CREATE CLIENT INVITATIONS TABLE WITH SECURE TOKEN HASHING
-- =====================================================================

-- Table: client_invitations
-- Manages secure, single-use, time-expiring invitations issued by trainers to prospective clients.
-- SECURITY NOTE: The raw invitation token is NEVER stored in the database.
-- Only a one-way cryptographic SHA-256 hash (token_hash) is stored.
CREATE TABLE IF NOT EXISTS public.client_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- INDEXES FOR HIGH-PERFORMANCE AND UNIQUE LOOKUPS
-- =====================================================================

-- Index for fast token validation upon invitation link access
CREATE INDEX IF NOT EXISTS idx_client_invitations_token_hash 
    ON public.client_invitations (token_hash);

-- Index for trainer lookup of issued invitations
CREATE INDEX IF NOT EXISTS idx_client_invitations_trainer_id 
    ON public.client_invitations (trainer_id);

-- Composite index for checking existing pending invitations for a specific email
CREATE INDEX IF NOT EXISTS idx_client_invitations_email_status 
    ON public.client_invitations (client_email, status);

-- Composite index for fast expiration filtering and cleanup queries
CREATE INDEX IF NOT EXISTS idx_client_invitations_status_expires 
    ON public.client_invitations (status, expires_at);

-- =====================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS on client_invitations table
ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;

-- 1. SELECT POLICY: Authenticated trainers can only view invitations they created.
CREATE POLICY "invitations_select_trainer" 
    ON public.client_invitations 
    FOR SELECT 
    TO authenticated 
    USING (trainer_id = auth.uid());

-- 2. INSERT POLICY: Authenticated trainers can only create invitations assigned to themselves.
CREATE POLICY "invitations_insert_trainer" 
    ON public.client_invitations 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        trainer_id = auth.uid() 
        AND public.get_user_role(auth.uid()) = 'trainer'
    );

-- 3. UPDATE POLICY: Authenticated trainers can only update/revoke invitations they created.
CREATE POLICY "invitations_update_trainer" 
    ON public.client_invitations 
    FOR UPDATE 
    TO authenticated 
    USING (
        trainer_id = auth.uid() 
        AND public.get_user_role(auth.uid()) = 'trainer'
    ) 
    WITH CHECK (
        trainer_id = auth.uid() 
        AND public.get_user_role(auth.uid()) = 'trainer'
    );

-- 4. DELETE POLICY: Authenticated trainers can only delete invitations they created.
CREATE POLICY "invitations_delete_trainer" 
    ON public.client_invitations 
    FOR DELETE 
    TO authenticated 
    USING (
        trainer_id = auth.uid() 
        AND public.get_user_role(auth.uid()) = 'trainer'
    );

-- Direct public/anonymous access is strictly denied.
-- Public client acceptance & registration will be validated server-side using the elevated SUPABASE_SECRET_KEY.
