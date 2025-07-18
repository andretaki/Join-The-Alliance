import { EmployeeApplicationForm } from './employee-validation';

export interface AgentAnalysis {
  agentName: string;
  score: number; // 1-10 scale
  strengths: string[];
  concerns: string[];
  analysis: string;
  recommendation: 'HIRE' | 'CONSIDER' | 'REJECT';
}

export interface MultiAgentAnalysisResult {
  success: boolean;
  overallScore: number;
  finalRecommendation: 'STRONG_HIRE' | 'HIRE' | 'CONSIDER' | 'WEAK_CANDIDATE' | 'REJECT';
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  agentAnalyses: AgentAnalysis[];
  executiveSummary: string;
  keyDecisionFactors: string[];
  riskAssessment: string;
  nextSteps: string[];
  error?: string;
}

/**
 * Multi-agent AI analysis system for sophisticated candidate evaluation
 */
export async function generateMultiAgentAnalysis(
  applicationData: EmployeeApplicationForm,
  applicationId: number
): Promise<MultiAgentAnalysisResult> {
  try {
    console.log(`🤖 Starting multi-agent analysis for application ${applicationId}`);

    // Prepare application data for analysis
    const applicationText = prepareApplicationForAnalysis(applicationData);

    // Run all agents in parallel for efficiency
    const [
      technicalAnalysis,
      culturalAnalysis,
      experienceAnalysis,
      riskAnalysis,
      industryFitAnalysis
    ] = await Promise.all([
      runTechnicalSkillsAgent(applicationText),
      runCulturalFitAgent(applicationText),
      runExperienceEvaluatorAgent(applicationText),
      runRiskAssessmentAgent(applicationText),
      runIndustryFitAgent(applicationText)
    ]);

    // Combine all agent analyses
    const agentAnalyses = [
      technicalAnalysis,
      culturalAnalysis,
      experienceAnalysis,
      riskAnalysis,
      industryFitAnalysis
    ].filter(analysis => analysis !== null) as AgentAnalysis[];

    if (agentAnalyses.length === 0) {
      console.log('🤖 All AI agents disabled/failed - returning fallback analysis');
      return {
        success: false,
        overallScore: 5,
        finalRecommendation: 'CONSIDER',
        confidenceLevel: 'LOW',
        agentAnalyses: [],
        executiveSummary: 'AI analysis is currently disabled. Manual review required.',
        keyDecisionFactors: ['Manual review required'],
        riskAssessment: 'No automated risk assessment available',
        nextSteps: ['Conduct manual review of application', 'Interview candidate if qualifications meet requirements'],
        error: 'AI analysis disabled'
      };
    }

    // Calculate overall metrics
    const overallScore = calculateOverallScore(agentAnalyses);
    const finalRecommendation = determineFinalRecommendation(agentAnalyses, overallScore);
    const confidenceLevel = calculateConfidenceLevel(agentAnalyses);

    // Generate executive summary and decision factors
    const executiveSummary = await generateExecutiveSummary(agentAnalyses, applicationData);
    const keyDecisionFactors = extractKeyDecisionFactors(agentAnalyses);
    const riskAssessment = synthesizeRiskAssessment(agentAnalyses);
    const nextSteps = generateNextSteps(finalRecommendation, agentAnalyses);

    console.log(`✅ Multi-agent analysis completed for application ${applicationId}`);

    return {
      success: true,
      overallScore,
      finalRecommendation,
      confidenceLevel,
      agentAnalyses,
      executiveSummary,
      keyDecisionFactors,
      riskAssessment,
      nextSteps
    };

  } catch (error) {
    console.error('Error in multi-agent analysis:', error);
    return {
      success: false,
      overallScore: 0,
      finalRecommendation: 'REJECT',
      confidenceLevel: 'LOW',
      agentAnalyses: [],
      executiveSummary: 'Analysis failed due to technical error',
      keyDecisionFactors: [],
      riskAssessment: 'Unable to assess risk due to analysis failure',
      nextSteps: ['Retry analysis or conduct manual review'],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Technical Skills Agent - Evaluates technical competencies
 */
async function runTechnicalSkillsAgent(applicationText: string): Promise<AgentAnalysis | null> {
  try {
    const prompt = `
You are a Technical Skills Assessment Specialist for a Customer Service role at a chemical company. Evaluate this candidate's technical competencies.

FOCUS AREAS:
- Software proficiency (TMS, Shopify, Amazon, Excel, Canva)
- Learning ability and adaptability
- Technical problem-solving approach
- Digital literacy and tool adoption
- Process optimization mindset

APPLICATION DATA:
${applicationText}

Provide analysis in this exact JSON format:
{
  "score": [1-10 number],
  "strengths": ["strength1", "strength2", "strength3"],
  "concerns": ["concern1", "concern2"],
  "analysis": "Detailed technical assessment (2-3 sentences)",
  "recommendation": "HIRE|CONSIDER|REJECT"
}

Be critical but fair. Score 7-10 for strong technical candidates, 4-6 for adequate, 1-3 for weak.
    `;

    const response = await callAIAgent(prompt, 'Technical Skills Specialist');
    if (!response) return null;

    return {
      agentName: 'Technical Skills Agent',
      ...response
    };
  } catch (error) {
    console.error('Technical Skills Agent failed:', error);
    return null;
  }
}

/**
 * Cultural Fit Agent - Evaluates alignment with company culture
 */
async function runCulturalFitAgent(applicationText: string): Promise<AgentAnalysis | null> {
  try {
    const prompt = `
You are a Cultural Fit Assessment Specialist for Alliance Chemical. Evaluate how well this candidate aligns with our company culture.

ALLIANCE CHEMICAL CULTURE:
- Customer-first mentality
- Safety and compliance focus
- Continuous learning mindset
- Team collaboration
- Problem-solving orientation
- Professional communication
- Attention to detail
- Adaptability to B2B environment

APPLICATION DATA:
${applicationText}

Provide analysis in this exact JSON format:
{
  "score": [1-10 number],
  "strengths": ["strength1", "strength2", "strength3"],
  "concerns": ["concern1", "concern2"],
  "analysis": "Cultural fit assessment (2-3 sentences)",
  "recommendation": "HIRE|CONSIDER|REJECT"
}

Score based on cultural alignment and soft skills demonstrated.
    `;

    const response = await callAIAgent(prompt, 'Cultural Fit Specialist');
    if (!response) return null;

    return {
      agentName: 'Cultural Fit Agent',
      ...response
    };
  } catch (error) {
    console.error('Cultural Fit Agent failed:', error);
    return null;
  }
}

/**
 * Experience Evaluator Agent - Assesses relevant experience and career trajectory
 */
async function runExperienceEvaluatorAgent(applicationText: string): Promise<AgentAnalysis | null> {
  try {
    const prompt = `
You are an Experience Evaluation Specialist. Assess this candidate's professional background and career trajectory for a Customer Service Specialist role.

EVALUATION CRITERIA:
- Relevant customer service experience
- Industry experience (B2B, chemicals, or related)
- Career progression and growth
- Job stability and commitment
- Transferable skills
- Educational background relevance

APPLICATION DATA:
${applicationText}

Provide analysis in this exact JSON format:
{
  "score": [1-10 number],
  "strengths": ["strength1", "strength2", "strength3"],
  "concerns": ["concern1", "concern2"],
  "analysis": "Experience assessment (2-3 sentences)",
  "recommendation": "HIRE|CONSIDER|REJECT"
}

Consider experience quality over quantity. Look for growth patterns and relevance.
    `;

    const response = await callAIAgent(prompt, 'Experience Evaluator');
    if (!response) return null;

    return {
      agentName: 'Experience Evaluator Agent',
      ...response
    };
  } catch (error) {
    console.error('Experience Evaluator Agent failed:', error);
    return null;
  }
}

/**
 * Risk Assessment Agent - Identifies potential hiring risks
 */
async function runRiskAssessmentAgent(applicationText: string): Promise<AgentAnalysis | null> {
  try {
    const prompt = `
You are a Hiring Risk Assessment Specialist. Identify potential risks and red flags in this candidate application.

RISK FACTORS TO EVALUATE:
- Job hopping patterns
- Gaps in employment
- Overqualification/underqualification
- Inconsistencies in application
- Potential compliance issues
- Skills misalignment
- Salary expectations vs. role level
- Geographic/logistics concerns

APPLICATION DATA:
${applicationText}

Provide analysis in this exact JSON format:
{
  "score": [1-10 number, where 10 = lowest risk, 1 = highest risk],
  "strengths": ["positive indicators", "risk mitigation factors"],
  "concerns": ["risk factor1", "risk factor2"],
  "analysis": "Risk assessment summary (2-3 sentences)",
  "recommendation": "HIRE|CONSIDER|REJECT"
}

Be thorough in identifying potential issues that could affect job performance or retention.
    `;

    const response = await callAIAgent(prompt, 'Risk Assessment Specialist');
    if (!response) return null;

    return {
      agentName: 'Risk Assessment Agent',
      ...response
    };
  } catch (error) {
    console.error('Risk Assessment Agent failed:', error);
    return null;
  }
}

/**
 * Industry Fit Agent - Evaluates fit for chemical industry B2B environment
 */
async function runIndustryFitAgent(applicationText: string): Promise<AgentAnalysis | null> {
  try {
    const prompt = `
You are a Chemical Industry Specialist. Evaluate this candidate's fit for the chemical industry B2B customer service environment.

INDUSTRY-SPECIFIC CONSIDERATIONS:
- Hazmat/chemical handling awareness
- Regulatory compliance mindset
- B2B relationship management
- Technical product knowledge potential
- Safety consciousness
- Complex order management capability
- Industrial customer expectations
- Logistics and freight understanding

APPLICATION DATA:
${applicationText}

Provide analysis in this exact JSON format:
{
  "score": [1-10 number],
  "strengths": ["industry-relevant strength1", "strength2"],
  "concerns": ["industry concern1", "concern2"],
  "analysis": "Industry fit assessment (2-3 sentences)",
  "recommendation": "HIRE|CONSIDER|REJECT"
}

Focus on chemical industry-specific requirements and B2B customer service nuances.
    `;

    const response = await callAIAgent(prompt, 'Industry Fit Specialist');
    if (!response) return null;

    return {
      agentName: 'Industry Fit Agent',
      ...response
    };
  } catch (error) {
    console.error('Industry Fit Agent failed:', error);
    return null;
  }
}

/**
 * Call AI agent with specialized prompt
 */
async function callAIAgent(prompt: string, agentType: string): Promise<any> {
  try {
    
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are an expert ${agentType}. Always respond with valid JSON only. No additional text or formatting.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Lower temperature for more consistent analysis
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`AI API call failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.response || !data.response.trim()) {
      throw new Error('Empty response from AI');
    }

    // Parse JSON response
    const parsedResponse = JSON.parse(data.response.trim());
    
    // Validate required fields
    if (!parsedResponse.score || !parsedResponse.analysis || !parsedResponse.recommendation) {
      throw new Error('Invalid response format from AI agent');
    }

    return parsedResponse;

  } catch (error) {
    console.error(`Error calling ${agentType}:`, error);
    return null;
  }
}

/**
 * Calculate overall score from all agent scores
 */
function calculateOverallScore(analyses: AgentAnalysis[]): number {
  if (analyses.length === 0) return 0;
  
  const totalScore = analyses.reduce((sum, analysis) => sum + analysis.score, 0);
  return Math.round((totalScore / analyses.length) * 10) / 10;
}

/**
 * Determine final recommendation based on agent inputs
 */
function determineFinalRecommendation(
  analyses: AgentAnalysis[], 
  overallScore: number
): 'STRONG_HIRE' | 'HIRE' | 'CONSIDER' | 'WEAK_CANDIDATE' | 'REJECT' {
  const hireVotes = analyses.filter(a => a.recommendation === 'HIRE').length;
  const considerVotes = analyses.filter(a => a.recommendation === 'CONSIDER').length;
  const rejectVotes = analyses.filter(a => a.recommendation === 'REJECT').length;
  
  const totalVotes = analyses.length;
  
  // Strong hire: High score + majority hire votes
  if (overallScore >= 8 && hireVotes >= totalVotes * 0.6) {
    return 'STRONG_HIRE';
  }
  
  // Hire: Good score + more hire than reject votes
  if (overallScore >= 7 && hireVotes > rejectVotes) {
    return 'HIRE';
  }
  
  // Consider: Mixed signals or moderate scores
  if (overallScore >= 5 && considerVotes > 0) {
    return 'CONSIDER';
  }
  
  // Weak candidate: Low score but not complete reject
  if (overallScore >= 4 && rejectVotes < totalVotes * 0.6) {
    return 'WEAK_CANDIDATE';
  }
  
  // Reject: Low score or majority reject votes
  return 'REJECT';
}

/**
 * Calculate confidence level based on agent agreement
 */
function calculateConfidenceLevel(analyses: AgentAnalysis[]): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (analyses.length < 3) return 'LOW';
  
  const scores = analyses.map(a => a.score);
  const avgScore = scores.reduce((a, b) => a + b) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);
  
  // High confidence: Low variance in scores
  if (standardDeviation <= 1.5) return 'HIGH';
  if (standardDeviation <= 2.5) return 'MEDIUM';
  return 'LOW';
}

/**
 * Generate executive summary from all agent analyses
 */
async function generateExecutiveSummary(
  analyses: AgentAnalysis[], 
  applicationData: EmployeeApplicationForm
): Promise<string> {
  try {
    const candidateName = `${applicationData.personalInfo.firstName} ${applicationData.personalInfo.lastName}`;
    const agentSummaries = analyses.map(a => `${a.agentName}: ${a.analysis}`).join('\n');
    
    const prompt = `
Generate a concise executive summary for hiring decision based on these agent analyses:

CANDIDATE: ${candidateName}
POSITION: Customer Service Specialist

AGENT ANALYSES:
${agentSummaries}

Write a professional 2-3 sentence executive summary that captures the key hiring recommendation and main reasons. Focus on business impact and fit.
    `;

    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an executive hiring consultant. Provide clear, concise summaries for business leaders.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.response?.trim() || 'Executive summary unavailable';
    }
    
    return 'Executive summary generation failed';
  } catch (error) {
    return 'Executive summary unavailable due to technical error';
  }
}

/**
 * Extract key decision factors from agent analyses
 */
function extractKeyDecisionFactors(analyses: AgentAnalysis[]): string[] {
  const factors: string[] = [];
  
  analyses.forEach(analysis => {
    // Add top strengths as positive factors
    if (analysis.strengths.length > 0) {
      factors.push(`✓ ${analysis.strengths[0]} (${analysis.agentName})`);
    }
    
    // Add main concerns as negative factors
    if (analysis.concerns.length > 0) {
      factors.push(`⚠ ${analysis.concerns[0]} (${analysis.agentName})`);
    }
  });
  
  return factors.slice(0, 6); // Limit to top 6 factors
}

/**
 * Synthesize risk assessment from all agents
 */
function synthesizeRiskAssessment(analyses: AgentAnalysis[]): string {
  const riskAgent = analyses.find(a => a.agentName === 'Risk Assessment Agent');
  if (riskAgent) {
    return riskAgent.analysis;
  }
  
  const allConcerns = analyses.flatMap(a => a.concerns);
  if (allConcerns.length === 0) {
    return 'Low risk candidate with no significant red flags identified.';
  }
  
  return `Moderate risk: Key concerns include ${allConcerns.slice(0, 2).join(' and ')}.`;
}

/**
 * Generate next steps based on recommendation
 */
function generateNextSteps(
  recommendation: string, 
  analyses: AgentAnalysis[]
): string[] {
  const steps: string[] = [];
  
  switch (recommendation) {
    case 'STRONG_HIRE':
      steps.push('Schedule immediate phone interview');
      steps.push('Prepare competitive offer package');
      steps.push('Check references proactively');
      break;
      
    case 'HIRE':
      steps.push('Schedule standard interview process');
      steps.push('Verify key technical skills mentioned');
      steps.push('Conduct reference checks');
      break;
      
    case 'CONSIDER':
      steps.push('Schedule extended interview to address concerns');
      steps.push('Consider skills assessment or trial period');
      steps.push('Compare against other candidates');
      break;
      
    case 'WEAK_CANDIDATE':
      steps.push('Consider only if no better candidates available');
      steps.push('Structure interview around specific concerns');
      steps.push('Plan additional training if hired');
      break;
      
    case 'REJECT':
      steps.push('Send polite rejection letter');
      steps.push('Keep application on file for future openings');
      steps.push('Focus on stronger candidates');
      break;
  }
  
  return steps;
}

/**
 * Prepare application data for AI analysis
 */
function prepareApplicationForAnalysis(applicationData: EmployeeApplicationForm): string {
  const sections: string[] = [];

  // Personal Information (relevant for analysis)
  sections.push('CANDIDATE PROFILE:');
  sections.push(`Name: ${applicationData.personalInfo.firstName} ${applicationData.personalInfo.lastName}`);
  sections.push(`Location: ${applicationData.personalInfo.city}, ${applicationData.personalInfo.state}`);
  sections.push(`Available: ${applicationData.personalInfo.availableStartDate}`);
  sections.push(`Hours: ${applicationData.personalInfo.hoursAvailable}`);
  sections.push(`Transportation: ${applicationData.personalInfo.hasTransportation ? 'Yes' : 'No'}`);

  // Work Experience
  if (applicationData.workExperience && applicationData.workExperience.length > 0) {
    sections.push('\nWORK EXPERIENCE:');
    applicationData.workExperience.forEach((work, index) => {
      sections.push(`${index + 1}. ${work.jobTitle} at ${work.companyName}`);
      sections.push(`   Duration: ${work.startDate} - ${work.isCurrent ? 'Present' : work.endDate}`);
      sections.push(`   Responsibilities: ${work.responsibilities}`);
      sections.push(`   Reason for Leaving: ${work.reasonForLeaving}`);
    });
  }

  // Education
  if (applicationData.education && applicationData.education.length > 0) {
    sections.push('\nEDUCATION:');
    applicationData.education.forEach((edu, index) => {
      sections.push(`${index + 1}. ${edu.degreeType} in ${edu.fieldOfStudy}`);
      sections.push(`   Institution: ${edu.institutionName}`);
      sections.push(`   Graduation: ${edu.graduationDate}`);
      sections.push(`   GPA: ${edu.gpa || 'Not provided'}`);
    });
  }

  // Role Assessment (Key for analysis)
  if (applicationData.roleAssessment) {
    sections.push('\nTECHNICAL SKILLS & ASSESSMENT:');
    sections.push(`TMS MyCarrier: ${applicationData.roleAssessment.tmsMyCarrierExperience || 'Not provided'}`);
    sections.push(`Shopify: ${applicationData.roleAssessment.shopifyExperience || 'Not provided'}`);
    sections.push(`Amazon Seller Central: ${applicationData.roleAssessment.amazonSellerCentralExperience || 'Not provided'}`);
    sections.push(`Excel: ${applicationData.roleAssessment.excelProficiency || 'Not provided'}`);
    sections.push(`Canva: ${applicationData.roleAssessment.canvaExperience || 'Not provided'}`);
    
    sections.push('\nSCENARIO RESPONSES:');
    if (applicationData.roleAssessment.learningUnderPressure) {
      sections.push(`Learning Under Pressure: ${applicationData.roleAssessment.learningUnderPressure}`);
    }
    if (applicationData.roleAssessment.conflictingInformation) {
      sections.push(`Handling Conflicts: ${applicationData.roleAssessment.conflictingInformation}`);
    }
    if (applicationData.roleAssessment.workMotivation) {
      sections.push(`Work Motivation: ${applicationData.roleAssessment.workMotivation}`);
    }
    if (applicationData.roleAssessment.delayedShipmentScenario) {
      sections.push(`Delayed Shipment Response: ${applicationData.roleAssessment.delayedShipmentScenario}`);
    }
    if (applicationData.roleAssessment.hazmatFreightScenario) {
      sections.push(`Hazmat Freight Response: ${applicationData.roleAssessment.hazmatFreightScenario}`);
    }
  }

  // Eligibility and Industry Fit
  sections.push('\nELIGIBILITY & COMPLIANCE:');
  sections.push(`Work Eligible: ${applicationData.eligibility.eligibleToWork ? 'Yes' : 'No'}`);
  sections.push(`Hazmat Experience: ${applicationData.eligibility.hasHazmatExperience ? 'Yes' : 'No'}`);
  sections.push(`Chemical Handling: ${applicationData.eligibility.hasChemicalHandlingExperience ? 'Yes' : 'No'}`);
  sections.push(`Willing to Obtain Certifications: ${applicationData.eligibility.willingToObtainCertifications ? 'Yes' : 'No'}`);

  return sections.join('\n');
} 