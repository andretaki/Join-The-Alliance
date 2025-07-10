import { z } from 'zod';

// Personal Information Schema - EXPANDED for full employee application
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  middleName: z.string().max(50, 'Middle name too long').optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long'),
  alternatePhone: z.string().max(15, 'Alternate phone too long').optional(),
  address: z.string().min(5, 'Address is required').max(200, 'Address too long'),
  city: z.string().min(1, 'City is required').max(50, 'City too long'),
  state: z.string().min(2, 'State is required').max(50, 'State too long'),
  zipCode: z.string().min(5, 'ZIP code must be at least 5 digits').max(10, 'ZIP code too long'),
  
  // ✅ CRITICAL EMPLOYEE INFO
  socialSecurityNumber: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, 'SSN must be in XXX-XX-XXXX format'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
  driversLicenseNumber: z.string().min(1, 'Driver\'s license number is required').max(20, 'License number too long'),
  driversLicenseState: z.string().min(2, 'License state is required').max(2, 'Use 2-letter state code'),
  
  // Emergency Contact
  emergencyContactName: z.string().min(1, 'Emergency contact name is required').max(100, 'Name too long'),
  emergencyContactRelationship: z.string().min(1, 'Relationship is required').max(50, 'Relationship too long'),
  emergencyContactPhone: z.string().min(10, 'Emergency contact phone is required').max(15, 'Phone too long'),
  emergencyContactAddress: z.string().max(200, 'Address too long').optional(),
  
  // Employment Information
  desiredSalary: z.string().max(20, 'Salary expectation too long').optional(),
  availableStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  hoursAvailable: z.enum(['full-time', 'part-time', 'either'], { 
    errorMap: () => ({ message: 'Please select hours available' }) 
  }),
  shiftPreference: z.enum(['day', 'evening', 'night', 'rotating', 'any'], { 
    errorMap: () => ({ message: 'Please select shift preference' }) 
  }),
  
  // Additional Information
  hasTransportation: z.boolean(),
  hasBeenConvicted: z.boolean(),
  convictionDetails: z.string().max(500, 'Details too long').optional(),
  hasPreviouslyWorkedHere: z.boolean(),
  previousWorkDetails: z.string().max(500, 'Details too long').optional(),
});

// Employment Eligibility Schema - EXPANDED
export const eligibilitySchema = z.object({
  eligibleToWork: z.boolean().refine(val => val === true, 'You must be eligible to work in the United States'),
  requiresSponsorship: z.boolean(),
  
  // ✅ ADDITIONAL EMPLOYMENT CONSENTS
  consentToBackgroundCheck: z.boolean().refine(val => val === true, 'You must consent to background check'),
  consentToDrugTest: z.boolean().refine(val => val === true, 'You must consent to drug testing'),
  consentToReferenceCheck: z.boolean().refine(val => val === true, 'You must consent to reference verification'),
  consentToEmploymentVerification: z.boolean().refine(val => val === true, 'You must consent to employment verification'),
  
  // I-9 Documentation
  hasValidI9Documents: z.boolean().refine(val => val === true, 'You must have valid I-9 documentation'),
  
  // Chemical Industry Specific
  hasHazmatExperience: z.boolean(),
  hasForkliftCertification: z.boolean(),
  hasChemicalHandlingExperience: z.boolean(),
  willingToObtainCertifications: z.boolean(),
});

// Work Experience Schema
export const workExperienceSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
  jobTitle: z.string().min(1, 'Job title is required').max(100, 'Job title too long'),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Start date must be in YYYY-MM format'),
  endDate: z.string().regex(/^\d{4}-\d{2}$/, 'End date must be in YYYY-MM format').optional(),
  isCurrent: z.boolean(),
  responsibilities: z.string().max(1000, 'Responsibilities too long').optional(),
  reasonForLeaving: z.string().max(500, 'Reason for leaving too long').optional(),
  supervisorName: z.string().max(100, 'Supervisor name too long').optional(),
  supervisorContact: z.string().max(100, 'Supervisor contact too long').optional(),
});

// Education Schema
export const educationSchema = z.object({
  institutionName: z.string().min(1, 'Institution name is required').max(100, 'Institution name too long'),
  degreeType: z.enum(['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Certificate', 'Other']),
  fieldOfStudy: z.string().max(100, 'Field of study too long').optional(),
  graduationDate: z.string().regex(/^\d{4}-\d{2}$/, 'Graduation date must be in YYYY-MM format').optional(),
  gpa: z.string().max(10, 'GPA too long').optional(),
  isCompleted: z.boolean(),
});

