import { NextApiRequest, NextApiResponse } from 'next';
import { 
  scoreCustomerServiceApplication, 
  scoreWarehouseApplication,
  extractResumeSkills,
  generateInterviewQuestions,
  CustomerServiceAssessment,
  WarehouseAssessment,
  ApplicationScore 
} from '@/lib/ai-application-scorer-v2';

interface ScoringRequest {
  jobPostingId: number;
  assessment: CustomerServiceAssessment | WarehouseAssessment;
  resumeText?: string;
  options?: {
    stream?: boolean;
    generateQuestions?: boolean;
    extractSkills?: boolean;
  };
}

interface ScoringResponse {
  score: ApplicationScore;
  interviewQuestions?: string[];
  resumeSkills?: {
    tmsExperience: boolean;
    shopifyExperience: boolean;
    amazonExperience: boolean;
    warehouseExperience: boolean;
    chemicalExperience: boolean;
    customerServiceYears: number;
    relevantSkills: string[];
  };
  recommendation: {
    decision: 'hire' | 'interview' | 'reject';
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
  };
  timestamp: string;
  processingTime: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { jobPostingId, assessment, resumeText, options = {} }: ScoringRequest = req.body;

    if (!jobPostingId || !assessment) {
      return res.status(400).json({ 
        error: 'Missing required fields: jobPostingId and assessment are required' 
      });
    }

    // Validate job posting ID
    if (![1, 2].includes(jobPostingId)) {
      return res.status(400).json({ 
        error: 'Invalid job posting ID. Must be 1 (Customer Service) or 2 (Warehouse)' 
      });
    }

    let score: ApplicationScore;
    let jobRole: 'customer-service' | 'warehouse';

    // Score application based on role
    if (jobPostingId === 1) {
      jobRole = 'customer-service';
      score = await scoreCustomerServiceApplication(
        assessment as CustomerServiceAssessment,
        resumeText,
        { stream: options.stream }
      );
    } else {
      jobRole = 'warehouse';
      score = await scoreWarehouseApplication(
        assessment as WarehouseAssessment,
        resumeText,
        { stream: options.stream }
      );
    }

    // Prepare response
    const response: ScoringResponse = {
      score,
      recommendation: generateHiringRecommendation(score),
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime
    };

    // Generate interview questions if requested
    if (options.generateQuestions !== false) {
      try {
        response.interviewQuestions = await generateInterviewQuestions(
          jobRole,
          score,
          score.strengths,
          score.redFlags
        );
      } catch (error) {
        console.warn('Failed to generate interview questions:', error);
        // Continue without questions rather than failing the entire request
      }
    }

    // Extract resume skills if requested and resume provided
    if (options.extractSkills !== false && resumeText) {
      try {
        response.resumeSkills = await extractResumeSkills(resumeText);
      } catch (error) {
        console.warn('Failed to extract resume skills:', error);
        // Continue without skills extraction
      }
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Application scoring error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      requestBody: req.body
    });

    res.status(500).json({ 
      error: 'Failed to score application',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

function generateHiringRecommendation(score: ApplicationScore): {
  decision: 'hire' | 'interview' | 'reject';
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
} {
  const { overallScore, redFlags } = score;

  // Check for critical safety red flags
  const criticalRedFlags = redFlags.filter(flag => 
    flag.toLowerCase().includes('safety') || 
    flag.toLowerCase().includes('concerning') ||
    flag.toLowerCase().includes('judgment') ||
    flag.toLowerCase().includes('compliance')
  );

  if (criticalRedFlags.length > 0) {
    return {
      decision: 'reject',
      priority: 'low',
      reasoning: `Critical safety or compliance concerns identified: ${criticalRedFlags.join(', ')}`
    };
  }

  // Score-based recommendations
  if (overallScore >= 85) {
    return {
      decision: 'hire',
      priority: 'high',
      reasoning: `Exceptional candidate (${overallScore}/100) with strong technical skills and cultural fit. Minimal red flags: ${redFlags.length === 0 ? 'none' : redFlags.join(', ')}`
    };
  }

  if (overallScore >= 75) {
    return {
      decision: 'interview',
      priority: 'high',
      reasoning: `Strong candidate (${overallScore}/100) worth interviewing. Areas to validate: ${redFlags.length > 0 ? redFlags.join(', ') : 'general competency confirmation'}`
    };
  }

  if (overallScore >= 65) {
    return {
      decision: 'interview',
      priority: 'medium',
      reasoning: `Adequate candidate (${overallScore}/100) with some concerns. Interview focus: ${redFlags.length > 0 ? redFlags.join(', ') : 'skills and experience validation'}`
    };
  }

  if (overallScore >= 55) {
    return {
      decision: 'interview',
      priority: 'low',
      reasoning: `Borderline candidate (${overallScore}/100) requiring thorough evaluation. Significant concerns: ${redFlags.join(', ')}`
    };
  }

  return {
    decision: 'reject',
    priority: 'low',
    reasoning: `Below minimum requirements (${overallScore}/100). Key issues: ${redFlags.join(', ')}`
  };
}