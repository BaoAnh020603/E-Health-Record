-- Fix medical_professionals table to support Ministry compliance
-- Add missing columns for Ministry integration

-- Add role column to medical_professionals table
ALTER TABLE medical_professionals 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'medical_professional' 
CHECK (role IN ('medical_professional', 'ministry_official', 'specialist', 'emergency_physician', 'administrator'));

-- Temporarily allow NULL user_id for sample data
ALTER TABLE medical_professionals 
ALTER COLUMN user_id DROP NOT NULL;

-- Add additional fields for Ministry compliance
ALTER TABLE medical_professionals 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS ministry_certification_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS ministry_certification_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS emergency_contact BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS available_for_review BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS review_capacity INTEGER DEFAULT 10; -- Max cases per day

-- Update existing records to have default role
UPDATE medical_professionals 
SET role = 'medical_professional' 
WHERE role IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_medical_professionals_role ON medical_professionals(role);
CREATE INDEX IF NOT EXISTS idx_medical_professionals_verification ON medical_professionals(verification_status);
CREATE INDEX IF NOT EXISTS idx_medical_professionals_ministry_approved ON medical_professionals(ministry_approved);

-- Sample data will be added separately after user accounts are created
-- For now, we'll create a function to add sample professionals when needed

-- Function to create sample Ministry official (call this after creating user accounts)
CREATE OR REPLACE FUNCTION create_sample_ministry_official(target_user_id UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    professional_id UUID;
BEGIN
    -- Use provided user_id or create a placeholder entry
    IF target_user_id IS NOT NULL THEN
        new_user_id := target_user_id;
    ELSE
        -- Skip sample data creation if no user_id provided
        RAISE NOTICE 'No user_id provided. Sample Ministry official not created.';
        RETURN NULL;
    END IF;

    -- Insert Ministry official
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
        new_user_id,
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
        user_id = EXCLUDED.user_id,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email
    RETURNING id INTO professional_id;

    RAISE NOTICE 'Created Ministry official with ID: %', professional_id;
    RETURN professional_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create sample medical professionals
CREATE OR REPLACE FUNCTION create_sample_medical_professionals(
    emergency_user_id UUID DEFAULT NULL,
    cardio_user_id UUID DEFAULT NULL,
    internal_user_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    result_text TEXT := 'Sample professionals created: ';
    professional_id UUID;
BEGIN
    -- Emergency physician
    IF emergency_user_id IS NOT NULL THEN
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
            emergency_user_id,
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
            user_id = EXCLUDED.user_id
        RETURNING id INTO professional_id;
        
        result_text := result_text || 'Emergency(' || professional_id || ') ';
    END IF;

    -- Cardiologist
    IF cardio_user_id IS NOT NULL THEN
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
            cardio_user_id,
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
            user_id = EXCLUDED.user_id
        RETURNING id INTO professional_id;
        
        result_text := result_text || 'Cardio(' || professional_id || ') ';
    END IF;

    -- Internal medicine
    IF internal_user_id IS NOT NULL THEN
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
            internal_user_id,
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
            user_id = EXCLUDED.user_id
        RETURNING id INTO professional_id;
        
        result_text := result_text || 'Internal(' || professional_id || ') ';
    END IF;

    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to work with new role column
DROP POLICY IF EXISTS "Ministry officials can view all ICD-10 codes" ON icd10_vietnam_codes;
CREATE POLICY "Ministry officials can view all ICD-10 codes" ON icd10_vietnam_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM medical_professionals mp
      WHERE mp.user_id = auth.uid()
      AND mp.role = 'ministry_official'
      AND mp.verification_status = 'verified'
    ) OR ministry_approved = true -- Allow viewing approved codes
  );

DROP POLICY IF EXISTS "Ministry officials can update review queue" ON ministry_review_queue;
CREATE POLICY "Ministry officials can update review queue" ON ministry_review_queue
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM medical_professionals mp
      WHERE mp.user_id = auth.uid()
      AND mp.role = 'ministry_official'
      AND mp.verification_status = 'verified'
    )
  );

-- Add policy for emergency physicians to access emergency cases
CREATE POLICY "Emergency physicians can access emergency cases" ON ministry_review_queue
  FOR SELECT USING (
    priority_level = 'emergency' AND
    EXISTS (
      SELECT 1 FROM medical_professionals mp
      WHERE mp.user_id = auth.uid()
      AND mp.role = 'emergency_physician'
      AND mp.verification_status = 'verified'
      AND mp.emergency_contact = true
    )
  );

-- Allow medical professionals to view their own reviews
CREATE POLICY "Medical professionals can view assigned reviews" ON ministry_review_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM medical_professionals mp
      WHERE mp.user_id = auth.uid()
      AND (mp.id = reviewer_id OR mp.verification_status = 'verified')
    )
  );

-- Function to assign reviews based on professional role and capacity
CREATE OR REPLACE FUNCTION assign_review_to_professional(
  review_id UUID,
  required_specialty VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  assigned_professional_id UUID;
BEGIN
  -- Find available professional based on specialty and capacity
  SELECT mp.id INTO assigned_professional_id
  FROM medical_professionals mp
  LEFT JOIN (
    SELECT reviewer_id, COUNT(*) as current_reviews
    FROM ministry_review_queue
    WHERE review_status = 'under_review'
    AND DATE(submission_date) = CURRENT_DATE
    GROUP BY reviewer_id
  ) current_load ON mp.id = current_load.reviewer_id
  WHERE mp.verification_status = 'verified'
    AND mp.available_for_review = true
    AND (required_specialty IS NULL OR mp.specialty = required_specialty)
    AND COALESCE(current_load.current_reviews, 0) < mp.review_capacity
  ORDER BY 
    CASE mp.role 
      WHEN 'ministry_official' THEN 1
      WHEN 'emergency_physician' THEN 2
      WHEN 'specialist' THEN 3
      ELSE 4
    END,
    COALESCE(current_load.current_reviews, 0) ASC
  LIMIT 1;

  -- Update the review with assigned professional
  IF assigned_professional_id IS NOT NULL THEN
    UPDATE ministry_review_queue
    SET 
      reviewer_id = assigned_professional_id,
      review_status = 'under_review'
    WHERE id = review_id;
  END IF;

  RETURN assigned_professional_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign reviews
CREATE OR REPLACE FUNCTION auto_assign_review()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-assign emergency cases to emergency physicians
  IF NEW.priority_level = 'emergency' THEN
    PERFORM assign_review_to_professional(NEW.id, 'Emergency Medicine');
  -- Auto-assign based on ICD-10 code specialty
  ELSIF NEW.icd10_code LIKE 'I%' THEN -- Cardiovascular
    PERFORM assign_review_to_professional(NEW.id, 'Cardiology');
  ELSIF NEW.icd10_code LIKE 'J%' THEN -- Respiratory
    PERFORM assign_review_to_professional(NEW.id, 'Pulmonology');
  ELSE
    -- General assignment
    PERFORM assign_review_to_professional(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-assignment trigger
DROP TRIGGER IF EXISTS trigger_auto_assign_review ON ministry_review_queue;
CREATE TRIGGER trigger_auto_assign_review
  AFTER INSERT ON ministry_review_queue
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_review();

COMMENT ON TABLE medical_professionals IS 'Medical professionals with Ministry compliance roles';
COMMENT ON COLUMN medical_professionals.role IS 'Professional role: medical_professional, ministry_official, specialist, emergency_physician, administrator';
COMMENT ON FUNCTION assign_review_to_professional IS 'Automatically assigns reviews to available professionals based on specialty and capacity';