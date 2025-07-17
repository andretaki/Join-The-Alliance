"use client";
import { useState, useRef, useEffect } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import SignatureCanvas from 'react-signature-canvas';
import { employeeApplicationSchema, type EmployeeApplicationForm } from '@/lib/employee-validation';

// Tooltip component for better user experience
const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-6 transform -translate-y-full min-w-[250px] max-w-[300px]">
          {text}
          <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

const STEPS = [
  { id: 'job', title: 'Position', shortTitle: 'Job', icon: '💼', description: 'Select your role' },
  { id: 'assessment', title: 'Assessment', shortTitle: 'Test', icon: '📝', description: 'Role evaluation' },
  { id: 'personal', title: 'Personal', shortTitle: 'Info', icon: '👤', description: 'Basic details' },
  { id: 'files', title: 'Documents', shortTitle: 'Files', icon: '📄', description: 'Upload files' },
  { id: 'experience', title: 'Experience', shortTitle: 'Work', icon: '🏢', description: 'Work history' },
  { id: 'education', title: 'Education', shortTitle: 'School', icon: '🎓', description: 'Academic background' },
  { id: 'references', title: 'References', shortTitle: 'Refs', icon: '👥', description: 'Professional contacts' },
  { id: 'review', title: 'Review', shortTitle: 'Check', icon: '🔍', description: 'Confirm your details' },
  { id: 'signature', title: 'Signature', shortTitle: 'Sign', icon: '✍️', description: 'Final confirmation' }
];

