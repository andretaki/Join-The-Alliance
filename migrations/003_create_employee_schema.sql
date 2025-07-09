-- Create employee applications schema
CREATE SCHEMA IF NOT EXISTS employee_applications;

-- Job Postings table
CREATE TABLE IF NOT EXISTS employee_applications.job_postings (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT,
    description TEXT,
    requirements TEXT,
    reviewer_email TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Employee Applications table
CREATE TABLE IF NOT EXISTS employee_applications.employee_applications (
    id SERIAL PRIMARY KEY,
    job_posting_id INTEGER NOT NULL REFERENCES employee_applications.job_postings(id),
    
    -- Personal Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    
    -- Employment Eligibility
    eligible_to_work BOOLEAN NOT NULL,
    requires_sponsorship BOOLEAN DEFAULT FALSE,
    
    -- Files
    resume_url TEXT,
    id_photo_url TEXT,
    
    -- AI Processing
    ai_summary TEXT,
    keyword_highlights TEXT, -- JSON array of highlighted keywords
    
    -- Application Status
    status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'hired', 'rejected'
    
    -- Metadata
    ip_address TEXT,
    user_agent TEXT,
    application_completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Work Experience table
CREATE TABLE IF NOT EXISTS employee_applications.work_experience (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES employee_applications.employee_applications(id),
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    start_date TEXT NOT NULL, -- YYYY-MM format
    end_date TEXT, -- YYYY-MM format, null if current
    is_current BOOLEAN DEFAULT FALSE,
    responsibilities TEXT,
    reason_for_leaving TEXT,
    supervisor_name TEXT,
    supervisor_contact TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Education table
CREATE TABLE IF NOT EXISTS employee_applications.education (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES employee_applications.employee_applications(id),
    institution_name TEXT NOT NULL,
    degree_type TEXT, -- 'High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Certificate'
    field_of_study TEXT,
    graduation_date TEXT, -- YYYY-MM format
    gpa TEXT,
    is_completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- References table
CREATE TABLE IF NOT EXISTS employee_applications.references (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES employee_applications.employee_applications(id),
    name TEXT NOT NULL,
    relationship TEXT NOT NULL, -- 'Supervisor', 'Coworker', 'Personal', etc.
    company TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    years_known INTEGER,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Employee Signatures table
CREATE TABLE IF NOT EXISTS employee_applications.employee_signatures (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES employee_applications.employee_applications(id),
    signature_data_url TEXT NOT NULL, -- Base64 signature image
    signature_hash TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    signed_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Application Files table
CREATE TABLE IF NOT EXISTS employee_applications.application_files (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES employee_applications.employee_applications(id),
    file_type TEXT NOT NULL, -- 'resume', 'id_photo', 'cover_letter', 'certificate'
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Email Notifications table
CREATE TABLE IF NOT EXISTS employee_applications.email_notifications (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES employee_applications.employee_applications(id),
    recipient_email TEXT NOT NULL,
    email_type TEXT NOT NULL, -- 'application_received', 'application_reviewed', etc.
    subject TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW() NOT NULL,
    microsoft_message_id TEXT, -- For tracking
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Admin Users table
CREATE TABLE IF NOT EXISTS employee_applications.admin_users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin', -- 'admin', 'hr', 'reviewer'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS employee_applications_email_idx ON employee_applications.employee_applications(email);
CREATE INDEX IF NOT EXISTS employee_applications_job_posting_idx ON employee_applications.employee_applications(job_posting_id);
CREATE INDEX IF NOT EXISTS job_postings_active_idx ON employee_applications.job_postings(is_active);

-- Insert sample job postings
INSERT INTO employee_applications.job_postings (title, department, description, requirements, reviewer_email) VALUES
('Logistics Coordinator', 'Operations', 'Coordinate logistics operations and manage supply chain processes', 'Experience with logistics, TMS systems, and supply chain management', 'hr@alliancechemical.com'),
('E-commerce Specialist', 'Digital Marketing', 'Manage online sales platforms and digital marketing campaigns', 'Experience with Shopify, digital marketing, and e-commerce platforms', 'hr@alliancechemical.com'),
('Warehouse Associate', 'Operations', 'Handle chemical inventory, shipping, and receiving operations', 'Experience with chemical handling, HAZMAT certification preferred', 'operations@alliancechemical.com'),
('Customer Service Representative', 'Sales', 'Provide customer support and manage customer relationships', 'Strong communication skills and customer service experience', 'sales@alliancechemical.com')
ON CONFLICT DO NOTHING;

-- Insert sample admin user
INSERT INTO employee_applications.admin_users (email, name, role) VALUES
('admin@alliancechemical.com', 'System Administrator', 'admin')
ON CONFLICT DO NOTHING;