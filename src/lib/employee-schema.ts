import { pgTable, serial, text, timestamp, boolean, integer, index, pgSchema } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Define schema for employee applications
export const employeeSchema = pgSchema('employee_applications');

// === EMPLOYEE APPLICATION TABLES ===

// Job Postings table (managed by Admin)
export const jobPostings = employeeSchema.table('job_postings', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  department: text('department'),
  description: text('description'),
  requirements: text('requirements'),
  reviewerEmail: text('reviewer_email').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Employee Applications table
export const employeeApplications = employeeSchema.table('employee_applications', {
  id: serial('id').primaryKey(),
  jobPostingId: integer('job_posting_id').references(() => jobPostings.id).notNull(),
  
  // Personal Information - EXPANDED
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  middleName: text('middle_name'),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  alternatePhone: text('alternate_phone'),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  
  // ✅ CRITICAL EMPLOYEE INFO - ENCRYPTED FIELDS
  socialSecurityNumber: text('social_security_number').notNull(), // Will be encrypted
  dateOfBirth: text('date_of_birth').notNull(), // YYYY-MM-DD format
  hasDriversLicense: boolean('has_drivers_license').default(true),
  driversLicenseNumber: text('drivers_license_number'), // Optional now
  driversLicenseState: text('drivers_license_state'), // Optional now
  
  // Emergency Contact
  emergencyContactName: text('emergency_contact_name').notNull(),
  emergencyContactRelationship: text('emergency_contact_relationship').notNull(),
  emergencyContactPhone: text('emergency_contact_phone').notNull(),
  emergencyContactAddress: text('emergency_contact_address'),
  
  // Employment Information
  compensationType: text('compensation_type').default('salary'), // 'salary' or 'hourly'
  desiredSalary: text('desired_salary'),
  desiredHourlyRate: text('desired_hourly_rate'),
  availableStartDate: text('available_start_date').notNull(), // YYYY-MM-DD format
  hoursAvailable: text('hours_available').notNull(), // 'full-time', 'part-time', 'either'
  shiftPreference: text('shift_preference').notNull(), // 'day', 'evening', 'night', 'rotating', 'any'
  
  // Additional Information
  hasTransportation: boolean('has_transportation').notNull(),
  hasBeenConvicted: boolean('has_been_convicted').notNull(),
  convictionDetails: text('conviction_details'),
  hasPreviouslyWorkedHere: boolean('has_previously_worked_here').notNull(),
  previousWorkDetails: text('previous_work_details'),
  
  // Employment Eligibility - EXPANDED
  eligibleToWork: boolean('eligible_to_work').notNull(),
  requiresSponsorship: boolean('requires_sponsorship').default(false),
  
  // ✅ EMPLOYMENT CONSENTS
  consentToBackgroundCheck: boolean('consent_to_background_check').notNull(),
  consentToDrugTest: boolean('consent_to_drug_test').notNull(),
  consentToReferenceCheck: boolean('consent_to_reference_check').notNull(),
  consentToEmploymentVerification: boolean('consent_to_employment_verification').notNull(),
  
  // I-9 Documentation
  hasValidI9Documents: boolean('has_valid_i9_documents').notNull(),
  
  // Chemical Industry Specific
  hasHazmatExperience: boolean('has_hazmat_experience').notNull(),
  hasForkliftCertification: boolean('has_forklift_certification').notNull(),
  hasChemicalHandlingExperience: boolean('has_chemical_handling_experience').notNull(),
  willingToObtainCertifications: boolean('willing_to_obtain_certifications').notNull(),
  
  // ✅ ROLE ASSESSMENT - Customer Service Specialist
  // Technical Platform Experience
  tmsMyCarrierExperience: text('tms_mycarrier_experience'), // none, basic, intermediate, advanced, expert
  shopifyExperience: text('shopify_experience'), // Detailed text response
  amazonSellerCentralExperience: text('amazon_seller_central_experience'), // none, basic, intermediate, advanced
  excelProficiency: text('excel_proficiency'), // basic, intermediate, advanced - general business software proficiency
  canvaExperience: text('canva_experience'), // Detailed text response
  
  // Personal Work Style Assessment
  learningUnderPressure: text('learning_under_pressure'), // Detailed text response
  conflictingInformation: text('conflicting_information'), // Detailed text response
  workMotivation: text('work_motivation'), // Detailed text response
  
  // Customer Service Scenarios
  delayedShipmentScenario: text('delayed_shipment_scenario'), // Detailed text response
  restrictedChemicalScenario: text('restricted_chemical_scenario'), // Detailed text response
  hazmatFreightScenario: text('hazmat_freight_scenario'), // Detailed text response
  customerQuoteScenario: text('customer_quote_scenario'), // Detailed text response
  
  // Personal & Professional Assessment
  softwareLearningExperience: text('software_learning_experience'), // Detailed text response
  customerServiceMotivation: text('customer_service_motivation'), // JSON array of selected options
  stressManagement: text('stress_management'), // Detailed text response
  automationIdeas: text('automation_ideas'), // Detailed text response
  
  // Advanced Role Assessment
  b2bLoyaltyFactor: text('b2b_loyalty_factor'), // reliability, communication, expertise, pricing, relationships
  dataAnalysisApproach: text('data_analysis_approach'), // Detailed text response
  idealWorkEnvironment: text('ideal_work_environment'), // Detailed text response
  
  // Files
  resumeUrl: text('resume_url'),
  idPhotoUrl: text('id_photo_url'),
  
  // AI Processing
  aiSummary: text('ai_summary'),
  keywordHighlights: text('keyword_highlights'), // JSON array of highlighted keywords
  
  // Application Status
  status: text('status').default('pending'), // 'pending', 'reviewed', 'hired', 'rejected'
  
  // Metadata
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  applicationCompletedAt: timestamp('application_completed_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Work Experience table
export const workExperience = employeeSchema.table('work_experience', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => employeeApplications.id).notNull(),
  companyName: text('company_name').notNull(),
  jobTitle: text('job_title').notNull(),
  startDate: text('start_date').notNull(), // YYYY-MM format
  endDate: text('end_date'), // YYYY-MM format, null if current
  isCurrent: boolean('is_current').default(false),
  responsibilities: text('responsibilities'),
  reasonForLeaving: text('reason_for_leaving'),
  supervisorName: text('supervisor_name'),
  supervisorContact: text('supervisor_contact'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Education table
export const education = employeeSchema.table('education', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => employeeApplications.id).notNull(),
  institutionName: text('institution_name').notNull(),
  degreeType: text('degree_type'), // 'High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Certificate'
  fieldOfStudy: text('field_of_study'),
  graduationDate: text('graduation_date'), // YYYY-MM format
  gpa: text('gpa'),
  isCompleted: boolean('is_completed').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// References table
export const references = employeeSchema.table('references', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => employeeApplications.id).notNull(),
  name: text('name').notNull(),
  relationship: text('relationship').notNull(), // 'Supervisor', 'Coworker', 'Personal', etc.
  company: text('company'),
  phone: text('phone').notNull(),
  email: text('email'),
  yearsKnown: integer('years_known'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Digital Signatures table (reused from credit app)
export const employeeSignatures = employeeSchema.table('employee_signatures', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => employeeApplications.id).notNull(),
  signatureDataUrl: text('signature_data_url').notNull(), // Base64 signature image
  signatureHash: text('signature_hash').notNull(),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent').notNull(),
  signedAt: timestamp('signed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Application Files table (for resume, ID, additional docs)
export const applicationFiles = employeeSchema.table('application_files', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => employeeApplications.id).notNull(),
  fileType: text('file_type').notNull(), // 'resume', 'id_photo', 'cover_letter', 'certificate'
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Email Notifications table (track what was sent)
export const emailNotifications = employeeSchema.table('email_notifications', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => employeeApplications.id).notNull(),
  recipientEmail: text('recipient_email').notNull(),
  emailType: text('email_type').notNull(), // 'application_received', 'application_reviewed', etc.
  subject: text('subject').notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  microsoftMessageId: text('microsoft_message_id'), // For tracking
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Admin Users table (for job posting management)
export const adminUsers = employeeSchema.table('admin_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').default('admin'), // 'admin', 'hr', 'reviewer'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Indexes for better performance - TEMPORARILY DISABLED TO FIX JSON PARSING ERROR
// TODO: Re-enable after investigating Drizzle ORM build-time issue
// export const employeeApplicationsEmailIndex = index('employee_applications_email_idx').on(employeeApplications.email);
// export const employeeApplicationsJobPostingIndex = index('employee_applications_job_posting_idx').on(employeeApplications.jobPostingId);
// export const jobPostingsActiveIndex = index('job_postings_active_idx').on(jobPostings.isActive);

// Export types for TypeScript inference
export type JobPosting = typeof jobPostings.$inferSelect;
export type EmployeeApplication = typeof employeeApplications.$inferSelect;
export type WorkExperience = typeof workExperience.$inferSelect;
export type Education = typeof education.$inferSelect;
export type Reference = typeof references.$inferSelect;
export type EmployeeSignature = typeof employeeSignatures.$inferSelect;
export type ApplicationFile = typeof applicationFiles.$inferSelect;
export type EmailNotification = typeof emailNotifications.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;

// Insert types
export type NewJobPosting = typeof jobPostings.$inferInsert;
export type NewEmployeeApplication = typeof employeeApplications.$inferInsert;
export type NewWorkExperience = typeof workExperience.$inferInsert;
export type NewEducation = typeof education.$inferInsert;
export type NewReference = typeof references.$inferInsert;
export type NewEmployeeSignature = typeof employeeSignatures.$inferInsert;
export type NewApplicationFile = typeof applicationFiles.$inferInsert;
export type NewEmailNotification = typeof emailNotifications.$inferInsert;
export type NewAdminUser = typeof adminUsers.$inferInsert;