export default function EmployeeApplicationForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idCaptureMethod, setIdCaptureMethod] = useState<'upload' | 'camera'>('upload');
  const [showCamera, setShowCamera] = useState(false);
  const [photoStream, setPhotoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aiParsing, setAiParsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isStepValid, setIsStepValid] = useState<boolean[]>(new Array(STEPS.length).fill(false));
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
  const sigCanvas = useRef<SignatureCanvas>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const signatureContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 200 });
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // localStorage keys
  const FORM_DATA_KEY = 'employeeApplicationFormData';
  const CURRENT_STEP_KEY = 'employeeApplicationCurrentStep';

  // Helper functions for localStorage
  const saveFormDataToLocalStorage = (data: Partial<EmployeeApplicationForm>) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(FORM_DATA_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to save form data to localStorage:', error);
    }
  };

  const loadFormDataFromLocalStorage = (): Partial<EmployeeApplicationForm> | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(FORM_DATA_KEY);
        return saved ? JSON.parse(saved) : null;
      }
      return null;
    } catch (error) {
      console.error('Failed to load form data from localStorage:', error);
      return null;
    }
  };

  const saveCurrentStepToLocalStorage = (step: number) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(CURRENT_STEP_KEY, step.toString());
      }
    } catch (error) {
      console.error('Failed to save current step to localStorage:', error);
    }
  };

  const loadCurrentStepFromLocalStorage = (): number => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(CURRENT_STEP_KEY);
        return saved ? parseInt(saved, 10) : 0;
      }
      return 0;
    } catch (error) {
      console.error('Failed to load current step from localStorage:', error);
      return 0;
    }
  };

  const clearFormDataFromLocalStorage = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(FORM_DATA_KEY);
        localStorage.removeItem(CURRENT_STEP_KEY);
      }
    } catch (error) {
      console.error('Failed to clear form data from localStorage:', error);
    }
  };

  // Get default values with localStorage fallback
  const getDefaultValues = (): EmployeeApplicationForm => {
    const savedData = loadFormDataFromLocalStorage();
    
    const defaultValues: EmployeeApplicationForm = {
      jobPostingId: 1, // Customer Service Specialist is the only option
      roleAssessment: {
        tmsMyCarrierExperience: 'none' as const,
        shopifyExperience: '',
        amazonSellerCentralExperience: 'none' as const,
        excelProficiency: 'basic' as const,
        canvaExperience: '',
        learningUnderPressure: '',
        conflictingInformation: '',
        workMotivation: '',
        delayedShipmentScenario: '',
        hazmatFreightScenario: '',
        customerQuoteScenario: '',
        softwareLearningExperience: '',
        customerServiceMotivation: [],
        stressManagement: '',
        automationIdeas: '',
        b2bLoyaltyFactor: 'reliability' as const,
        dataAnalysisApproach: '',
        idealWorkEnvironment: '',
      },
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
        shiftPreference: '8am-4pm' as const,
        hasTransportation: false,
        hasBeenConvicted: false,
        hasPreviouslyWorkedHere: false
      },
      workExperience: [],
      education: [],
      references: [{
        name: '',
        relationship: '',
        company: '',
        phone: '',
        email: '',
        yearsKnown: 0
      }],
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
        willingToObtainCertifications: false,
      },
      termsAgreed: false,
      signatureDataUrl: '',
      additionalInfo: ''
    };

    // Merge saved data with defaults, ensuring deep merge for nested objects
    if (savedData) {
      return {
        ...defaultValues,
        ...savedData,
        roleAssessment: {
          ...defaultValues.roleAssessment,
          ...savedData.roleAssessment
        },
        personalInfo: {
          ...defaultValues.personalInfo,
          ...savedData.personalInfo
        },
        eligibility: {
          ...defaultValues.eligibility,
          ...savedData.eligibility
        },
        workExperience: savedData.workExperience || defaultValues.workExperience,
        education: savedData.education || defaultValues.education,
        references: savedData.references || defaultValues.references,
      };
    }

    return defaultValues;
  };

  // Test data population function - Development Mode Only
  const populateTestData = async (scenario: 'default' | 'entryLevel' | 'experienced' = 'default') => {
    try {
      // Simple inline test data to avoid import issues
      const testData = {
        jobPostingId: 1,
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          middleName: 'Michael',
          email: 'john.doe@email.com',
          phone: '555-123-4567',
          alternatePhone: '555-987-6543',
          address: '123 Main Street',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          socialSecurityNumber: '123-45-6789',
          dateOfBirth: '1990-01-15',
          hasDriversLicense: true,
          driversLicenseNumber: 'D1234567890',
          driversLicenseState: 'TX',
          emergencyContactName: 'Jane Doe',
          emergencyContactRelationship: 'Spouse',
          emergencyContactPhone: '555-111-2222',
          emergencyContactAddress: '123 Main Street, Austin, TX 78701',
          compensationType: 'salary' as const,
          desiredSalary: '75000',
          availableStartDate: '2024-03-01',
          hoursAvailable: 'full-time' as const,
          shiftPreference: '8am-4pm' as const,
          hasTransportation: true,
          hasBeenConvicted: false,
          hasPreviouslyWorkedHere: false
        },
        roleAssessment: {
          tmsMyCarrierExperience: 'intermediate' as const,
          shopifyExperience: 'I have 2 years of experience with Shopify managing product listings and customer orders',
          amazonSellerCentralExperience: 'basic' as const,
          excelProficiency: 'intermediate' as const,
          canvaExperience: 'I use Canva regularly for creating marketing materials and product graphics',
          learningUnderPressure: 'I stay calm under pressure and break down complex problems into manageable steps',
          conflictingInformation: 'I verify information from multiple sources and escalate when needed',
          workMotivation: 'I am motivated by helping customers solve problems and contributing to team success',
          delayedShipmentScenario: 'I would immediately contact the customer to inform them of the delay, provide a realistic timeline, and offer solutions like expedited shipping or partial delivery where possible',
          hazmatFreightScenario: 'I would ensure all proper documentation is complete, verify carrier certifications, and coordinate with logistics to ensure safe handling protocols are followed',
          customerQuoteScenario: 'Hello Barry, Thank you for your inquiry about acetic acid. I am pleased to provide a competitive quote for your requirements. Product: Acetic Acid Industrial Grade, Quantity: 4 drums, Unit Price: $800 per drum, Total: $3200. This quote includes proper hazmat documentation and delivery within 5 business days. Please let me know if you have any questions about this acetic acid quote.',
          softwareLearningExperience: 'I learn new software by exploring the interface, following tutorials, and practicing with real scenarios',
          customerServiceMotivation: ['helping-customers', 'problem-solving'],
          stressManagement: 'I manage stress through prioritization, clear communication, and taking short breaks when needed',
          automationIdeas: 'I would suggest automating order confirmations, inventory alerts, and customer follow-up emails',
          b2bLoyaltyFactor: 'reliability' as const,
          dataAnalysisApproach: 'I analyze customer purchase patterns to identify trends and anticipate future needs',
          idealWorkEnvironment: 'A collaborative environment with clear communication and opportunities for professional growth'
        },
        eligibility: {
          eligibleToWork: true,
          requiresSponsorship: false,
          consentToBackgroundCheck: true,
          consentToDrugTest: true,
          consentToReferenceCheck: true,
          consentToEmploymentVerification: true,
          hasValidI9Documents: true,
          hasHazmatExperience: false,
          hasForkliftCertification: false,
          hasChemicalHandlingExperience: true,
          willingToObtainCertifications: true
        },
        workExperience: [{
          companyName: 'ABC Corp',
          jobTitle: 'Customer Service Representative',
          startDate: '2020-01',
          endDate: '2023-12',
          isCurrent: false,
          responsibilities: 'Handled customer inquiries and processed orders',
          reasonForLeaving: 'Career advancement',
          supervisorName: 'Jane Smith',
          supervisorContact: 'jane.smith@abccorp.com'
        }],
        education: [{
          institutionName: 'University of Texas',
          degreeType: 'Bachelor' as const,
          fieldOfStudy: 'Business Administration',
          graduationDate: '2019-05',
          gpa: '3.5',
          isCompleted: true
        }],
        references: [
          {
            name: 'Jane Smith',
            relationship: 'Former Supervisor',
            company: 'ABC Corp',
            phone: '555-123-4567',
            email: 'jane.smith@abccorp.com',
            yearsKnown: 3
          },
          {
            name: 'Bob Johnson',
            relationship: 'Colleague',
            company: 'ABC Corp',
            phone: '555-987-6543',
            email: 'bob.johnson@abccorp.com',
            yearsKnown: 2
          }
        ],
        signatureDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        termsAgreed: true,
        additionalInfo: 'I am excited about this opportunity at Alliance Chemical.'
      };

      // Set all form values
      Object.entries(testData.personalInfo).forEach(([key, value]) => {
        setValue(`personalInfo.${key}` as any, value);
      });

      Object.entries(testData.roleAssessment).forEach(([key, value]) => {
        setValue(`roleAssessment.${key}` as any, value);
      });

      Object.entries(testData.eligibility).forEach(([key, value]) => {
        setValue(`eligibility.${key}` as any, value);
      });

      setValue('workExperience', testData.workExperience);
      setValue('education', testData.education);
      setValue('references', testData.references);
      setValue('jobPostingId', testData.jobPostingId);
      setValue('signatureDataUrl', testData.signatureDataUrl);
      setValue('termsAgreed', testData.termsAgreed);
      setValue('additionalInfo', testData.additionalInfo);

      // Mark all steps as visited and valid
      setVisitedSteps(new Set(Array.from({ length: STEPS.length }, (_, i) => i)));
      setIsStepValid(new Array(STEPS.length).fill(true));

      setSuccessMessage('✅ Test data loaded! Form is now ready for submission testing.');
      setErrorMessage('');
      
      // Navigate to the last step to test submission
      setTimeout(() => {
        setCurrentStep(STEPS.length - 1);
      }, 1000);

    } catch (error) {
      console.error('Error loading test data:', error);
      setErrorMessage(`Failed to load test data: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isValid }
  } = useForm<EmployeeApplicationForm>({
    resolver: zodResolver(employeeApplicationSchema) as any,
    mode: 'onChange',
    defaultValues: getDefaultValues()
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

  // Load saved current step on component mount
  useEffect(() => {
    const savedStep = loadCurrentStepFromLocalStorage();
    if (savedStep >= 0 && savedStep < STEPS.length) {
      setCurrentStep(savedStep);
      // Mark visited steps up to the saved step
      setVisitedSteps(new Set(Array.from({ length: savedStep + 1 }, (_, i) => i)));
    }
  }, []);

  // Save form data to localStorage whenever form values change (debounced)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const subscription = watch((value) => {
      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Debounce the save operation
      timeoutId = setTimeout(() => {
        // Only save if there's meaningful data (not just empty form)
        const hasData = Object.values(value).some(val => {
          if (typeof val === 'object' && val !== null) {
            return Object.values(val).some(nestedVal => 
              nestedVal !== '' && nestedVal !== false && nestedVal !== null && nestedVal !== undefined
            );
          }
          return val !== '' && val !== false && val !== null && val !== undefined;
        });

        if (hasData) {
          setIsAutoSaving(true);
          saveFormDataToLocalStorage(value as Partial<EmployeeApplicationForm>);
          // Show saving feedback briefly
          setTimeout(() => setIsAutoSaving(false), 1000);
        }
      }, 500); // 500ms debounce
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, [watch]);

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    saveCurrentStepToLocalStorage(currentStep);
  }, [currentStep]);

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
    if (!file) return;

    // Validate file type for ID (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a JPG, PNG, or WEBP image for ID');
      return;
    }

    // Validate file size (5MB max for images)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setUploadError('ID image must be less than 5MB');
      return;
    }

    setUploadError('');
    setIdFile(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setPhotoStream(stream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setUploadError('Unable to access camera. Please try uploading a file instead.');
    }
  };

  const stopCamera = () => {
    if (photoStream) {
      photoStream.getTracks().forEach(track => track.stop());
      setPhotoStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'id-photo.jpg', { type: 'image/jpeg' });
            setIdFile(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
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
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      setVisitedSteps(prev => new Set([...prev, newStep]));
      // Scroll to top of the page when navigating to next step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Scroll to top of the page when navigating to previous step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < STEPS.length) {
      setCurrentStep(stepIndex);
      setVisitedSteps(prev => new Set([...prev, stepIndex]));
      // Scroll to top of the page when navigating to a new step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Focus management for step navigation
  useEffect(() => {
    const stepContainer = stepRefs.current[currentStep];
    if (stepContainer) {
      // For iOS Safari, delay focus to prevent automatic dropdown opening
      const focusDelay = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 300 : 0;
      
      setTimeout(() => {
        // First, blur any currently focused element to prevent iOS dropdown issues
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        
        // Then focus the step container instead of the first focusable element
        // This prevents iOS Safari from automatically opening select dropdowns
        stepContainer.focus();
        
        // Set tabIndex to make it focusable
        stepContainer.setAttribute('tabindex', '-1');
      }, focusDelay);
    }
  }, [currentStep]);

  // Signature canvas resize handler
  useEffect(() => {
    const handleResize = () => {
      if (signatureContainerRef.current) {
        const container = signatureContainerRef.current;
        const rect = container.getBoundingClientRect();
        const width = Math.min(rect.width - 20, 600); // 20px padding
        setCanvasSize({ width, height: 200 });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    console.log('🚀 Submit button clicked - starting submission process');
    console.log('Form data:', data);
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
        // Clear localStorage on successful submission
        clearFormDataFromLocalStorage();
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
    console.log('Selected job:', selectedJob); // Debug log
    
    // Since Customer Service Specialist is the only option and pre-selected, always show the questions
    // Just always show them since it's the only position
    if (true) {
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
                    Rate your experience with <strong>TMS MyCarrier</strong> (<strong>Transportation Management System</strong>) *
                    <Tooltip text="TMS MyCarrier is a Transportation Management System used for coordinating freight, tracking shipments, and managing logistics for chemical distribution.">
                      <span className="ml-2 text-blue-500 cursor-help">❓</span>
                    </Tooltip>
                  </label>
                  <select 
                    {...register('roleAssessment.tmsMyCarrierExperience')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                      errors.roleAssessment?.tmsMyCarrierExperience 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select experience level</option>
                    <option value="none">Never used</option>
                    <option value="basic">Basic - Can navigate and perform simple tasks</option>
                    <option value="intermediate">Intermediate - Can handle most customer inquiries</option>
                    <option value="advanced">Advanced - Can troubleshoot and train others</option>
                    <option value="expert">Expert - Can optimize workflows and processes</option>
                  </select>
                  {errors.roleAssessment?.tmsMyCarrierExperience && (
                    <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.tmsMyCarrierExperience.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your experience with <strong>Shopify</strong> for <strong>order management</strong> and <strong>customer support</strong> *
                    <Tooltip text="Shopify is an e-commerce platform used for online store management, order processing, inventory tracking, and customer support.">
                      <span className="ml-2 text-blue-500 cursor-help">❓</span>
                    </Tooltip>
                  </label>
                  <textarea
                    {...register('roleAssessment.shopifyExperience')}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                      errors.roleAssessment?.shopifyExperience 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Describe specific tasks you've performed (order tracking, refunds, inventory inquiries, etc.)"
                  />
                  {errors.roleAssessment?.shopifyExperience && (
                    <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.shopifyExperience.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <strong>Amazon Seller Central</strong> experience level *
                    <Tooltip text="Amazon Seller Central is a platform for managing product listings, orders, customer messages, and account settings on Amazon marketplace.">
                      <span className="ml-2 text-blue-500 cursor-help">❓</span>
                    </Tooltip>
                  </label>
                  <select 
                    {...register('roleAssessment.amazonSellerCentralExperience')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                      errors.roleAssessment?.amazonSellerCentralExperience 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select experience level</option>
                    <option value="none">No experience</option>
                    <option value="basic">Basic - Can view orders and basic account management</option>
                    <option value="intermediate">Intermediate - Can handle customer messages and returns</option>
                    <option value="advanced">Advanced - Can manage listings and resolve account issues</option>
                  </select>
                  {errors.roleAssessment?.amazonSellerCentralExperience && (
                    <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.amazonSellerCentralExperience.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate your proficiency with <strong>Microsoft Excel</strong> for <strong>data analysis</strong> and <strong>reporting</strong>
                  </label>
                  <select 
                    {...register('roleAssessment.excelProficiency')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">Select proficiency level</option>
                    <option value="basic">Basic - Can create simple spreadsheets and basic formulas</option>
                    <option value="intermediate">Intermediate - Can use VLOOKUP, pivot tables, and charts</option>
                    <option value="advanced">Advanced - Can create complex reports and macros</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your experience with <strong>Canva</strong> for creating <strong>customer-facing materials</strong>
                  </label>
                  <textarea
                    {...register('roleAssessment.canvaExperience')}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                    When you receive <strong>conflicting information</strong> from different sources (<strong>customer</strong>, <strong>system</strong>, <strong>supervisor</strong>), how do you determine the truth?
                  </label>
                  <textarea
                    {...register('roleAssessment.conflictingInformation')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Describe your fact-checking and verification process..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What motivates you most: <strong>solving complex problems</strong>, <strong>helping people</strong>, or <strong>achieving measurable results</strong>? Explain why.
                  </label>
                  <textarea
                    {...register('roleAssessment.workMotivation')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                    A customer calls saying their <strong>chemical shipment</strong> was <strong>delayed</strong> and they need it for <strong>production tomorrow</strong>. The <strong>carrier</strong> shows it's still in transit. How would you handle this?
                  </label>
                  <textarea
                    {...register('roleAssessment.delayedShipmentScenario')}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Describe your step-by-step approach..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    You notice a customer has been placing increasingly large orders of a <strong>restricted chemical</strong>. What actions would you take?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Consider compliance, documentation, and escalation procedures..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    A customer questions why their <strong>hazardous material</strong> shipment costs more than <strong>regular freight</strong>. How do you explain the additional fees? *
                  </label>
                  <textarea
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                      errors.roleAssessment?.hazmatFreightScenario 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Explain your approach to educating customers about hazmat regulations..."
                  />
                  {errors.roleAssessment?.hazmatFreightScenario && (
                    <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.hazmatFreightScenario.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Personal Assessment */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Personal & Professional Assessment</h4>
              <div className="space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What motivates you most in a <strong>customer service role</strong>? (Select all that apply)
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
                    How do you handle <strong>stress</strong> when dealing with <strong>multiple urgent customer requests</strong> simultaneously?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Describe your prioritization and stress management techniques..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    If you could <strong>automate</strong> one <strong>repetitive task</strong> in customer service, what would it be and why?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                    In your experience, what's the most important factor in maintaining <strong>customer loyalty</strong> in <strong>B2B sales</strong>?
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
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
                    How would you use <strong>data</strong> from <strong>customer interactions</strong> to improve <strong>service quality</strong>?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Consider metrics, patterns, and actionable insights..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your ideal <strong>work environment</strong> and <strong>team dynamics</strong>
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
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
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Include SDS sheets, PPE, spill procedures, etc..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How would you handle finding a damaged chemical container?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Describe your intrinsic motivation and work ethic..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How do you maintain focus during repetitive tasks?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
    <div className="space-y-8 animate-fade-in" ref={(el) => { stepRefs.current[0] = el; }} tabIndex={-1}>
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
          <span className="text-2xl text-white">💼</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Select Your Position</h2>
        <p className="text-gray-600 text-lg">Choose the role that matches your career goals</p>
      </div>
      
      <fieldset className="grid gap-6">
        <legend className="sr-only">Available Position</legend>
        <div className="group relative">
          <input
            type="radio"
            value="1"
            id="job-1"
            {...register('jobPostingId', { 
              setValueAs: (value: string) => value === "" ? undefined : Number(value)
            })}
            className="sr-only peer"
            aria-describedby="job-1-description"
            defaultChecked
          />
          <label
            htmlFor="job-1"
            className="block cursor-pointer rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 transition-all duration-300 hover:border-blue-400 hover:shadow-lg peer-checked:border-blue-500 peer-checked:bg-gradient-to-r peer-checked:from-blue-100 peer-checked:to-indigo-100 peer-checked:shadow-xl peer-focus:ring-4 peer-focus:ring-blue-200"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-200">
                  📞
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-blue-900 mb-2">Customer Service Specialist</h3>
                <p className="text-blue-700 font-medium mb-3">Sales & Customer Support</p>
                <p className="text-gray-700 leading-relaxed">
                  Join our dynamic customer service team and help chemical industry professionals with their orders, technical questions, and logistics needs. Perfect for detail-oriented individuals who love problem-solving.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    💰 Competitive Salary
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    📈 Growth Opportunities
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-6 h-6 border-2 border-blue-300 rounded-full flex items-center justify-center peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all duration-200">
                  <div className="w-3 h-3 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></div>
                </div>
              </div>
            </div>
          </label>
        </div>
      </fieldset>
      
      {errors.jobPostingId && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600 flex items-center" role="alert" aria-live="polite">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.jobPostingId.message}
          </p>
        </div>
      )}
    </div>
  );

  const renderAssessment = () => (
    <div className="space-y-6" ref={el => { stepRefs.current[1] = el; }} tabIndex={-1}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Service Role Assessment</h2>
        <p className="text-gray-600">Complete the following assessment questions to help us understand your qualifications and approach</p>
      </div>
      
      {/* Tool Experience Questions */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Technical Platform Experience</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rate your experience with <strong>TMS MyCarrier</strong> (<strong>Transportation Management System</strong>) *
              <Tooltip text="TMS MyCarrier is a Transportation Management System used for coordinating freight, tracking shipments, and managing logistics for chemical distribution.">
                <span className="ml-2 text-blue-500 cursor-help">❓</span>
              </Tooltip>
            </label>
            <select 
              {...register('roleAssessment.tmsMyCarrierExperience')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.tmsMyCarrierExperience 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
            >
              <option value="">Select experience level</option>
              <option value="none">Never used</option>
              <option value="basic">Basic - Can navigate and perform simple tasks</option>
              <option value="intermediate">Intermediate - Can handle most customer inquiries</option>
              <option value="advanced">Advanced - Can troubleshoot and train others</option>
              <option value="expert">Expert - Can optimize workflows and processes</option>
            </select>
            {errors.roleAssessment?.tmsMyCarrierExperience && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.tmsMyCarrierExperience.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your experience with <strong>Shopify</strong> for <strong>order management</strong> and <strong>customer support</strong> *
              <Tooltip text="Shopify is an e-commerce platform used for online store management, order processing, inventory tracking, and customer support.">
                <span className="ml-2 text-blue-500 cursor-help">❓</span>
              </Tooltip>
            </label>
            <textarea
              {...register('roleAssessment.shopifyExperience')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.shopifyExperience 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Describe specific tasks you've performed (order tracking, refunds, inventory inquiries, etc.)"
            />
            {errors.roleAssessment?.shopifyExperience && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.shopifyExperience.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <strong>Amazon Seller Central</strong> experience level *
              <Tooltip text="Amazon Seller Central is a platform for managing product listings, orders, customer messages, and account settings on Amazon marketplace.">
                <span className="ml-2 text-blue-500 cursor-help">❓</span>
              </Tooltip>
            </label>
            <select 
              {...register('roleAssessment.amazonSellerCentralExperience')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.amazonSellerCentralExperience 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
            >
              <option value="">Select experience level</option>
              <option value="none">No experience</option>
              <option value="basic">Basic - Can view orders and basic account management</option>
              <option value="intermediate">Intermediate - Can handle customer messages and returns</option>
              <option value="advanced">Advanced - Can manage listings and resolve account issues</option>
            </select>
            {errors.roleAssessment?.amazonSellerCentralExperience && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.amazonSellerCentralExperience.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rate your proficiency with <strong>Microsoft Excel</strong> for <strong>data analysis</strong> and <strong>reporting</strong> *
            </label>
            <select 
              {...register('roleAssessment.excelProficiency')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.excelProficiency 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
            >
              <option value="">Select proficiency level</option>
              <option value="basic">Basic - Can create simple spreadsheets and basic formulas</option>
              <option value="intermediate">Intermediate - Can use VLOOKUP, pivot tables, and charts</option>
              <option value="advanced">Advanced - Can create complex reports and macros</option>
            </select>
            {errors.roleAssessment?.excelProficiency && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.excelProficiency.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your experience with <strong>Canva</strong> for creating <strong>customer-facing materials</strong> *
            </label>
            <textarea
              {...register('roleAssessment.canvaExperience')}
              rows={2}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.canvaExperience 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Examples: flyers, social media posts, presentations, infographics..."
            />
            {errors.roleAssessment?.canvaExperience && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.canvaExperience.message}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Personal Assessment Questions */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Work Style Assessment</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe a time when you had to learn a completely new <strong>software system</strong> under <strong>pressure</strong>. How did you approach it? *
            </label>
            <textarea
              {...register('roleAssessment.learningUnderPressure')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.learningUnderPressure 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Focus on your learning process and adaptation strategies..."
            />
            {errors.roleAssessment?.learningUnderPressure && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.learningUnderPressure.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              When you receive <strong>conflicting information</strong> from different sources (<strong>customer</strong>, <strong>system</strong>, <strong>supervisor</strong>), how do you determine the truth? *
            </label>
            <textarea
              {...register('roleAssessment.conflictingInformation')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.conflictingInformation 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Describe your fact-checking and verification process..."
            />
            {errors.roleAssessment?.conflictingInformation && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.conflictingInformation.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What motivates you most: <strong>solving complex problems</strong>, <strong>helping people</strong>, or <strong>achieving measurable results</strong>? Explain why. *
            </label>
            <textarea
              {...register('roleAssessment.workMotivation')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.workMotivation 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Help us understand what drives your work satisfaction..."
            />
            {errors.roleAssessment?.workMotivation && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.workMotivation.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your approach to <strong>learning new software systems</strong> and <strong>adapting to new technology</strong> *
            </label>
            <textarea
              {...register('roleAssessment.softwareLearningExperience')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.softwareLearningExperience 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Describe your learning process, resources you use, and how you adapt to new tools..."
            />
            {errors.roleAssessment?.softwareLearningExperience && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.softwareLearningExperience.message}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Scenario-Based Questions */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Service Scenarios</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              A customer calls saying their <strong>chemical shipment</strong> was <strong>delayed</strong> and they need it for <strong>production tomorrow</strong>. The <strong>carrier</strong> shows it's still in transit. How would you handle this? *
            </label>
            <textarea
              {...register('roleAssessment.delayedShipmentScenario')}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.delayedShipmentScenario 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Describe your step-by-step approach..."
            />
            {errors.roleAssessment?.delayedShipmentScenario && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.delayedShipmentScenario.message}</p>
            )}
          </div>
          
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              A customer questions why their <strong>hazardous material</strong> shipment costs more than <strong>regular freight</strong>. How do you explain the additional fees? *
            </label>
            <textarea
              {...register('roleAssessment.hazmatFreightScenario')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.hazmatFreightScenario 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Explain your approach to educating customers about hazmat regulations..."
            />
            {errors.roleAssessment?.hazmatFreightScenario && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.hazmatFreightScenario.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              A potential new customer, <strong>Barry from Widgets Inc.</strong>, has requested a <strong>quote</strong>. You need to provide pricing for <strong>4 drums of Acetic Acid</strong> at <strong>$800 per drum</strong>, with a total <strong>shipping cost of $200</strong> to their location in <strong>Brooklyn, New York</strong>. Write the exact professional email you would send to Barry. *
            </label>
            <textarea
              {...register('roleAssessment.customerQuoteScenario')}
              rows={6}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.customerQuoteScenario 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Write a professional quote email that presents pricing clearly and encourages the customer to place the order..."
            />
            {errors.roleAssessment?.customerQuoteScenario && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.customerQuoteScenario.message}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Personal Assessment */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal & Professional Assessment</h3>
        <div className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What motivates you most in a <strong>customer service role</strong>? (Select all that apply) *
            </label>
            <div className="space-y-2">
              {[
                { value: 'solvingProblems', label: 'Solving complex problems' },
                { value: 'buildingRelationships', label: 'Building long-term customer relationships' },
                { value: 'learningTechnologies', label: 'Learning new technologies and processes' },
                { value: 'workingWithData', label: 'Working with data and analytics' },
                { value: 'helpingCustomers', label: 'Helping customers achieve their goals' },
                { value: 'fastPacedEnvironment', label: 'Working in a fast-paced environment' }
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('roleAssessment.customerServiceMotivation')}
                    value={option.value}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label className="text-sm text-gray-700">{option.label}</label>
                </div>
              ))}
            </div>
            {errors.roleAssessment?.customerServiceMotivation && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.customerServiceMotivation.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How do you handle <strong>stress</strong> when dealing with <strong>multiple urgent customer requests</strong> simultaneously? *
            </label>
            <textarea
              {...register('roleAssessment.stressManagement')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.stressManagement 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Describe your prioritization and stress management techniques..."
            />
            {errors.roleAssessment?.stressManagement && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.stressManagement.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              If you could <strong>automate</strong> one <strong>repetitive task</strong> in customer service, what would it be and why? *
            </label>
            <textarea
              {...register('roleAssessment.automationIdeas')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.automationIdeas 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Think about efficiency and customer experience improvements..."
            />
            {errors.roleAssessment?.automationIdeas && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.automationIdeas.message}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Advanced Role Assessment */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Advanced Role Assessment</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              In your experience, what's the most important factor in maintaining <strong>customer loyalty</strong> in <strong>B2B sales</strong>? *
            </label>
            <select 
              {...register('roleAssessment.b2bLoyaltyFactor')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.b2bLoyaltyFactor 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
            >
              <option value="">Select your answer</option>
              <option value="pricing">Competitive pricing</option>
              <option value="reliability">Consistent delivery and quality</option>
              <option value="communication">Proactive communication</option>
              <option value="problemSolving">Quick problem resolution</option>
              <option value="relationship">Personal relationships</option>
              <option value="expertise">Technical expertise and advice</option>
            </select>
            {errors.roleAssessment?.b2bLoyaltyFactor && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.b2bLoyaltyFactor.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How would you use <strong>data</strong> from <strong>customer interactions</strong> to improve <strong>service quality</strong>? *
            </label>
            <textarea
              {...register('roleAssessment.dataAnalysisApproach')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.dataAnalysisApproach 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Consider metrics, patterns, and actionable insights..."
            />
            {errors.roleAssessment?.dataAnalysisApproach && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.dataAnalysisApproach.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your ideal <strong>work environment</strong> and <strong>team dynamics</strong> *
            </label>
            <textarea
              {...register('roleAssessment.idealWorkEnvironment')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.roleAssessment?.idealWorkEnvironment 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Include communication style, collaboration preferences, and work pace..."
            />
            {errors.roleAssessment?.idealWorkEnvironment && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.idealWorkEnvironment.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="space-y-8" ref={el => { stepRefs.current[2] = el; }} tabIndex={-1}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600">Complete employee information required</p>
      </div>

      {/* Basic Personal Info */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
              First Name *
            </label>
            <div className="relative">
              <input
                type="text"
                {...register('personalInfo.firstName')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 placeholder-gray-400 text-gray-900 bg-white"
                placeholder="Enter your first name"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-400">👤</span>
              </div>
            </div>
            {errors.personalInfo?.firstName && (
              <p className="mt-2 text-sm text-red-600 flex items-center animate-shake">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.personalInfo.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
            <input
              type="text"
              {...register('personalInfo.middleName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
            <input
              type="text"
              {...register('personalInfo.lastName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
            {errors.personalInfo?.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.lastName.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
              Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                {...register('personalInfo.email')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 placeholder-gray-400 text-gray-900 bg-white"
                placeholder="Enter your email address"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-400">📧</span>
              </div>
            </div>
            {errors.personalInfo?.email && (
              <p className="mt-2 text-sm text-red-600 flex items-center animate-shake">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.personalInfo.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Phone *</label>
            <input
              type="tel"
              {...register('personalInfo.phone')}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            ) : (
              <input
                type="text"
                {...register('personalInfo.desiredSalary')}
                placeholder="$XX,XXX or Negotiable"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Start Date *</label>
            <input
              type="date"
              {...register('personalInfo.availableStartDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
            {errors.personalInfo?.availableStartDate && (
              <p className="mt-1 text-sm text-red-600">{errors.personalInfo.availableStartDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hours Available *</label>
            <select
              {...register('personalInfo.hoursAvailable')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select shift preference</option>
              <option value="8am-4pm">8 AM - 4 PM</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-4">
          <span className="text-2xl text-white">📄</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Upload Documents</h2>
        <p className="text-gray-600 text-lg">Help us get to know you better with your documents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resume Upload */}
        <div className="group">
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/50 group-hover:shadow-lg">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Resume / CV</h3>
            <p className="text-sm text-gray-600 mb-6">Upload PDF, DOC, or DOCX (max 10MB)</p>
            
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeUpload}
              className="hidden"
              id="resume-upload"
            />
            
            <label
              htmlFor="resume-upload"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Choose File
            </label>
            
            <p className="text-xs text-gray-500 mt-3">Or drag and drop your file here</p>
            
            {uploadError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 flex items-center" role="alert">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {uploadError}
                </p>
              </div>
            )}
            
            {resumeFile && !uploadError && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {resumeFile.name}
                </p>
              </div>
            )}
            
            {aiParsing && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-blue-600 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium text-blue-600">AI is parsing your resume...</span>
                </div>
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                
                {uploadProgress === 100 && (
                  <p className="text-sm text-green-600 text-center font-medium">
                    ✓ Resume parsed successfully! We've pre-filled some fields for you.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ID Photo Upload */}
        <div className="group">
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center transition-all duration-300 hover:border-purple-400 hover:bg-purple-50/50 group-hover:shadow-lg">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">ID Photo</h3>
            <p className="text-sm text-gray-600 mb-6">Upload JPG or PNG (max 5MB) or take a photo</p>
            
            {/* Method Selection */}
            <div className="flex justify-center mb-6">
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setIdCaptureMethod('upload')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    idCaptureMethod === 'upload'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setIdCaptureMethod('camera')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    idCaptureMethod === 'camera'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Take Photo
                </button>
              </div>
            </div>

            {/* Upload Option */}
            {idCaptureMethod === 'upload' && (
              <>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleIdUpload}
                  className="hidden"
                  id="id-upload"
                />
                
                <label
                  htmlFor="id-upload"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Choose File
                </label>
                
                <p className="text-xs text-gray-500 mt-3">Or drag and drop your photo here</p>
              </>
            )}

            {/* Camera Option */}
            {idCaptureMethod === 'camera' && (
              <div className="space-y-4">
                {!showCamera ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Start Camera
                  </button>
                ) : (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                      style={{ maxHeight: '300px' }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    <div className="flex justify-center space-x-4 mt-4">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Capture Photo
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {idFile && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {idFile.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-800">Document Privacy & Security</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your documents are encrypted and securely stored. We only use them for employment verification purposes and will never share them with third parties without your consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkExperience = () => (
    <div className="space-y-6" ref={el => { stepRefs.current[4] = el; }} tabIndex={-1}>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
              <input
                type="text"
                {...register(`workExperience.${index}.jobTitle`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="month"
                {...register(`workExperience.${index}.startDate`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="month"
                {...register(`workExperience.${index}.endDate`)}
                disabled={watchedValues.workExperience?.[index]?.isCurrent}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white disabled:bg-gray-100"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
    <div className="space-y-6" ref={el => { stepRefs.current[5] = el; }} tabIndex={-1}>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Degree Type</label>
              <select
                {...register(`education.${index}.degreeType`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="">Select degree type</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Date</label>
              <input
                type="month"
                {...register(`education.${index}.graduationDate`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GPA (optional)</label>
              <input
                type="text"
                {...register(`education.${index}.gpa`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="e.g., 3.5"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register(`education.${index}.isCompleted`)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Completed</span>
              </label>
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
          isCompleted: false
        })}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
      >
        + Add Another Education
      </button>
    </div>
  );

  const renderReferences = () => (
    <div className="space-y-6" ref={el => { stepRefs.current[6] = el; }} tabIndex={-1}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Professional References</h2>
        <p className="text-gray-600">Provide contact information for your previous employers</p>
      </div>

      {referenceFields.map((field, index) => (
        <div key={field.id} className="border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Reference {index + 1}</h3>
            {referenceFields.length > 1 && (
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              <input
                type="text"
                {...register(`references.${index}.company`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>



            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
              <input
                type="text"
                {...register(`references.${index}.relationship`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="e.g., Former Supervisor, Colleague"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                {...register(`references.${index}.phone`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email (optional)</label>
              <input
                type="email"
                {...register(`references.${index}.email`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years Known (optional)</label>
              <input
                type="number"
                {...register(`references.${index}.yearsKnown`, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                min="0"
                max="50"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => appendReference({
          name: '',
          relationship: '',
          company: '',
          phone: '',
          email: '',
          yearsKnown: 0
        })}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
      >
        + Add Another Reference
      </button>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6" ref={el => { stepRefs.current[7] = el; }} tabIndex={-1}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Application</h2>
        <p className="text-gray-600">Please review all the information you've provided before submitting your application.</p>
      </div>

      {/* Add any additional review components you want to include */}
    </div>
  );

  const renderSignature = () => (
    <div className="space-y-6" ref={el => { stepRefs.current[8] = el; }} tabIndex={-1}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign Your Application</h2>
        <p className="text-gray-600">Please sign your application to complete the process.</p>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Signature</h3>
        
        <div className="flex justify-center mb-6">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => handleSignatureMethodChange('draw')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                signatureMethod === 'draw'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Draw Signature
            </button>
            <button
              type="button"
              onClick={() => handleSignatureMethodChange('type')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                signatureMethod === 'type'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Type Signature
            </button>
          </div>
        </div>

        {signatureMethod === 'draw' ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Draw your signature in the box below using your mouse or touch
              </p>
            </div>
            <div 
              ref={signatureContainerRef}
              className="border border-gray-300 rounded-lg p-2 bg-gray-50"
            >
              <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                  width: canvasSize.width,
                  height: canvasSize.height,
                  className: 'signature-canvas border-0 rounded-lg bg-white',
                  style: {
                    width: `${canvasSize.width}px`,
                    height: `${canvasSize.height}px`,
                    display: 'block',
                    margin: '0 auto'
                  }
                }}
                onEnd={captureSignature}
              />
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={clearSignature}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={captureSignature}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save Signature
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type your full name as your signature
              </label>
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => handleTypedSignatureChange(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            
            {typedSignature && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Signature Preview:</p>
                <p className="text-2xl font-script italic text-blue-600">{typedSignature}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-start space-x-3">
          <input
            type="checkbox"
            {...register('termsAgreed')}
            className="w-4 h-4 text-blue-600 rounded mt-1"
          />
          <label className="text-sm text-gray-700">
            <strong>I certify that all information provided is true and accurate to the best of my knowledge *</strong>
          </label>
        </div>
        {errors.termsAgreed && (
          <p className="mt-1 text-sm text-red-600">{errors.termsAgreed.message}</p>
        )}
      </div>

      {/* Additional Information */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Is there anything else you'd like us to know about your application?
          </label>
          <textarea
            {...register('additionalInfo')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="Optional: Any additional information, accommodations needed, or questions..."
          />
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderJobSelection();
      case 1:
        return renderAssessment();
      case 2:
        return renderPersonalInfo();
      case 3:
        return renderFileUploads();
      case 4:
        return renderWorkExperience();
      case 5:
        return renderEducation();
      case 6:
        return renderReferences();
      case 7:
        return renderReview();
      case 8:
        return renderSignature();
      default:
        return <div>Invalid step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Employee Application
          </h1>
          <p className="text-xl text-gray-600">
            Join the Alliance Chemical Team
          </p>
          {/* Auto-save indicator */}
          <div className="mt-4">
            {isAutoSaving ? (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </div>
            ) : (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600">
                <svg className="mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Auto-saved
              </div>
            )}
          </div>
        </div>

        {/* Development Mode Test Data Buttons */}
        {(process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production' || typeof window !== 'undefined' && window.location.hostname === 'localhost') && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">🧪 Development Mode - Test Data Auto-Fill</h3>
            <p className="text-sm text-yellow-700 mb-3">
              Click any button below to automatically fill the form with realistic test data:
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => populateTestData('default')}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105"
              >
                📋 Load Complete Application
              </button>
              <button
                type="button"
                onClick={() => populateTestData('entryLevel')}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105"
              >
                🌱 Load Entry Level Profile
              </button>
              <button
                type="button"
                onClick={() => populateTestData('experienced')}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105"
              >
                🚀 Load Experienced Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  clearFormDataFromLocalStorage();
                  window.location.reload();
                }}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105"
              >
                🗑️ Clear Form Data
              </button>
            </div>
            <p className="text-xs text-yellow-600 mt-2">
              💡 After clicking, navigate through steps or jump to the signature step to submit the test application.
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(((currentStep + 1) / STEPS.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(index)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  index === currentStep
                    ? 'bg-blue-600 text-white shadow-lg'
                    : visitedSteps.has(index)
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!visitedSteps.has(index) && index !== currentStep}
              >
                <span className="mr-2">{step.icon}</span>
                <span className="hidden sm:inline">{step.shortTitle}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </p>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log('❌ Form validation failed:', errors);
            console.log('All form errors:', Object.keys(errors));
            
            // Create a user-friendly error message
            const errorMessages = [];
            
            if (errors.personalInfo) {
              errorMessages.push('Personal Information section has errors');
            }
            if (errors.roleAssessment) {
              const roleErrors = [];
              if (errors.roleAssessment.tmsMyCarrierExperience) {
                roleErrors.push('TMS MyCarrier experience level');
              }
              if (errors.roleAssessment.shopifyExperience) {
                roleErrors.push('Shopify experience description required');
              }
              if (errors.roleAssessment.amazonSellerCentralExperience) {
                roleErrors.push('Amazon Seller Central experience level');
              }
              if (errors.roleAssessment.excelProficiency) {
                roleErrors.push('Excel proficiency level');
              }
              if (errors.roleAssessment.canvaExperience) {
                roleErrors.push('Canva experience description required');
              }
              if (errors.roleAssessment.learningUnderPressure) {
                roleErrors.push('Learning under pressure response required');
              }
              if (errors.roleAssessment.conflictingInformation) {
                roleErrors.push('Conflicting information response required');
              }
              if (errors.roleAssessment.workMotivation) {
                roleErrors.push('Work motivation response required');
              }
              if (errors.roleAssessment.delayedShipmentScenario) {
                roleErrors.push('Delayed shipment scenario response required');
              }
              if (errors.roleAssessment.hazmatFreightScenario) {
                roleErrors.push('Hazmat freight scenario response required');
              }
              if (errors.roleAssessment.customerQuoteScenario) {
                roleErrors.push('Customer quote email response required');
              }
              if (errors.roleAssessment.softwareLearningExperience) {
                roleErrors.push('Software learning experience description required');
              }
              if (errors.roleAssessment.customerServiceMotivation) {
                roleErrors.push('Customer service motivation (select at least one)');
              }
              if (errors.roleAssessment.stressManagement) {
                roleErrors.push('Stress management approach required');
              }
              if (errors.roleAssessment.automationIdeas) {
                roleErrors.push('Automation ideas required');
              }
              if (errors.roleAssessment.b2bLoyaltyFactor) {
                roleErrors.push('B2B customer loyalty factor');
              }
              if (errors.roleAssessment.dataAnalysisApproach) {
                roleErrors.push('Data analysis approach required');
              }
              if (errors.roleAssessment.idealWorkEnvironment) {
                roleErrors.push('Ideal work environment required');
              }
              
              if (roleErrors.length > 0) {
                errorMessages.push('Role Assessment - Fix these fields:\n    • ' + roleErrors.join('\n    • '));
              } else {
                errorMessages.push('Role Assessment section has errors');
              }
            }
            if (errors.eligibility) {
              errorMessages.push('Eligibility section has errors');
            }
            if (errors.workExperience) {
              errorMessages.push('Work Experience section needs at least one entry');
            }
            if (errors.education) {
              errorMessages.push('Education section needs at least one entry');
            }
            if (errors.references) {
              errorMessages.push('References section needs at least one entry');
            }
            if (errors.signatureDataUrl) {
              errorMessages.push('Digital signature is required');
            }
            if (errors.termsAgreed) {
              errorMessages.push('You must agree to terms and conditions');
            }
            
            const message = errorMessages.length > 0 
              ? '❌ Cannot submit application:\n\n• ' + errorMessages.join('\n• ')
              : '❌ Form validation failed. Please check all required fields.';
              
            setErrorMessage(message);
            alert(message);
          })}>
            {/* Step Content */}
            <div className="mb-8">
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  currentStep === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 transform hover:scale-105'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <div className="flex space-x-4">
                {currentStep === STEPS.length - 1 ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={() => {
                      console.log('🚀 Submit button clicked!');
                      setErrorMessage(''); // Clear any previous errors
                    }}
                    className={`flex items-center px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isSubmitting
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transform hover:scale-105 shadow-lg'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Submit Application
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Next
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}