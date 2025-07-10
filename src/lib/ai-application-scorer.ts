import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ApplicationScore {
  overallScore: number; // 0-100
  technicalScore: number;
  experienceScore: number;
  communicationScore: number;
  culturalFitScore: number;
  redFlags: string[];
  strengths: string[];
  recommendations: string[];
  nextSteps: string[];
}

export interface CustomerServiceAssessment {
  tmsExperience: string;
  shopifyExperience: string;
  amazonExperience: string;
  scenarioResponses: {
    delayedShipment: string;
    restrictedChemical: string;
    hazmatExplanation: string;
  };
  personalAssessment: {
    learningApproach: string;
    motivations: string[];
    stressManagement: string;
    automation: string;
  };
  advancedAssessment: {
    loyaltyFactor: string;
    dataUsage: string;
    workEnvironment: string;
  };
}

export interface WarehouseAssessment {
  physicalCapabilities: {
    liftingAbility: string;
    chemicalEnvironment: string;
  };
  safetyKnowledge: {
    protocols: string;
    damagedContainer: string;
  };
  workStyle: {
    motivation: string;
    focus: string;
  };
}

export async function scoreCustomerServiceApplication(
  assessment: CustomerServiceAssessment,
  resumeText?: string
): Promise<ApplicationScore> {
  const prompt = `
You are an expert HR analyst with 15+ years of experience in chemical distribution and logistics. Your task is to comprehensively evaluate this Customer Service Specialist candidate for Alliance Chemical.

CRITICAL ROLE CONTEXT:
Alliance Chemical is a hazardous materials distributor requiring strict compliance, safety awareness, and technical competency. Customer service representatives handle complex B2B relationships, regulatory inquiries, and time-sensitive logistics coordination.

ROLE REQUIREMENTS & WEIGHT:
1. Platform Expertise (25%): TMS MyCarrier, Shopify, Amazon Seller Central
2. Regulatory Knowledge (20%): Hazmat understanding, compliance awareness
3. Problem-Solving (20%): Complex logistics scenarios, crisis management
4. Communication (15%): Professional clarity, technical explanation ability
5. Customer Focus (10%): B2B relationship building, service orientation
6. Cultural Fit (10%): Work ethic, learning agility, stress management

CANDIDATE DATA:
Platform Experience:
- TMS MyCarrier: ${assessment.tmsExperience}
- Shopify: ${assessment.shopifyExperience}
- Amazon: ${assessment.amazonExperience}

Scenario Responses (analyze depth, accuracy, safety awareness):
1. Delayed Chemical Shipment Crisis: ${assessment.scenarioResponses.delayedShipment}
2. Restricted Chemical Compliance: ${assessment.scenarioResponses.restrictedChemical}
3. Hazmat Fee Explanation: ${assessment.scenarioResponses.hazmatExplanation}

Personal Assessment:
- Learning Complex Systems: ${assessment.personalAssessment.learningApproach}
- Core Motivations: ${assessment.personalAssessment.motivations.join(', ')}
- Stress Management: ${assessment.personalAssessment.stressManagement}
- Process Innovation: ${assessment.personalAssessment.automation}

Advanced Assessment:
- B2B Loyalty Factor: ${assessment.advancedAssessment.loyaltyFactor}
- Data Utilization: ${assessment.advancedAssessment.dataUsage}
- Work Environment: ${assessment.advancedAssessment.workEnvironment}

${resumeText ? `Resume Analysis: ${resumeText}` : ''}

EVALUATION FRAMEWORK:
For each scoring dimension, use this scale:
- 90-100: Exceptional - Exceeds all requirements with clear expertise
- 80-89: Strong - Meets requirements with solid capabilities
- 70-79: Adequate - Meets basic requirements with some gaps
- 60-69: Borderline - Marginal fit with concerning gaps
- Below 60: Insufficient - Does not meet minimum standards

SAFETY-CRITICAL ANALYSIS:
Specifically evaluate for these red flags:
- Lack of safety awareness in chemical handling scenarios
- Poor judgment in compliance situations
- Inability to explain technical concepts clearly
- Concerning stress responses that could impact safety decisions

Return your analysis in this exact JSON format:
{
  "overallScore": 85,
  "technicalScore": 80,
  "experienceScore": 90,
  "communicationScore": 85,
  "culturalFitScore": 88,
  "redFlags": ["specific concerning responses or gaps"],
  "strengths": ["specific evidence of capabilities"],
  "recommendations": ["specific hiring actions with reasoning"],
  "nextSteps": ["targeted interview focus areas"],
  "reasoning": "2-3 sentence summary of key evaluation factors"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'o3',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    return JSON.parse(content) as ApplicationScore;
  } catch (error) {
    console.error('AI scoring error:', error);
    // Fallback scoring
    return {
      overallScore: 50,
      technicalScore: 50,
      experienceScore: 50,
      communicationScore: 50,
      culturalFitScore: 50,
      redFlags: ['AI evaluation failed'],
      strengths: ['Manual review required'],
      recommendations: ['Conduct manual evaluation'],
      nextSteps: ['Schedule phone screening']
    };
  }
}

export async function scoreWarehouseApplication(
  assessment: WarehouseAssessment,
  resumeText?: string
): Promise<ApplicationScore> {
  const prompt = `
As an expert HR analyst for a chemical distribution company, evaluate this Warehouse Associate application.

ROLE REQUIREMENTS:
- Physical capability (50+ lbs lifting)
- Chemical safety knowledge
- Forklift operation (preferred)
- Attention to detail and safety protocols
- Reliability and work ethic

CANDIDATE ASSESSMENT:
Physical Capabilities:
- Lifting Ability: ${assessment.physicalCapabilities.liftingAbility}
- Chemical Environment: ${assessment.physicalCapabilities.chemicalEnvironment}

Safety Knowledge:
- Safety Protocols: ${assessment.safetyKnowledge.protocols}
- Damaged Container Handling: ${assessment.safetyKnowledge.damagedContainer}

Work Style:
- Motivation: ${assessment.workStyle.motivation}
- Focus Strategies: ${assessment.workStyle.focus}

${resumeText ? `Resume Summary: ${resumeText}` : ''}

SCORING CRITERIA:
- Technical Score (0-100): Safety knowledge, equipment experience
- Experience Score (0-100): Warehouse/chemical/industrial background
- Communication Score (0-100): Response quality and safety awareness
- Cultural Fit Score (0-100): Work ethic, reliability indicators

Provide evaluation in JSON format:
{
  "overallScore": 75,
  "technicalScore": 70,
  "experienceScore": 80,
  "communicationScore": 75,
  "culturalFitScore": 78,
  "redFlags": ["safety concerns if any"],
  "strengths": ["positive indicators"],
  "recommendations": ["hiring recommendations"],
  "nextSteps": ["interview focus areas"]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'o3',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    return JSON.parse(content) as ApplicationScore;
  } catch (error) {
    console.error('AI scoring error:', error);
    return {
      overallScore: 50,
      technicalScore: 50,
      experienceScore: 50,
      communicationScore: 50,
      culturalFitScore: 50,
      redFlags: ['AI evaluation failed'],
      strengths: ['Manual review required'],
      recommendations: ['Conduct manual evaluation'],
      nextSteps: ['Schedule phone screening']
    };
  }
}

