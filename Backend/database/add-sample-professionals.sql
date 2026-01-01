-- Add Sample Medical Professionals
-- Run this AFTER creating user accounts in Supabase Auth

-- Instructions:
-- 1. First create user accounts in Supabase Auth dashboard or through your app
-- 2. Get the user IDs from auth.users table
-- 3. Replace the UUIDs below with actual user IDs
-- 4. Run this script

-- Example: Get existing user IDs
-- SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Replace these UUIDs with actual user IDs from your auth.users table
DO $$
DECLARE
    ministry_user_id UUID;
    emergency_user_id UUID;
    cardio_user_id UUID;
    internal_user_id UUID;
BEGIN
    -- Try to get existing user IDs (modify these queries based on your actual users)
    -- If you have specific users, replace with their actual UUIDs
    
    -- For demonstration, we'll create placeholder entries
    -- In production, replace these with actual user IDs
    
    -- Example of how to get user IDs by email:
    -- SELECT id INTO ministry_user_id FROM auth.users WHERE email = 'ministry@example.com';
    -- SELECT id INTO emergency_user_id FROM auth.users WHERE email = 'emergency@example.com';
    
    -- For now, let's just create the professional records without user associations
    -- You can update them later with actual user IDs
    
    RAISE NOTICE 'Creating sample medical professionals...';
    
    -- Ministry Official (without user_id for now)
    INSERT INTO medical_professionals (
        user_id,
        license_number,
        specialty,
        hospital_affiliation,
        verification_status,
        ministry_approved,
        role,
        full_name,
        email,
        ministry_certification_number,
        ministry_certification_date,
        emergency_contact,
        available_for_review
    ) VALUES (
        NULL, -- Set this to actual user_id later
        'MOH-OFFICIAL-001',
        'Public Health Administration',
        'Ministry of Health Vietnam',
        'verified',
        true,
        'ministry_official',
        'Dr. Nguyen Van Ministry',
        'ministry.official@moh.gov.vn',
        'MOH-CERT-2024-001',
        NOW(),
        true,
        true
    ) ON CONFLICT (license_number) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        ministry_certification_number = EXCLUDED.ministry_certification_number;

    -- Emergency Physician
    INSERT INTO medical_professionals (
        user_id,
        license_number,
        specialty,
        hospital_affiliation,
        verification_status,
        ministry_approved,
        role,
        full_name,
        email,
        emergency_contact,
        available_for_review,
        review_capacity
    ) VALUES (
        NULL, -- Set this to actual user_id later
        'MD-EMERGENCY-001',
        'Emergency Medicine',
        'Bach Mai Hospital',
        'verified',
        true,
        'emergency_physician',
        'Dr. Tran Thi Emergency',
        'emergency.doctor@bachmai.vn',
        true,
        true,
        20
    ) ON CONFLICT (license_number) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        emergency_contact = EXCLUDED.emergency_contact;

    -- Cardiologist
    INSERT INTO medical_professionals (
        user_id,
        license_number,
        specialty,
        hospital_affiliation,
        verification_status,
        ministry_approved,
        role,
        full_name,
        email,
        emergency_contact,
        available_for_review,
        review_capacity
    ) VALUES (
        NULL, -- Set this to actual user_id later
        'MD-CARDIO-001',
        'Cardiology',
        'Vietnam Heart Institute',
        'verified',
        true,
        'specialist',
        'Dr. Le Van Cardio',
        'cardio.specialist@heartinstitute.vn',
        false,
        true,
        15
    ) ON CONFLICT (license_number) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    -- Internal Medicine Doctor
    INSERT INTO medical_professionals (
        user_id,
        license_number,
        specialty,
        hospital_affiliation,
        verification_status,
        ministry_approved,
        role,
        full_name,
        email,
        emergency_contact,
        available_for_review,
        review_capacity
    ) VALUES (
        NULL, -- Set this to actual user_id later
        'MD-INTERNAL-001',
        'Internal Medicine',
        'Cho Ray Hospital',
        'verified',
        true,
        'medical_professional',
        'Dr. Pham Thi Internal',
        'internal.medicine@choray.vn',
        false,
        true,
        12
    ) ON CONFLICT (license_number) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    RAISE NOTICE 'Sample medical professionals created successfully!';
    RAISE NOTICE 'Remember to update user_id fields with actual user IDs from auth.users';
END $$;

-- Helper query to update user_id after creating auth users
-- UPDATE medical_professionals 
-- SET user_id = (SELECT id FROM auth.users WHERE email = 'ministry.official@moh.gov.vn')
-- WHERE license_number = 'MOH-OFFICIAL-001';

-- UPDATE medical_professionals 
-- SET user_id = (SELECT id FROM auth.users WHERE email = 'emergency.doctor@bachmai.vn')
-- WHERE license_number = 'MD-EMERGENCY-001';

-- UPDATE medical_professionals 
-- SET user_id = (SELECT id FROM auth.users WHERE email = 'cardio.specialist@heartinstitute.vn')
-- WHERE license_number = 'MD-CARDIO-001';

-- UPDATE medical_professionals 
-- SET user_id = (SELECT id FROM auth.users WHERE email = 'internal.medicine@choray.vn')
-- WHERE license_number = 'MD-INTERNAL-001';

-- Verify the sample data
SELECT 
    license_number,
    full_name,
    specialty,
    role,
    verification_status,
    ministry_approved,
    CASE WHEN user_id IS NULL THEN 'No user linked' ELSE 'User linked' END as user_status
FROM medical_professionals 
WHERE license_number IN ('MOH-OFFICIAL-001', 'MD-EMERGENCY-001', 'MD-CARDIO-001', 'MD-INTERNAL-001')
ORDER BY role, license_number;