ALTER TABLE "employee_applications"."employee_applications" ALTER COLUMN "shift_preference" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_applications"."employee_applications" ALTER COLUMN "has_valid_i9_documents" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_applications"."employee_applications" DROP COLUMN "restricted_chemical_scenario";