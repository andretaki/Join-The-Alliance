-- Fix nullable columns that were removed from the form
-- Make shift_preference and has_valid_i9_documents nullable

-- Update shift_preference column to be nullable
ALTER TABLE employee_applications.employee_applications 
ALTER COLUMN shift_preference DROP NOT NULL;

-- Update has_valid_i9_documents column to be nullable
ALTER TABLE employee_applications.employee_applications 
ALTER COLUMN has_valid_i9_documents DROP NOT NULL;

-- Add comments for clarity
COMMENT ON COLUMN employee_applications.employee_applications.shift_preference IS 'Optional - removed from form, legacy field';
COMMENT ON COLUMN employee_applications.employee_applications.has_valid_i9_documents IS 'Optional - removed from form, legacy field';