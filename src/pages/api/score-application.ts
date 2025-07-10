import { NextApiRequest, NextApiResponse } from 'next';
import { 
  scoreCustomerServiceApplication, 
  scoreWarehouseApplication,
  extractResumeSkills,
  generateInterviewQuestions,
  CustomerServiceAssessment,
  WarehouseAssessment 
} from '@/lib/ai-application-scorer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobPostingId, assessment, resumeText } = req.body;

    let score;
    let interviewQuestions;

    if (jobPostingId === 1) {
      // Customer Service Specialist
      score = await scoreCustomerServiceApplication(
        assessment as CustomerServiceAssessment,
        resumeText
      );
      
      interviewQuestions = await generateInterviewQuestions(
        'customer-service',
        score,
        score.strengths,
        score.redFlags
      );
    } else if (jobPostingId === 2) {
      // Warehouse Associate
      score = await scoreWarehouseApplication(
        assessment as WarehouseAssessment,
        resumeText
      );
      
      interviewQuestions = await generateInterviewQuestions(
        'warehouse',
        score,
        score.strengths,
        score.redFlags
      );
    } else {
      return res.status(400).json({ error: 'Invalid job posting ID' });
    }

    // Extract resume skills if provided
    let resumeSkills;
    if (resumeText) {
      resumeSkills = await extractResumeSkills(resumeText);
    }

    // Generate hiring recommendation
    const recommendation = generateHiringRecommendation(score);

    res.status(200).json({
      score,
      interviewQuestions,
      resumeSkills,
      recommendation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Application scoring error:', error);
    res.status(500).json({ 
      error: 'Failed to score application',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function generateHiringRecommendation(score: any): {
  decision: 'hire' | 'interview' | 'reject';
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
} {
  const { overallScore, redFlags } = score;

  if (redFlags.length > 0 && redFlags.some((flag: string) => 
    flag.toLowerCase().includes('safety') || 
    flag.toLowerCase().includes('concerning')
  )) {
    return {
      decision: 'reject',
      priority: 'low',
      reasoning: 'Critical red flags identified that pose safety or compliance risks.'
    };
  }

  if (overallScore >= 85) {
    return {
      decision: 'hire',
      priority: 'high',
      reasoning: 'Exceptional candidate with strong technical skills and cultural fit.'
    };
  }

  if (overallScore >= 70) {
    return {
      decision: 'interview',
      priority: 'high',
      reasoning: 'Strong candidate worth interviewing to validate assessment results.'
    };
  }

  if (overallScore >= 55) {
    return {
      decision: 'interview',
      priority: 'medium',
      reasoning: 'Potential candidate with some concerns to address in interview.'
    };
  }

  return {
    decision: 'reject',
    priority: 'low',
    reasoning: 'Candidate does not meet minimum requirements for the role.'
  };
}