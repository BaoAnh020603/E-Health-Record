-- Fix RLS Policies for Medical Validation System
-- Run this if you're getting RLS warnings in Supabase

-- Enable RLS on all tables
ALTER TABLE medical_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions_validated ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Medical professionals can view their own profile" ON medical_professionals;
DROP POLICY IF EXISTS "Medical professionals can update their own profile" ON medical_professionals;
DROP POLICY IF EXISTS "Only verified professionals can access review queue" ON medical_review_queue;
DROP POLICY IF EXISTS "Users can view their own predictions" ON ai_predictions_validated;
DROP POLICY IF EXISTS "Users can insert their own predictions" ON ai_predictions_validated;
DROP POLICY IF EXISTS "Medical knowledge base is readable by all authenticated users" ON medical_knowledge_base;
DROP POLICY IF EXISTS "Only verified professionals can update knowledge base" ON medical_knowledge_base;
DROP POLICY IF EXISTS "Emergency protocols are readable by all authenticated users" ON emergency_protocols;
DROP POLICY IF EXISTS "Only verified professionals can manage emergency protocols" ON emergency_protocols;
DROP POLICY IF EXISTS "Medical professionals can view audit logs" ON medical_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON medical_audit_log;

-- Medical Professionals Table Policies
CREATE POLICY "Medical professionals can view their own profile" ON medical_professionals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Medical professionals can update their own profile" ON medical_professionals
    FOR UPDATE USING (auth.uid() = user_id);

-- Medical Knowledge Base Policies (Public read access for authenticated users)
CREATE POLICY "Medical knowledge base is readable by all authenticated users" ON medical_knowledge_base
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only verified professionals can update knowledge base" ON medical_knowledge_base
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
            AND ministry_approved = true
        )
    );

CREATE POLICY "Only verified professionals can modify knowledge base" ON medical_knowledge_base
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
            AND ministry_approved = true
        )
    );

-- Emergency Protocols Policies (Public read access for authenticated users)
CREATE POLICY "Emergency protocols are readable by all authenticated users" ON emergency_protocols
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only verified professionals can manage emergency protocols" ON emergency_protocols
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
            AND ministry_approved = true
        )
    );

CREATE POLICY "Only verified professionals can update emergency protocols" ON emergency_protocols
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
            AND ministry_approved = true
        )
    );

-- AI Predictions Policies (Users can only access their own data)
CREATE POLICY "Users can view their own predictions" ON ai_predictions_validated
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions" ON ai_predictions_validated
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" ON ai_predictions_validated
    FOR UPDATE USING (auth.uid() = user_id);

-- Medical Review Queue Policies (Only for verified professionals)
CREATE POLICY "Only verified professionals can access review queue" ON medical_review_queue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
        )
    );

CREATE POLICY "Only verified professionals can update review queue" ON medical_review_queue
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
        )
    );

CREATE POLICY "System can insert into review queue" ON medical_review_queue
    FOR INSERT WITH CHECK (true);

-- Audit Log Policies (Restricted access)
CREATE POLICY "Medical professionals can view audit logs" ON medical_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
        )
    );

CREATE POLICY "System can insert audit logs" ON medical_audit_log
    FOR INSERT WITH CHECK (true);

-- Verify RLS is enabled (this should return 't' for all tables)
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'medical_professionals',
    'medical_knowledge_base', 
    'ai_predictions_validated',
    'medical_review_queue',
    'emergency_protocols',
    'medical_audit_log'
)
ORDER BY tablename;