export async function extractResumeSkills(resumeText: string): Promise<{
  tmsExperience: boolean;
  shopifyExperience: boolean;
  amazonExperience: boolean;
  warehouseExperience: boolean;
  chemicalExperience: boolean;
  customerServiceYears: number;
  relevantSkills: string[];
}> {
  const prompt = `
Analyze this resume for skills relevant to a chemical distribution company:

${resumeText}

Extract and return in JSON format:
{
  "tmsExperience": false,
  "shopifyExperience": true,
  "amazonExperience": false,
  "warehouseExperience": true,
  "chemicalExperience": false,
  "customerServiceYears": 3,
  "relevantSkills": ["Customer Service", "Logistics", "Data Entry"]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'o3',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    return JSON.parse(content);
  } catch (error) {
    console.error('Resume analysis error:', error);
    return {
      tmsExperience: false,
      shopifyExperience: false,
      amazonExperience: false,
      warehouseExperience: false,
      chemicalExperience: false,
      customerServiceYears: 0,
      relevantSkills: []
    };
  }
}

export async function generateInterviewQuestions(
  jobRole: 'customer-service' | 'warehouse',
  applicationScore: ApplicationScore,
  candidateStrengths: string[],
  candidateWeaknesses: string[]
): Promise<string[]> {
  const prompt = `
Generate 5-7 targeted interview questions for a ${jobRole} candidate at a chemical distribution company.

Candidate Profile:
- Overall Score: ${applicationScore.overallScore}
- Strengths: ${candidateStrengths.join(', ')}
- Areas to Probe: ${candidateWeaknesses.join(', ')}

Focus on:
1. Validating strengths
2. Addressing weak areas
3. Cultural fit assessment
4. Role-specific scenarios

Return as JSON array: ["Question 1", "Question 2", ...]
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'o3',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    return JSON.parse(content);
  } catch (error) {
    console.error('Question generation error:', error);
    return [
      'Tell me about your relevant experience for this role',
      'How do you handle challenging situations?',
      'What interests you about working in chemical distribution?'
    ];
  }
}