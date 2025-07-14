"use client";
import { useState, useRef, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import SignatureCanvas from 'react-signature-canvas';
import { employeeApplicationSchema, type EmployeeApplicationForm } from '@/lib/employee-validation';
import { generateTestData, generateTestDataVariations } from '@/lib/test-data';

const STEPS = [
  { id: 'job', title: 'Position', icon: '💼', description: 'Select your role' },
  { id: 'assessment', title: 'Assessment', icon: '📝', description: 'Role evaluation' },
  { id: 'personal', title: 'Personal', icon: '👤', description: 'Basic details' },
  { id: 'files', title: 'Documents', icon: '📄', description: 'Upload files' },
  { id: 'experience', title: 'Experience', icon: '🏢', description: 'Work history' },
  { id: 'education', title: 'Education', icon: '🎓', description: 'Academic background' },
  { id: 'references', title: 'References', icon: '👥', description: 'Professional contacts' },
  { id: 'signature', title: 'Signature', icon: '✍️', description: 'Final confirmation' }
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
      jobPostingId: 1, // Customer Service Specialist is the only option
      roleAssessment: {
        tmsMyCarrierExperience: undefined,
        shopifyExperience: '',
        amazonSellerCentralExperience: undefined,
        excelProficiency: undefined,
        canvaExperience: '',
        learningUnderPressure: '',
        conflictingInformation: '',
        workMotivation: '',
        delayedShipmentScenario: '',
        restrictedChemicalScenario: '',
        hazmatFreightScenario: '',
        customerQuoteScenario: '',
        softwareLearningExperience: '',
        customerServiceMotivation: [],
        stressManagement: '',
        automationIdeas: '',
        b2bLoyaltyFactor: undefined,
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
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < STEPS.length) {
      setCurrentStep(stepIndex);
      setVisitedSteps(prev => new Set([...prev, stepIndex]));
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

  // Enhanced test data population function
  const populateTestData = (scenario: 'default' | 'entryLevel' | 'experienced' = 'default') => {
    const testData = scenario === 'default' 
      ? generateTestData() 
      : generateTestDataVariations()[scenario];

    // Set personal info
    Object.entries(testData.personalInfo).forEach(([key, value]) => {
      setValue(`personalInfo.${key}` as any, value);
    });

    // Set role assessment
    Object.entries(testData.roleAssessment).forEach(([key, value]) => {
      setValue(`roleAssessment.${key}` as any, value);
    });

    // Set eligibility
    Object.entries(testData.eligibility).forEach(([key, value]) => {
      setValue(`eligibility.${key}` as any, value);
    });

    // Set work experience
    setValue('workExperience', testData.workExperience);

    // Set education
    setValue('education', testData.education);

    // Set references
    setValue('references', testData.references);

    // Set job posting ID
    setValue('jobPostingId', testData.jobPostingId);

    // Set signature data
    setValue('signatureDataUrl', testData.signatureDataUrl);

    // Set terms agreed
    setValue('termsAgreed', testData.termsAgreed);

    // Set additional info
    if (testData.additionalInfo) {
      setValue('additionalInfo', testData.additionalInfo);
    }

    // Mark all steps as visited and valid
    setVisitedSteps(new Set(Array.from({ length: STEPS.length }, (_, i) => i)));
    setIsStepValid(new Array(STEPS.length).fill(true));

    // Add mock signature to canvas if it exists
    if (sigCanvas.current) {
      sigCanvas.current.fromDataURL(testData.signatureDataUrl);
    }

    // Show enhanced success message
    const scenarioName = scenario === 'default' ? 'Complete Application' : 
                        scenario === 'entryLevel' ? 'Entry Level Profile' : 
                        'Experienced Professional Profile';
    
    setSuccessMessage(`✅ ${scenarioName} data loaded! All steps are now filled and ready for submission. You can navigate through all steps or proceed directly to submit.`);
    setErrorMessage('');
    
    // Automatically navigate to the last step (signature) to show completion
    setTimeout(() => {
      setCurrentStep(STEPS.length - 1);
    }, 1000);
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
                    Rate your experience with <strong>TMS MyCarrier</strong> (<strong>Transportation Management System</strong>)
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
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
                    Describe your experience with <strong>Shopify</strong> for <strong>order management</strong> and <strong>customer support</strong>
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe specific tasks you've performed (order tracking, refunds, inventory inquiries, etc.)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <strong>Amazon Seller Central</strong> experience level
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
                    <option value="">Select experience level</option>
                    <option value="none">No experience</option>
                    <option value="basic">Basic - Can view orders and basic account management</option>
                    <option value="intermediate">Intermediate - Can handle customer messages and returns</option>
                    <option value="advanced">Advanced - Can manage listings and resolve account issues</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate your proficiency with <strong>Microsoft Excel</strong> for <strong>data analysis</strong> and <strong>reporting</strong>
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
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
                    When you receive <strong>conflicting information</strong> from different sources (<strong>customer</strong>, <strong>system</strong>, <strong>supervisor</strong>), how do you determine the truth?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your fact-checking and verification process..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What motivates you most: <strong>solving complex problems</strong>, <strong>helping people</strong>, or <strong>achieving measurable results</strong>? Explain why.
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
                    A customer calls saying their <strong>chemical shipment</strong> was <strong>delayed</strong> and they need it for <strong>production tomorrow</strong>. The <strong>carrier</strong> shows it's still in transit. How would you handle this?
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your step-by-step approach..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    You notice a customer has been placing increasingly large orders of a <strong>restricted chemical</strong>. What actions would you take?
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Consider compliance, documentation, and escalation procedures..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    A customer questions why their <strong>hazardous material</strong> shipment costs more than <strong>regular freight</strong>. How do you explain the additional fees?
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your prioritization and stress management techniques..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    If you could <strong>automate</strong> one <strong>repetitive task</strong> in customer service, what would it be and why?
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Consider metrics, patterns, and actionable insights..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your ideal <strong>work environment</strong> and <strong>team dynamics</strong>
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
            </label>
            <select 
              {...register('roleAssessment.tmsMyCarrierExperience')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
            </label>
            <textarea
              {...register('roleAssessment.shopifyExperience')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
            </label>
            <select 
              {...register('roleAssessment.amazonSellerCentralExperience')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              You notice a customer has been placing increasingly large orders of a <strong>restricted chemical</strong>. What actions would you take? *
            </label>
            <textarea
              {...register('roleAssessment.restrictedChemicalScenario')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.roleAssessment?.restrictedChemicalScenario 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Consider compliance, documentation, and escalation procedures..."
            />
            {errors.roleAssessment?.restrictedChemicalScenario && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.restrictedChemicalScenario.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              A customer questions why their <strong>hazardous material</strong> shipment costs more than <strong>regular freight</strong>. How do you explain the additional fees? *
            </label>
            <textarea
              {...register('roleAssessment.hazmatExplanationScenario')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.roleAssessment?.hazmatExplanationScenario 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Explain your approach to educating customers about hazmat regulations..."
            />
            {errors.roleAssessment?.hazmatExplanationScenario && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.hazmatExplanationScenario.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              A potential new customer, <strong>Barry from Widgets Inc.</strong>, has requested a <strong>quote</strong>. You need to provide pricing for <strong>4 drums of Acetic Acid</strong> at <strong>$800 per drum</strong>, with a total <strong>shipping cost of $200</strong> to their location in <strong>Brooklyn, New York</strong>. Write the exact professional email you would send to Barry. *
            </label>
            <textarea
              {...register('roleAssessment.professionalEmailScenario')}
              rows={6}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.roleAssessment?.professionalEmailScenario 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Write a professional quote email that presents pricing clearly and encourages the customer to place the order..."
            />
            {errors.roleAssessment?.professionalEmailScenario && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.professionalEmailScenario.message}</p>
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
              Describe a time when you had to learn a <strong>complex software system</strong> quickly. How did you approach it? *
            </label>
            <textarea
              {...register('roleAssessment.softwareLearningExperience')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.roleAssessment?.softwareLearningExperience 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Include the system, timeline, and your learning strategy..."
            />
            {errors.roleAssessment?.softwareLearningExperience && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.softwareLearningExperience.message}</p>
            )}
          </div>
          
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
                    {...register('roleAssessment.customerServiceMotivations')}
                    value={option.value}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label className="text-sm text-gray-700">{option.label}</label>
                </div>
              ))}
            </div>
            {errors.roleAssessment?.customerServiceMotivations && (
              <p className="mt-1 text-sm text-red-600">{errors.roleAssessment.customerServiceMotivations.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How do you handle <strong>stress</strong> when dealing with <strong>multiple urgent customer requests</strong> simultaneously? *
            </label>
            <textarea
              {...register('roleAssessment.stressManagement')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 placeholder-gray-400"
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

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
              Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                {...register('personalInfo.email')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 placeholder-gray-400"
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
    <div className="space-y-6" ref={el => { stepRefs.current[6] = el; }} tabIndex={-1}>
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
    <div className="space-y-6" ref={el => { stepRefs.current[7] = el; }} tabIndex={-1}>
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
      case 1: return renderAssessment();
      case 2: return renderPersonalInfo();
      case 3: return renderFileUploads();
      case 4: return renderWorkExperience();
      case 5: return renderEducation();
      case 6: return renderReferences();
      case 7: return renderSignature();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent opacity-70"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-indigo-200 to-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
              <Image
                src="/WIDE - Color on Transparent _RGB-01.png"
                alt="Alliance Chemical Logo"
                width={320}
                height={80}
                className="mx-auto mb-6 drop-shadow-sm"
              />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                Employment Application
              </h1>
              <p className="text-gray-600 text-lg font-medium">Join the Alliance Chemical team and grow your career with us</p>
              <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>Secure & Encrypted Application Process</span>
              </div>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="mb-10">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Application Progress</h2>
                <span className="text-sm text-gray-600">
                  Step {currentStep + 1} of {STEPS.length}
                </span>
              </div>
              
              <div className="relative">
                {/* Progress line */}
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                  ></div>
                </div>
                
                {/* Step indicators */}
                <div className="relative flex justify-between">
                  {STEPS.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isVisited = visitedSteps.has(index);
                    
                    return (
                      <div key={step.id} className="flex flex-col items-center group">
                        <button
                          onClick={() => goToStep(index)}
                          disabled={!isVisited && index !== currentStep}
                          className={`relative w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed ${
                            isCompleted
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                              : isCurrent
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg animate-pulse'
                              : isVisited
                              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {isCompleted ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="text-lg">{step.icon}</span>
                          )}
                          
                          {isCurrent && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full animate-bounce"></div>
                          )}
                        </button>
                        
                        <div className="mt-3 text-center max-w-20 sm:max-w-24">
                          <div className={`text-xs sm:text-sm font-medium transition-colors leading-tight ${
                            isCompleted || isCurrent ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {step.title}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 hidden sm:block">
                            {step.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Test Data Section - Always Available */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    🚀
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-800">Quick Fill Options</h3>
                    <p className="text-sm text-amber-700">Fill the form instantly with realistic test data for demos and testing</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => populateTestData('default')}
                    className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md"
                  >
                    📋 Fill Everything
                  </button>
                  <button
                    type="button"
                    onClick={() => populateTestData('entryLevel')}
                    className="px-4 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-md"
                  >
                    🌱 Entry Level
                  </button>
                  <button
                    type="button"
                    onClick={() => populateTestData('experienced')}
                    className="px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md"
                  >
                    🎆 Experienced
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      populateTestData('default');
                      setTimeout(() => setCurrentStep(STEPS.length - 1), 500);
                    }}
                    className="px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-md"
                  >
                    🚀 Skip to End
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Success/Error Messages */}
          {successMessage && (
            <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-lg animate-fade-in">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-green-800">Success!</h3>
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-lg animate-shake">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-red-800">Error</h3>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Form Container */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{STEPS[currentStep].title}</h2>
                  <p className="text-blue-100 mt-1">{STEPS[currentStep].description}</p>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm opacity-90">Step</div>
                  <div className="text-2xl font-bold text-white">{currentStep + 1}/{STEPS.length}</div>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Form Content */}
              <div className="p-8">
                <div className="transition-all duration-500 ease-in-out">
                  {renderStepContent()}
                </div>
              </div>

              {/* Enhanced Navigation */}
              <div className="bg-gray-50/80 px-8 py-6 border-t border-gray-200/50">
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="group px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Previous</span>
                  </button>


                  {currentStep < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="group px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                    >
                      <span>Continue</span>
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg flex items-center space-x-3"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Submitting Application...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Application</span>
                          <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add custom CSS for animations and responsiveness
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    
    .animate-fade-in {
      animation: fade-in 0.6s ease-out;
    }
    
    .animate-shake {
      animation: shake 0.5s ease-in-out;
    }
    
    .signature-canvas {
      border-radius: 12px;
      background: #fafafa;
    }
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
      .container {
        padding-left: 1rem;
        padding-right: 1rem;
      }
      
      .grid {
        grid-template-columns: 1fr;
      }
      
      .md\:grid-cols-2,
      .md\:grid-cols-3 {
        grid-template-columns: 1fr;
      }
      
      .text-4xl {
        font-size: 2.5rem;
      }
      
      .text-3xl {
        font-size: 2rem;
      }
    }
    
    /* Focus styles for better accessibility */
    input:focus,
    select:focus,
    textarea:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    /* Smooth transitions */
    * {
      transition-property: color, background-color, border-color, opacity, transform;
      transition-duration: 200ms;
      transition-timing-function: ease-in-out;
    }
  `;
  
  if (!document.head.querySelector('style[data-employee-form]')) {
    style.setAttribute('data-employee-form', 'true');
    document.head.appendChild(style);
  }
}