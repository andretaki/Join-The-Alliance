CREATE SCHEMA "employee_applications";
--> statement-breakpoint
CREATE TABLE "employee_applications"."admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'admin',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_applications"."application_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"file_type" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_applications"."education" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"institution_name" text NOT NULL,
	"degree_type" text,
	"field_of_study" text,
	"graduation_date" text,
	"gpa" text,
	"is_completed" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_applications"."email_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"recipient_email" text NOT NULL,
	"email_type" text NOT NULL,
	"subject" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"microsoft_message_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_applications"."employee_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_posting_id" integer NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"middle_name" text,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"alternate_phone" text,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"social_security_number" text NOT NULL,
	"date_of_birth" text NOT NULL,
	"has_drivers_license" boolean DEFAULT true,
	"drivers_license_number" text,
	"drivers_license_state" text,
	"emergency_contact_name" text NOT NULL,
	"emergency_contact_relationship" text NOT NULL,
	"emergency_contact_phone" text NOT NULL,
	"emergency_contact_address" text,
	"compensation_type" text DEFAULT 'salary',
	"desired_salary" text,
	"desired_hourly_rate" text,
	"available_start_date" text NOT NULL,
	"hours_available" text NOT NULL,
	"shift_preference" text NOT NULL,
	"has_transportation" boolean NOT NULL,
	"has_been_convicted" boolean NOT NULL,
	"conviction_details" text,
	"has_previously_worked_here" boolean NOT NULL,
	"previous_work_details" text,
	"eligible_to_work" boolean NOT NULL,
	"requires_sponsorship" boolean DEFAULT false,
	"consent_to_background_check" boolean NOT NULL,
	"consent_to_drug_test" boolean NOT NULL,
	"consent_to_reference_check" boolean NOT NULL,
	"consent_to_employment_verification" boolean NOT NULL,
	"has_valid_i9_documents" boolean NOT NULL,
	"has_hazmat_experience" boolean NOT NULL,
	"has_forklift_certification" boolean NOT NULL,
	"has_chemical_handling_experience" boolean NOT NULL,
	"willing_to_obtain_certifications" boolean NOT NULL,
	"tms_mycarrier_experience" text,
	"shopify_experience" text,
	"amazon_seller_central_experience" text,
	"excel_proficiency" text,
	"canva_experience" text,
	"learning_under_pressure" text,
	"conflicting_information" text,
	"work_motivation" text,
	"delayed_shipment_scenario" text,
	"restricted_chemical_scenario" text,
	"hazmat_freight_scenario" text,
	"customer_quote_scenario" text,
	"software_learning_experience" text,
	"customer_service_motivation" text,
	"stress_management" text,
	"automation_ideas" text,
	"b2b_loyalty_factor" text,
	"data_analysis_approach" text,
	"ideal_work_environment" text,
	"resume_url" text,
	"id_photo_url" text,
	"ai_summary" text,
	"keyword_highlights" text,
	"status" text DEFAULT 'pending',
	"ip_address" text,
	"user_agent" text,
	"application_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_applications"."employee_signatures" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"signature_data_url" text NOT NULL,
	"signature_hash" text NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text NOT NULL,
	"signed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_applications"."job_postings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"department" text,
	"description" text,
	"requirements" text,
	"reviewer_email" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_applications"."references" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"company" text,
	"phone" text NOT NULL,
	"email" text,
	"years_known" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_applications"."work_experience" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"company_name" text NOT NULL,
	"job_title" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"is_current" boolean DEFAULT false,
	"responsibilities" text,
	"reason_for_leaving" text,
	"supervisor_name" text,
	"supervisor_contact" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_applications"."application_files" ADD CONSTRAINT "application_files_application_id_employee_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "employee_applications"."employee_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_applications"."education" ADD CONSTRAINT "education_application_id_employee_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "employee_applications"."employee_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_applications"."email_notifications" ADD CONSTRAINT "email_notifications_application_id_employee_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "employee_applications"."employee_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_applications"."employee_applications" ADD CONSTRAINT "employee_applications_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "employee_applications"."job_postings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_applications"."employee_signatures" ADD CONSTRAINT "employee_signatures_application_id_employee_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "employee_applications"."employee_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_applications"."references" ADD CONSTRAINT "references_application_id_employee_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "employee_applications"."employee_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_applications"."work_experience" ADD CONSTRAINT "work_experience_application_id_employee_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "employee_applications"."employee_applications"("id") ON DELETE no action ON UPDATE no action;