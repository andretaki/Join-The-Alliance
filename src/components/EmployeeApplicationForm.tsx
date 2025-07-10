"use client";
import { useState, useRef, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import SignatureCanvas from 'react-signature-canvas';
import { employeeApplicationSchema, type EmployeeApplicationForm } from '@/lib/employee-validation';

const STEPS = [
  { id: 'job', title: 'Position', icon: '💼' },
  { id: 'personal', title: 'Personal Info', icon: '👤' },
  { id: 'files', title: 'Documents', icon: '📄' },
  { id: 'experience', title: 'Experience', icon: '🏢' },
  { id: 'education', title: 'Education', icon: '🎓' },
  { id: 'references', title: 'References', icon: '👥' },
  { id: 'signature', title: 'Signature', icon: '✍️' }
];

export default function EmployeeApplicationForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [aiParsing, setAiParsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const sigCanvas = useRef<SignatureCanvas>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isValid }
  } = useForm<EmployeeApplicationForm>({
    resolver: zodResolver(employeeApplicationSchema),
    mode: 'onChange',
    defaultValues: {
      jobPostingId: undefined,
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        socialSecurityNumber: '',
        dateOfBirth: '',
        hasDriversLicense: true,
        driversLicenseNumber: '',
        driversLicenseState: '',
        emergencyContactName: '',
        emergencyContactRelationship: '',
        emergencyContactPhone: '',
        compensationType: 'salary' as const,
        availableStartDate: '',
        hoursAvailable: 'full-time' as const,
        shiftPreference: 'day' as const,
        hasTransportation: false,
        hasBeenConvicted: false,
        hasPreviouslyWorkedHere: false
      },
      eligibility: {
        eligibleToWork: false,
        requiresSponsorship: false,
        consentToBackgroundCheck: false,
        consentToDrugTest: false,
        consentToReferenceCheck: false,
        consentToEmploymentVerification: false,
        hasValidI9Documents: false,
        hasHazmatExperience: false,
        hasForkliftCertification: false,
        hasChemicalHandlingExperience: false,
        willingToObtainCertifications: false
      },
      workExperience: [
        {
          companyName: '',
          jobTitle: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          responsibilities: '',
          reasonForLeaving: '',
          supervisorName: '',
          supervisorContact: ''
        }
      ],
      education: [
        {
          institutionName: '',
          degreeType: 'High School',
          fieldOfStudy: '',
          graduationDate: '',
          gpa: '',
          isCompleted: true
        }
      ],
      references: [
        {
          name: '',
          relationship: '',
          company: '',
          phone: '',
          email: '',
          yearsKnown: undefined
        },
        {
          name: '',
          relationship: '',
          company: '',
          phone: '',
          email: '',
          yearsKnown: undefined
        }
      ],
      signatureDataUrl: '',
      termsAgreed: false
    }
  });

  const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({
    control,
    name: 'workExperience'
  });

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
    control,
    name: 'education'
  });

  const { fields: referenceFields, append: appendReference, remove: removeReference } = useFieldArray({
    control,
    name: 'references'
  });

  const watchedValues = watch();

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploadError('');
    setResumeFile(file);
    setAiParsing(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const parsedData = await response.json();
        
        // Pre-fill work experience from AI parsing
        if (parsedData.workExperience?.length > 0) {
          setValue('workExperience', parsedData.workExperience);
        }

        // Pre-fill education from AI parsing
        if (parsedData.education?.length > 0) {
          setValue('education', parsedData.education);
        }

        // Pre-fill personal info if available
        if (parsedData.personalInfo) {
          Object.entries(parsedData.personalInfo).forEach(([key, value]) => {
            if (value) {
              setValue(`personalInfo.${key}` as any, value);
            }
          });
        }
        
        setUploadProgress(100);
      } else {
        throw new Error('Failed to parse resume');
      }
    } catch (error) {
      console.error('Resume parsing failed:', error);
      setUploadError('Failed to parse resume. Please try again.');
    } finally {
      setAiParsing(false);
    }
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdFile(file);
    }
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setValue('signatureDataUrl', '');
  };

  const captureSignature = () => {
    if (sigCanvas.current) {
      const dataUrl = sigCanvas.current.toDataURL();
      setValue('signatureDataUrl', dataUrl);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Focus management for step navigation
  useEffect(() => {
    const stepContainer = stepRefs.current[currentStep];
    if (stepContainer) {
      const firstFocusable = stepContainer.querySelector('input, select, textarea, button, [tabindex="0"]') as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        stepContainer.focus();
      }
    }
  }, [currentStep]);

  // Handle signature method change
  const handleSignatureMethodChange = (method: 'draw' | 'type') => {
    setSignatureMethod(method);
    if (method === 'type') {
      setValue('signatureDataUrl', typedSignature);
    } else {
      setValue('signatureDataUrl', '');
      setTypedSignature('');
    }
  };

  const handleTypedSignatureChange = (value: string) => {
    setTypedSignature(value);
    setValue('signatureDataUrl', value);
  };

  // Format SSN to XXX-XX-XXXX format
  const formatSSN = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XXX-XX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    }
  };

  const handleSSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSSN(e.target.value);
    setValue('personalInfo.socialSecurityNumber', formatted);
  };

  const onSubmit = async (data: EmployeeApplicationForm) => {
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      
      // Add form data
      formData.append('applicationData', JSON.stringify(data));
      
      // Add files
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }
      if (idFile) {
        formData.append('idPhoto', idFile);
      }

      const response = await fetch('/api/employee-applications', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('Application submitted successfully!');
        // Redirect to success page
        window.location.href = '/application-success';
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('There was an error submitting your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRoleSpecificQuestions = () => {
    const selectedJob = watchedValues.jobPostingId;
    
    if (!selectedJob) return null;
    
    if (selectedJob === 1) {
      return (
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Customer Service Role Assessment</h3>
          <div className="space-y-6">
            
            {/* Tool Experience Questions */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Technical Platform Experience</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate your experience with TMS MyCarrier (Transportation Management System)
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select experience level</option>
                    <option value="none">Never used</option>
                    <option value="basic">Basic - Can navigate and perform simple tasks</option>
                    <option value="intermediate">Intermediate - Can handle most customer inquiries</option>
                    <option value="advanced">Advanced - Can troubleshoot and train others</option>
                    <option value="expert">Expert - Can optimize workflows and processes</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your experience with Shopify for order management and customer support
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe specific tasks you've performed (order tracking, refunds, inventory inquiries, etc.)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amazon Seller Central experience level
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select experience level</option>
                    <option value="none">No experience</option>
                    <option value="basic">Basic - Can view orders and basic account management</option>
                    <option value="intermediate">Intermediate - Can handle customer messages and returns</option>
                    <option value="advanced">Advanced - Can manage listings and resolve account issues</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate your proficiency with Microsoft Excel for data analysis and reporting
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select proficiency level</option>
                    <option value="basic">Basic - Can create simple spreadsheets and basic formulas</option>
                    <option value="intermediate">Intermediate - Can use VLOOKUP, pivot tables, and charts</option>
                    <option value="advanced">Advanced - Can create complex reports and macros</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your experience with Canva for creating customer-facing materials
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Examples: flyers, social media posts, presentations, infographics..."
                  />
                </div>
              </div>
            </div>
            
            {/* Personal Assessment Questions */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Personal Work Style Assessment</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe a time when you had to learn a completely new software system under pressure. How did you approach it?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Focus on your learning process and adaptation strategies..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    When you receive conflicting information from different sources (customer, system, supervisor), how do you determine the truth?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your fact-checking and verification process..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What motivates you most: solving complex problems, helping people, or achieving measurable results? Explain why.
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Help us understand what drives your work satisfaction..."
                  />
                </div>
              </div>
            </div>
            
            {/* Scenario-Based Questions */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Customer Service Scenarios</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    A customer calls saying their chemical shipment was delayed and they need it for production tomorrow. The carrier shows it's still in transit. How would you handle this?
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your step-by-step approach..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    You notice a customer has been placing increasingly large orders of a restricted chemical. What actions would you take?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Consider compliance, documentation, and escalation procedures..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    A customer questions why their hazardous material shipment costs more than regular freight. How do you explain the additional fees?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain your approach to educating customers about hazmat regulations..."
                  />
                </div>
              </div>
            </div>
            
            {/* Personal Assessment */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Personal & Professional Assessment</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe a time when you had to learn a complex software system quickly. How did you approach it?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Include the system, timeline, and your learning strategy..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What motivates you most in a customer service role? (Select all that apply)
                  </label>
                  <div className="space-y-2">
                    {[
                      'Solving complex problems',
                      'Building long-term customer relationships',
                      'Learning new technologies and processes',
                      'Working with data and analytics',
                      'Helping customers achieve their goals',
                      'Working in a fast-paced environment'
                    ].map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label className="text-sm text-gray-700">{option}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How do you handle stress when dealing with multiple urgent customer requests simultaneously?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your prioritization and stress management techniques..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    If you could automate one repetitive task in customer service, what would it be and why?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Think about efficiency and customer experience improvements..."
                  />
                </div>
              </div>
            </div>
            
            {/* Advanced Assessment */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Advanced Role Assessment</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    In your experience, what's the most important factor in maintaining customer loyalty in B2B sales?
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select your answer</option>
                    <option value="pricing">Competitive pricing</option>
                    <option value="reliability">Consistent delivery and quality</option>
                    <option value="communication">Proactive communication</option>
                    <option value="problem-solving">Quick problem resolution</option>
                    <option value="relationship">Personal relationships</option>
                    <option value="expertise">Technical expertise and advice</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How would you use data from customer interactions to improve service quality?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Consider metrics, patterns, and actionable insights..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your ideal work environment and team dynamics
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Include communication style, collaboration preferences, and work pace..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (selectedJob === 2) {
      return (
        <div className="mt-8 bg-orange-50 rounded-lg p-6 border border-orange-200">
          <h3 className="text-lg font-semibold text-orange-800 mb-4">Warehouse Role Assessment</h3>
          <div className="space-y-6">
            
            {/* Physical Requirements */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Physical Capabilities</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Can you lift 50+ pounds regularly throughout your shift?
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select answer</option>
                    <option value="yes">Yes, comfortably</option>
                    <option value="sometimes">Yes, with some difficulty</option>
                    <option value="no">No</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Are you comfortable working in a chemical warehouse environment with proper PPE?
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select answer</option>
                    <option value="yes">Yes, I have experience</option>
                    <option value="willing">Yes, willing to learn</option>
                    <option value="no">No, I prefer other environments</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Safety and Compliance */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Safety & Compliance</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your understanding of chemical safety protocols
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Include SDS sheets, PPE, spill procedures, etc..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How would you handle finding a damaged chemical container?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe step-by-step safety procedure..."
                  />
                </div>
              </div>
            </div>
            
            {/* Personal Assessment */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Work Style & Motivation</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What motivates you to do quality work even when no one is watching?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your intrinsic motivation and work ethic..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How do you maintain focus during repetitive tasks?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Share your strategies for staying engaged..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const renderJobSelection = () => (
    <div className="space-y-6" ref={(el) => { stepRefs.current[0] = el; }} tabIndex={-1}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Position</h2>
        <p className="text-gray-600">Choose the position you're applying for</p>
      </div>
      
      <fieldset className="grid gap-4">
        <legend className="sr-only">Available Positions</legend>
        {/* This would be populated from the database */}
        <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              value="1"
              id="job-1"
              {...register('jobPostingId', { 
                setValueAs: (value: string) => value === "" ? undefined : Number(value)
              })}
              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
              aria-describedby="job-1-description"
            />
            <div>
              <label htmlFor="job-1" className="font-semibold text-gray-900 cursor-pointer">
                Customer Service Specialist
              </label>
              <p id="job-1-description" className="text-sm text-gray-600">Sales & Customer Support</p>
            </div>
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              value="2"
              id="job-2"
              {...register('jobPostingId', { 
                setValueAs: (value: string) => value === "" ? undefined : Number(value)
              })}
              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
              aria-describedby="job-2-description"
            />
            <div>
              <label htmlFor="job-2" className="font-semibold text-gray-900 cursor-pointer">
                Warehouse Associate
              </label>
              <p id="job-2-description" className="text-sm text-gray-600">Operations & Distribution</p>
            </div>
          </div>
        </div>
      </fieldset>
      {errors.jobPostingId && (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">
          {errors.jobPostingId.message}
        </p>
      )}
      
      {/* Role-specific questions appear after selection */}
      {renderRoleSpecificQuestions()}
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="space-y-8" ref={el => { stepRefs.current[1] = el; }} tabIndex={-1}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600">Complete employee information required</p>
      </div>

      {/* Basic Personal Info */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
            <input
              type="text"
              {...register('personalInfo.firstName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.personalInfo?.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
            <input
              type="text"
              {...register('personalInfo.middleName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
            <input
              type="text"
              {...register('personalInfo.lastName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.personalInfo?.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.lastName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              {...register('personalInfo.email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.personalInfo?.email && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Phone *</label>
            <input
              type="tel"
              {...register('personalInfo.phone')}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.personalInfo?.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone</label>
            <input
              type="tel"
              {...register('personalInfo.alternatePhone')}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Critical Employee Information */}
      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
        <h3 className="text-lg font-semibold text-red-800 mb-4">🔒 Sensitive Information (Encrypted)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Social Security Number *</label>
            <input
              type="text"
              {...register('personalInfo.socialSecurityNumber')}
              onChange={handleSSNChange}
              placeholder="XXX-XX-XXXX"
              maxLength={11}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.personalInfo?.socialSecurityNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.socialSecurityNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
            <input
              type="date"
              {...register('personalInfo.dateOfBirth')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.personalInfo?.dateOfBirth && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.dateOfBirth.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                {...register('personalInfo.hasDriversLicense')}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label className="text-sm font-medium text-gray-700">
                I have a valid driver's license
              </label>
            </div>
            
            {watchedValues.personalInfo?.hasDriversLicense && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Driver's License Number *</label>
                  <input
                    type="text"
                    {...register('personalInfo.driversLicenseNumber')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.personalInfo?.driversLicenseNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.personalInfo.driversLicenseNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License State *</label>
                  <input
                    type="text"
                    {...register('personalInfo.driversLicenseState')}
                    placeholder="TX"
                    maxLength={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.personalInfo?.driversLicenseState && (
                    <p className="mt-1 text-sm text-red-600">{errors.personalInfo.driversLicenseState.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
            <input
              type="text"
              {...register('personalInfo.address')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.personalInfo?.address && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.address.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
            <input
              type="text"
              {...register('personalInfo.city')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.personalInfo?.city && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.city.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
            <input
              type="text"
              {...register('personalInfo.state')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.personalInfo?.state && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.state.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
            <input
              type="text"
              {...register('personalInfo.zipCode')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.personalInfo?.zipCode && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.zipCode.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-800 mb-4">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name *</label>
            <input
              type="text"
              {...register('personalInfo.emergencyContactName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.personalInfo?.emergencyContactName && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.emergencyContactName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Relationship *</label>
            <input
              type="text"
              {...register('personalInfo.emergencyContactRelationship')}
              placeholder="Spouse, Parent, Sibling, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.personalInfo?.emergencyContactRelationship && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.emergencyContactRelationship.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Phone *</label>
            <input
              type="tel"
              {...register('personalInfo.emergencyContactPhone')}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.personalInfo?.emergencyContactPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.emergencyContactPhone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Address</label>
            <input
              type="text"
              {...register('personalInfo.emergencyContactAddress')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Employment Preferences */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Compensation Type</label>
            <select
              {...register('personalInfo.compensationType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="salary">Annual Salary</option>
              <option value="hourly">Hourly Rate</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {watchedValues.personalInfo?.compensationType === 'hourly' ? 'Desired Hourly Rate' : 'Desired Salary'}
            </label>
            {watchedValues.personalInfo?.compensationType === 'hourly' ? (
              <input
                type="text"
                {...register('personalInfo.desiredHourlyRate')}
                placeholder="$XX.XX/hour or Negotiable"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <input
                type="text"
                {...register('personalInfo.desiredSalary')}
                placeholder="$XX,XXX or Negotiable"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Start Date *</label>
            <input
              type="date"
              {...register('personalInfo.availableStartDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.personalInfo?.availableStartDate && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.availableStartDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hours Available *</label>
            <select
              {...register('personalInfo.hoursAvailable')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select hours available</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="either">Either</option>
            </select>
            {errors.personalInfo?.hoursAvailable && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.hoursAvailable.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shift Preference *</label>
            <select
              {...register('personalInfo.shiftPreference')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select shift preference</option>
              <option value="day">Day (6 AM - 6 PM)</option>
              <option value="evening">Evening (2 PM - 10 PM)</option>
              <option value="night">Night (10 PM - 6 AM)</option>
              <option value="rotating">Rotating Shifts</option>
              <option value="any">Any Shift</option>
            </select>
            {errors.personalInfo?.shiftPreference && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.shiftPreference.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Questions */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              {...register('personalInfo.hasTransportation')}
              className="w-4 h-4 text-blue-600 rounded mt-1"
            />
            <label className="text-sm text-gray-700">
              I have reliable transportation to work
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                {...register('personalInfo.hasBeenConvicted')}
                className="w-4 h-4 text-blue-600 rounded mt-1"
              />
              <label className="text-sm text-gray-700">
                I have been convicted of a felony (conviction will not necessarily disqualify employment)
              </label>
            </div>
            {watchedValues.personalInfo?.hasBeenConvicted && (
              <div className="ml-7">
                <textarea
                  {...register('personalInfo.convictionDetails')}
                  placeholder="Please provide details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                {...register('personalInfo.hasPreviouslyWorkedHere')}
                className="w-4 h-4 text-blue-600 rounded mt-1"
              />
              <label className="text-sm text-gray-700">
                I have previously worked for Alliance Chemical
              </label>
            </div>
            {watchedValues.personalInfo?.hasPreviouslyWorkedHere && (
              <div className="ml-7">
                <textarea
                  {...register('personalInfo.previousWorkDetails')}
                  placeholder="Please provide details (dates, position, reason for leaving)..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Work Eligibility & Consents */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">Work Eligibility & Required Consents</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              {...register('eligibility.eligibleToWork')}
              className="w-4 h-4 text-blue-600 rounded mt-1"
            />
            <label className="text-sm text-gray-700">
              <strong>I am eligible to work in the United States *</strong>
            </label>
          </div>
          {errors.eligibility?.eligibleToWork && (
            <p className="ml-7 text-sm text-red-600">{errors.eligibility.eligibleToWork.message}</p>
          )}

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              {...register('eligibility.requiresSponsorship')}
              className="w-4 h-4 text-blue-600 rounded mt-1"
            />
            <label className="text-sm text-gray-700">
              I require sponsorship for employment visa status
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              {...register('eligibility.hasValidI9Documents')}
              className="w-4 h-4 text-blue-600 rounded mt-1"
            />
            <label className="text-sm text-gray-700">
              <strong>I have valid I-9 documentation to verify employment eligibility *</strong>
            </label>
          </div>
          {errors.eligibility?.hasValidI9Documents && (
            <p className="ml-7 text-sm text-red-600">{errors.eligibility.hasValidI9Documents.message}</p>
          )}
        </div>
      </div>

      {/* Employment Consents */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Verification Consents</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              {...register('eligibility.consentToBackgroundCheck')}
              className="w-4 h-4 text-blue-600 rounded mt-1"
            />
            <label className="text-sm text-gray-700">
              <strong>I consent to a background check *</strong>
            </label>
          </div>
          {errors.eligibility?.consentToBackgroundCheck && (
            <p className="ml-7 text-sm text-red-600">{errors.eligibility.consentToBackgroundCheck.message}</p>
          )}

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              {...register('eligibility.consentToDrugTest')}
              className="w-4 h-4 text-blue-600 rounded mt-1"
            />
            <label className="text-sm text-gray-700">
              <strong>I consent to pre-employment and random drug testing *</strong>
            </label>
          </div>
          {errors.eligibility?.consentToDrugTest && (
            <p className="ml-7 text-sm text-red-600">{errors.eligibility.consentToDrugTest.message}</p>
          )}

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              {...register('eligibility.consentToReferenceCheck')}
              className="w-4 h-4 text-blue-600 rounded mt-1"
            />
            <label className="text-sm text-gray-700">
              <strong>I consent to reference verification *</strong>
            </label>
          </div>
          {errors.eligibility?.consentToReferenceCheck && (
            <p className="ml-7 text-sm text-red-600">{errors.eligibility.consentToReferenceCheck.message}</p>
          )}

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              {...register('eligibility.consentToEmploymentVerification')}
              className="w-4 h-4 text-blue-600 rounded mt-1"
            />
            <label className="text-sm text-gray-700">
              <strong>I consent to employment history verification *</strong>
            </label>
          </div>
          {errors.eligibility?.consentToEmploymentVerification && (
            <p className="ml-7 text-sm text-red-600">{errors.eligibility.consentToEmploymentVerification.message}</p>
          )}
        </div>
      </div>

      {/* Chemical Industry Experience */}
      <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
        <h3 className="text-lg font-semibold text-orange-800 mb-4">Chemical Industry Experience</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              {...register('eligibility.hasHazmatExperience')}
              className="w-4 h-4 text-blue-600 rounded mt-1"
            />
            <label className="text-sm text-gray-700">
              I have HAZMAT/dangerous goods handling experience
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              {...register('eligibility.hasForkliftCertification')}
              className="w-4 h-4 text-blue-600 rounded mt-1"
            />
            <label className="text-sm text-gray-700">
              I am forklift certified
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              {...register('eligibility.hasChemicalHandlingExperience')}
              className="w-4 h-4 text-blue-600 rounded mt-1"
            />
            <label className="text-sm text-gray-700">
              I have chemical handling/distribution experience
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              {...register('eligibility.willingToObtainCertifications')}
              className="w-4 h-4 text-blue-600 rounded mt-1"
            />
            <label className="text-sm text-gray-700">
              I am willing to obtain required certifications (HAZMAT, forklift, etc.)
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFileUploads = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
        <p className="text-gray-600">Upload your resume and ID photo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Resume / CV</h3>
          <p className="text-sm text-gray-600 mb-4">Upload PDF, DOC, or DOCX (max 10MB)</p>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleResumeUpload}
            className="hidden"
            id="resume-upload"
          />
          <label
            htmlFor="resume-upload"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            Choose File
          </label>
          {uploadError && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              ⚠️ {uploadError}
            </p>
          )}
          {resumeFile && !uploadError && (
            <p className="mt-2 text-sm text-green-600">✓ {resumeFile.name}</p>
          )}
          {aiParsing && (
            <div className="mt-2">
              <p className="text-sm text-blue-600">🤖 AI is parsing your resume...</p>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              {uploadProgress === 100 && (
                <p className="text-sm text-green-600 mt-1">✓ Resume parsed successfully!</p>
              )}
            </div>
          )}
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">ID Photo</h3>
          <p className="text-sm text-gray-600 mb-4">Upload JPG or PNG (max 10MB)</p>
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={handleIdUpload}
            className="hidden"
            id="id-upload"
          />
          <label
            htmlFor="id-upload"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            Choose File
          </label>
          {idFile && (
            <p className="mt-2 text-sm text-green-600">✓ {idFile.name}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderWorkExperience = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Work Experience</h2>
        <p className="text-gray-600">Tell us about your work history</p>
      </div>

      {workFields.map((field, index) => (
        <div key={field.id} className="border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Position {index + 1}</h3>
            {workFields.length > 1 && (
              <button
                type="button"
                onClick={() => removeWork(index)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                {...register(`workExperience.${index}.companyName`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
              <input
                type="text"
                {...register(`workExperience.${index}.jobTitle`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="month"
                {...register(`workExperience.${index}.startDate`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="month"
                {...register(`workExperience.${index}.endDate`)}
                disabled={watchedValues.workExperience?.[index]?.isCurrent}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <div className="mt-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register(`workExperience.${index}.isCurrent`)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label className="text-sm text-gray-700">Current Position</label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Responsibilities</label>
              <textarea
                {...register(`workExperience.${index}.responsibilities`)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => appendWork({
          companyName: '',
          jobTitle: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          responsibilities: '',
          reasonForLeaving: '',
          supervisorName: '',
          supervisorContact: ''
        })}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
      >
        + Add Another Position
      </button>
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Education</h2>
        <p className="text-gray-600">Tell us about your educational background</p>
      </div>

      {educationFields.map((field, index) => (
        <div key={field.id} className="border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Education {index + 1}</h3>
            {educationFields.length > 1 && (
              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
              <input
                type="text"
                {...register(`education.${index}.institutionName`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Degree Type</label>
              <select
                {...register(`education.${index}.degreeType`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="High School">High School</option>
                <option value="Associate">Associate</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="PhD">PhD</option>
                <option value="Certificate">Certificate</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
              <input
                type="text"
                {...register(`education.${index}.fieldOfStudy`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Date</label>
              <input
                type="month"
                {...register(`education.${index}.graduationDate`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => appendEducation({
          institutionName: '',
          degreeType: 'High School',
          fieldOfStudy: '',
          graduationDate: '',
          gpa: '',
          isCompleted: true
        })}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
      >
        + Add Another Education
      </button>
    </div>
  );

  const renderReferences = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">References</h2>
        <p className="text-gray-600">Provide at least 2 references</p>
      </div>

      {referenceFields.map((field, index) => (
        <div key={field.id} className="border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Reference {index + 1}</h3>
            {referenceFields.length > 2 && (
              <button
                type="button"
                onClick={() => removeReference(index)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                {...register(`references.${index}.name`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
              <input
                type="text"
                {...register(`references.${index}.relationship`)}
                placeholder="e.g., Former Supervisor, Colleague"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              <input
                type="text"
                {...register(`references.${index}.company`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                {...register(`references.${index}.phone`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                {...register(`references.${index}.email`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years Known</label>
              <input
                type="number"
                {...register(`references.${index}.yearsKnown`, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}

      {referenceFields.length < 5 && (
        <button
          type="button"
          onClick={() => appendReference({
            name: '',
            relationship: '',
            company: '',
            phone: '',
            email: '',
            yearsKnown: undefined
          })}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          + Add Another Reference
        </button>
      )}
    </div>
  );

  const renderSignature = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Digital Signature</h2>
        <p className="text-gray-600">Please sign to complete your application</p>
      </div>

      <div className="border border-gray-300 rounded-lg p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Signature</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                width: 500,
                height: 200,
                className: 'signature-canvas w-full'
              }}
              onEnd={captureSignature}
            />
          </div>
          <button
            type="button"
            onClick={clearSignature}
            className="mt-2 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Signature
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            {...register('termsAgreed')}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <label className="text-sm text-gray-700">
            I agree to the terms and conditions and certify that all information provided is accurate
          </label>
        </div>
        {errors.termsAgreed && (
          <p className="mt-1 text-sm text-red-600">{errors.termsAgreed.message}</p>
        )}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderJobSelection();
      case 1: return renderPersonalInfo();
      case 2: return renderFileUploads();
      case 3: return renderWorkExperience();
      case 4: return renderEducation();
      case 5: return renderReferences();
      case 6: return renderSignature();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Image
              src="/WIDE - Color on Transparent _RGB-01.png"
              alt="Alliance Chemical Logo"
              width={300}
              height={75}
              className="mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Employment Application</h1>
            <p className="text-gray-600">Join the Alliance Chemical team</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index < currentStep ? '✓' : step.icon}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <div className={`text-sm font-medium ${
                      index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              {renderStepContent()}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {currentStep < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isSubmitting ? '🚀 Submitting...' : 'Submit Application'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}