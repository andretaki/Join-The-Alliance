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
  hasDriversLicense: z.boolean().default(true),
  driversLicenseNumber: z.string().max(20, 'License number too long').optional(),
  driversLicenseState: z.string().max(2, 'Use 2-letter state code').optional(),
  
  // Emergency Contact
  emergencyContactName: z.string().min(1, 'Emergency contact name is required').max(100, 'Name too long'),
  emergencyContactRelationship: z.string().min(1, 'Relationship is required').max(50, 'Relationship too long'),
  emergencyContactPhone: z.string().min(10, 'Emergency contact phone is required').max(15, 'Phone too long'),
  emergencyContactAddress: z.string().max(200, 'Address too long').optional(),
  
  // Employment Information
  compensationType: z.enum(['salary', 'hourly']).default('salary'),
  desiredSalary: z.string().max(20, 'Salary expectation too long').optional(),
  desiredHourlyRate: z.string().max(20, 'Hourly rate too long').optional(),
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
}).refine((data) => {
  // If user has a driver's license, then license number and state are required
  if (data.hasDriversLicense) {
    return data.driversLicenseNumber && data.driversLicenseNumber.length > 0 && 
           data.driversLicenseState && data.driversLicenseState.length === 2;
  }
  return true;
}, {
  message: 'Driver\'s license number and state are required when you have a driver\'s license',
  path: ['driversLicenseNumber'], // This will show the error on the license number field
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

// ✅ ROLE ASSESSMENT Schema - Customer Service Specialist
export const roleAssessmentSchema = z.object({
  // Technical Platform Experience
  tmsMyCarrierExperience: z.enum(['none', 'basic', 'intermediate', 'advanced', 'expert'], {
    required_error: 'Please select your TMS MyCarrier experience level'
  }),
  shopifyExperience: z.string()
    .min(10, 'Please provide at least 10 characters describing your Shopify experience')
    .max(1000, 'Shopify experience too long'),
  amazonSellerCentralExperience: z.enum(['none', 'basic', 'intermediate', 'advanced'], {
    required_error: 'Please select your Amazon Seller Central experience level'
  }),
  excelProficiency: z.enum(['basic', 'intermediate', 'advanced'], {
    required_error: 'Please select your Excel proficiency level'
  }),
  canvaExperience: z.string()
    .min(10, 'Please provide at least 10 characters describing your Canva experience')
    .max(500, 'Canva experience too long'),
  
  // Personal Work Style Assessment
  learningUnderPressure: z.string()
    .min(20, 'Please provide at least 20 characters describing your learning approach')
    .max(1000, 'Learning under pressure response too long'),
  conflictingInformation: z.string()
    .min(20, 'Please provide at least 20 characters describing your conflict resolution approach')
    .max(1000, 'Conflicting information response too long'),
  workMotivation: z.string()
    .min(20, 'Please provide at least 20 characters describing your work motivation')
    .max(1000, 'Work motivation response too long'),
  
  // Customer Service Scenarios
  delayedShipmentScenario: z.string()
    .min(50, 'Please provide at least 50 characters describing your approach to this scenario')
    .max(1000, 'Delayed shipment scenario response too long')
    .refine((val) => val.trim().split(/\s+/).length >= 15, 'Please provide at least 15 words for a thoughtful response'),
  hazmatFreightScenario: z.string()
    .min(50, 'Please provide at least 50 characters describing your approach to this scenario')
    .max(1000, 'Hazmat freight scenario response too long')
    .refine((val) => val.trim().split(/\s+/).length >= 15, 'Please provide at least 15 words for a thoughtful response'),
  customerQuoteScenario: z.string()
    .min(100, 'Please provide at least 100 characters for your professional email response')
    .max(1500, 'Customer quote scenario response too long')
    .refine((val) => val.trim().split(/\s+/).length >= 25, 'Please provide at least 25 words for a complete professional email')
    .refine((val) => val.toLowerCase().includes('barry'), 'Please address the customer by name in your email')
    .refine((val) => val.toLowerCase().includes('acetic acid'), 'Please mention the specific product in your email'),
  
  // Personal & Professional Assessment
  softwareLearningExperience: z.string()
    .min(20, 'Please provide at least 20 characters describing your software learning experience')
    .max(1000, 'Software learning experience too long'),
  customerServiceMotivation: z.array(z.string())
    .min(1, 'Please select at least one motivation factor')
    .max(10, 'Too many motivations selected'),
  stressManagement: z.string()
    .min(20, 'Please provide at least 20 characters describing your stress management approach')
    .max(1000, 'Stress management response too long'),
  automationIdeas: z.string()
    .min(20, 'Please provide at least 20 characters describing your automation ideas')
    .max(1000, 'Automation ideas response too long'),
  
  // Advanced Role Assessment
  b2bLoyaltyFactor: z.enum(['reliability', 'communication', 'expertise', 'pricing', 'relationships'], {
    required_error: 'Please select the most important factor for B2B customer loyalty'
  }),
  dataAnalysisApproach: z.string()
    .min(20, 'Please provide at least 20 characters describing your data analysis approach')
    .max(1000, 'Data analysis approach too long'),
  idealWorkEnvironment: z.string()
    .min(20, 'Please provide at least 20 characters describing your ideal work environment')
    .max(1000, 'Ideal work environment response too long'),
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
  
  // ✅ ROLE ASSESSMENT - Customer Service Specialist
  roleAssessment: roleAssessmentSchema,
  
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
export const stepPersonalInfoSchema = z.object({
  personalInfo: personalInfoSchema,
  eligibility: eligibilitySchema,
});

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
export type RoleAssessment = z.infer<typeof roleAssessmentSchema>;
export type EmployeeApplicationForm = z.infer<typeof employeeApplicationSchema>;
export type JobPostingForm = z.infer<typeof jobPostingSchema>;
export type AdminUserForm = z.infer<typeof adminUserSchema>;