// References Schema
export const referenceSchema = z.object({
  name: z.string().min(1, 'Reference name is required').max(100, 'Reference name too long'),
  relationship: z.string().min(1, 'Relationship is required').max(50, 'Relationship too long'),
  company: z.string().max(100, 'Company name too long').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long'),
  email: z.string().email('Invalid email address').optional(),
  yearsKnown: z.number().min(0, 'Years known must be positive').max(50, 'Years known too high').optional(),
});

// File Upload Schema
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  fileType: z.enum(['resume', 'id_photo', 'cover_letter', 'certificate']),
});

// Job Posting Schema
export const jobPostingSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(100, 'Job title too long'),
  department: z.string().max(50, 'Department name too long').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  requirements: z.string().max(2000, 'Requirements too long').optional(),
  reviewerEmail: z.string().email('Invalid reviewer email address'),
  isActive: z.boolean(),
});

// Complete Employee Application Schema
export const employeeApplicationSchema = z.object({
  jobPostingId: z.coerce.number().min(1, 'Please select a position'),
  
  // Personal Information
  personalInfo: personalInfoSchema,
  
  // Employment Eligibility
  eligibility: eligibilitySchema,
  
  // Work Experience (array)
  workExperience: z.array(workExperienceSchema).min(1, 'At least one work experience is required'),
  
  // Education (array)
  education: z.array(educationSchema).min(1, 'At least one education entry is required'),
  
  // References (array)
  references: z.array(referenceSchema).min(2, 'At least two references are required').max(5, 'Maximum 5 references allowed'),
  
  // Digital Signature
  signatureDataUrl: z.string().min(1, 'Digital signature is required'),
  
  // Terms and Conditions
  termsAgreed: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions'),
  
  // Optional fields
  additionalInfo: z.string().max(1000, 'Additional information too long').optional(),
});

// AI Processing Schema
export const aiProcessingSchema = z.object({
  resumeText: z.string(),
  jobDescription: z.string(),
  applicationData: z.object({
    personalInfo: personalInfoSchema,
    workExperience: z.array(workExperienceSchema),
    education: z.array(educationSchema),
  }),
});

// Admin User Schema
export const adminUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.enum(['admin', 'hr', 'reviewer']),
  isActive: z.boolean(),
});

// Form Step Validation Schemas (for multi-step form)
export const stepPersonalInfoSchema = personalInfoSchema.merge(eligibilitySchema);

export const stepWorkExperienceSchema = z.object({
  workExperience: z.array(workExperienceSchema).min(1, 'At least one work experience is required'),
});

export const stepEducationSchema = z.object({
  education: z.array(educationSchema).min(1, 'At least one education entry is required'),
});

export const stepReferencesSchema = z.object({
  references: z.array(referenceSchema).min(2, 'At least two references are required').max(5, 'Maximum 5 references allowed'),
});

export const stepFilesSchema = z.object({
  resumeFile: z.instanceof(File).optional(),
  idPhotoFile: z.instanceof(File).optional(),
});

export const stepSignatureSchema = z.object({
  signatureDataUrl: z.string().min(1, 'Digital signature is required'),
  termsAgreed: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions'),
});

// File validation helpers
export const ALLOWED_RESUME_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
export const ALLOWED_ID_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const validateFileType = (file: File, allowedTypes: string[]) => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSize: number = MAX_FILE_SIZE) => {
  return file.size <= maxSize;
};

// Keywords for AI highlighting (chemical distribution company)
export const INDUSTRY_KEYWORDS = [
  // Logistics & Supply Chain
  'logistics', 'supply chain', 'warehouse', 'distribution', 'shipping', 'receiving',
  'inventory', 'fulfillment', 'transportation', 'freight', 'cargo', 'dispatch',
  
  // Chemical Industry
  'chemical', 'hazmat', 'hazardous materials', 'msds', 'safety data sheet',
  'dot', 'osha', 'epa', 'regulatory compliance', 'chemical handling',
  
  // E-commerce & Technology
  'shopify', 'ecommerce', 'e-commerce', 'web development', 'online sales',
  'digital marketing', 'seo', 'customer service', 'order management',
  
  // Software & Systems
  'tms', 'wms', 'erp', 'shipstation', 'quickbooks', 'sage', 'excel',
  'database', 'sql', 'api', 'integration', 'automation',
  
  // Sales & Customer Service
  'sales', 'account management', 'customer service', 'crm', 'b2b',
  'procurement', 'purchasing', 'vendor management', 'negotiations',
  
  // Operations & Management
  'operations', 'management', 'leadership', 'team lead', 'supervisor',
  'quality control', 'process improvement', 'lean', 'six sigma',
];

// Export all schemas
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type WorkExperience = z.infer<typeof workExperienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Reference = z.infer<typeof referenceSchema>;
export type EmployeeApplicationForm = z.infer<typeof employeeApplicationSchema>;
export type JobPostingForm = z.infer<typeof jobPostingSchema>;
export type AdminUserForm = z.infer<typeof adminUserSchema>;