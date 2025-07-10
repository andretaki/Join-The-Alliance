import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Zod schema for validation
export const ApplicationScoreSchema = z.object({
  overallScore: z.number().min(0).max(100),
  technicalScore: z.number().min(0).max(100),
  experienceScore: z.number().min(0).max(100),
  communicationScore: z.number().min(0).max(100),
  culturalFitScore: z.number().min(0).max(100),
  redFlags: z.array(z.string()),
  strengths: z.array(z.string()),
  recommendations: z.array(z.string()),
  nextSteps: z.array(z.string()),
  reasoning: z.string(),
});

export type ApplicationScore = z.infer<typeof ApplicationScoreSchema>;

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

// Common prompt fragments
const EVALUATION_FRAMEWORK = `
EVALUATION SCALE:
- 90-100: Exceptional - Exceeds all requirements with clear expertise
- 80-89: Strong - Meets requirements with solid capabilities  
- 70-79: Adequate - Meets basic requirements with some gaps
- 60-69: Borderline - Marginal fit with concerning gaps
- Below 60: Insufficient - Does not meet minimum standards
`;

const SAFETY_RED_FLAGS = `
CRITICAL RED FLAGS TO IDENTIFY:
- Lack of safety awareness in chemical handling scenarios
- Poor judgment in compliance or regulatory situations
- Inability to explain technical concepts clearly
- Concerning stress responses that could impact safety decisions
- Dismissive attitude toward safety protocols
- Overconfidence without demonstrated experience
`;

// OpenAI function schema for structured output
const SCORE_FUNCTION_SCHEMA = {
  name: "submitApplicationScore",
  description: "Submit the final application evaluation score",
  parameters: {
    type: "object",
    properties: {
      overallScore: {
        type: "number",
        description: "Overall candidate score 0-100",
        minimum: 0,
        maximum: 100
      },
      technicalScore: {
        type: "number", 
        description: "Technical skills score 0-100",
        minimum: 0,
        maximum: 100
      },
      experienceScore: {
        type: "number",
        description: "Relevant experience score 0-100", 
        minimum: 0,
        maximum: 100
      },
      communicationScore: {
        type: "number",
        description: "Communication skills score 0-100",
        minimum: 0,
        maximum: 100
      },
      culturalFitScore: {
        type: "number",
        description: "Cultural fit and values alignment score 0-100",
        minimum: 0,
        maximum: 100
      },
      redFlags: {
        type: "array",
        items: { type: "string" },
        description: "Specific concerning responses or safety issues"
      },
      strengths: {
        type: "array", 
        items: { type: "string" },
        description: "Specific evidence of candidate capabilities"
      },
      recommendations: {
        type: "array",
        items: { type: "string" },
        description: "Specific hiring actions with reasoning"
      },
      nextSteps: {
        type: "array",
        items: { type: "string" },
        description: "Targeted interview focus areas"
      },
      reasoning: {
        type: "string",
        description: "2-3 sentence summary of key evaluation factors"
      }
    },
    required: ["overallScore", "technicalScore", "experienceScore", "communicationScore", "culturalFitScore", "redFlags", "strengths", "recommendations", "nextSteps", "reasoning"]
  }
};

// Enhanced error logging
function logScoringError(context: string, candidateType: string, error: unknown) {
  const errorDetails = {
    context,
    candidateType,
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error
  };
  
  console.error('AI Scoring Error:', JSON.stringify(errorDetails, null, 2));
}

// Fallback score generator
function generateFallbackScore(reason: string): ApplicationScore {
  return {
    overallScore: 50,
    technicalScore: 50,
    experienceScore: 50,
    communicationScore: 50,
    culturalFitScore: 50,
    redFlags: [`AI evaluation failed: ${reason}`],
    strengths: ['Manual review required'],
    recommendations: ['Conduct manual evaluation'],
    nextSteps: ['Schedule phone screening'],
    reasoning: `AI system failure - manual review required. Reason: ${reason}`
  };
}

export async function scoreCustomerServiceApplication(
  assessment: CustomerServiceAssessment,
  resumeText?: string,
  options: { stream?: boolean } = {}
): Promise<ApplicationScore> {
  
  const systemMessage = `You are an expert HR analyst with 15+ years of experience in chemical distribution and logistics. You specialize in evaluating Customer Service Specialist candidates for Alliance Chemical, a hazardous materials distributor requiring strict compliance, safety awareness, and technical competency.

Customer service representatives handle complex B2B relationships, regulatory inquiries, and time-sensitive logistics coordination.

${EVALUATION_FRAMEWORK}
${SAFETY_RED_FLAGS}

Evaluate candidates using weighted criteria:
1. Platform Expertise (25%): TMS MyCarrier, Shopify, Amazon Seller Central
2. Regulatory Knowledge (20%): Hazmat understanding, compliance awareness  
3. Problem-Solving (20%): Complex logistics scenarios, crisis management
4. Communication (15%): Professional clarity, technical explanation ability
5. Customer Focus (10%): B2B relationship building, service orientation
6. Cultural Fit (10%): Work ethic, learning agility, stress management`;

  const userMessage = `Evaluate this Customer Service Specialist candidate:

PLATFORM EXPERIENCE:
- TMS MyCarrier: ${assessment.tmsExperience}
- Shopify: ${assessment.shopifyExperience}  
- Amazon: ${assessment.amazonExperience}

SCENARIO RESPONSES (analyze depth, accuracy, safety awareness):
1. Delayed Chemical Shipment Crisis: ${assessment.scenarioResponses.delayedShipment}
2. Restricted Chemical Compliance: ${assessment.scenarioResponses.restrictedChemical}
3. Hazmat Fee Explanation: ${assessment.scenarioResponses.hazmatExplanation}

PERSONAL ASSESSMENT:
- Learning Complex Systems: ${assessment.personalAssessment.learningApproach}
- Core Motivations: ${assessment.personalAssessment.motivations.join(', ')}
- Stress Management: ${assessment.personalAssessment.stressManagement}
- Process Innovation: ${assessment.personalAssessment.automation}

ADVANCED ASSESSMENT:
- B2B Loyalty Factor: ${assessment.advancedAssessment.loyaltyFactor}
- Data Utilization: ${assessment.advancedAssessment.dataUsage}
- Work Environment: ${assessment.advancedAssessment.workEnvironment}

${resumeText ? `RESUME ANALYSIS: ${resumeText}` : ''}

Provide comprehensive evaluation focusing on safety-critical thinking and technical competency.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'o3',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      functions: [SCORE_FUNCTION_SCHEMA],
      function_call: { name: "submitApplicationScore" },
      temperature: 0.1,
      stream: options.stream || false,
    });

    const functionCall = response.choices[0]?.message?.function_call;
    if (!functionCall?.arguments) {
      throw new Error('No function call arguments returned');
    }

    const rawScore = JSON.parse(functionCall.arguments);
    
    // Validate with Zod schema
    const validatedScore = ApplicationScoreSchema.parse(rawScore);
    
    return validatedScore;
    
  } catch (error) {
    logScoringError('scoreCustomerServiceApplication', 'Customer Service', error);
    
    if (error instanceof z.ZodError) {
      return generateFallbackScore(`Schema validation failed: ${error.message}`);
    }
    
    if (error instanceof SyntaxError) {
      return generateFallbackScore(`JSON parsing failed: ${error.message}`);
    }
    
    return generateFallbackScore(`API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function scoreWarehouseApplication(
  assessment: WarehouseAssessment,
  resumeText?: string,
  options: { stream?: boolean } = {}
): Promise<ApplicationScore> {
  
  const systemMessage = `You are a senior safety and operations manager with 20+ years in chemical warehouse operations. You evaluate Warehouse Associate candidates for Alliance Chemical with extreme attention to safety protocols and reliability.

Alliance Chemical stores and ships hazardous materials requiring strict OSHA compliance, DOT regulations, and emergency response protocols. Any safety failure could result in serious injury, environmental damage, or regulatory violations.

${EVALUATION_FRAMEWORK}
${SAFETY_RED_FLAGS}

Evaluate candidates using safety-first weighted criteria:
1. SAFETY FIRST (40%): Chemical safety knowledge, protocol adherence, risk awareness
2. Physical Capability (25%): Sustained lifting, chemical environment tolerance
3. Reliability (15%): Work ethic, consistency, accountability  
4. Technical Skills (10%): Equipment operation, documentation
5. Communication (10%): Clear safety reporting, instruction following`;

  const userMessage = `Evaluate this Warehouse Associate candidate:

PHYSICAL READINESS:
- 50+ lb Lifting Capability: ${assessment.physicalCapabilities.liftingAbility}
- Chemical Environment Comfort: ${assessment.physicalCapabilities.chemicalEnvironment}

SAFETY KNOWLEDGE (CRITICAL EVALUATION):
- Safety Protocol Understanding: ${assessment.safetyKnowledge.protocols}
- Emergency Response (Damaged Container): ${assessment.safetyKnowledge.damagedContainer}

WORK CHARACTER:
- Intrinsic Motivation: ${assessment.workStyle.motivation}
- Focus Maintenance: ${assessment.workStyle.focus}

${resumeText ? `BACKGROUND ANALYSIS: ${resumeText}` : ''}

Focus on safety-critical thinking and reliability indicators. Physical limitations or poor safety judgment are disqualifying factors.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'o3',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      functions: [SCORE_FUNCTION_SCHEMA],
      function_call: { name: "submitApplicationScore" },
      temperature: 0.1,
      stream: options.stream || false,
    });

    const functionCall = response.choices[0]?.message?.function_call;
    if (!functionCall?.arguments) {
      throw new Error('No function call arguments returned');
    }

    const rawScore = JSON.parse(functionCall.arguments);
    const validatedScore = ApplicationScoreSchema.parse(rawScore);
    
    return validatedScore;
    
  } catch (error) {
    logScoringError('scoreWarehouseApplication', 'Warehouse', error);
    
    if (error instanceof z.ZodError) {
      return generateFallbackScore(`Schema validation failed: ${error.message}`);
    }
    
    if (error instanceof SyntaxError) {
      return generateFallbackScore(`JSON parsing failed: ${error.message}`);
    }
    
    return generateFallbackScore(`API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  const systemMessage = `You are an expert resume analyzer specializing in chemical distribution and logistics roles. Extract relevant experience and skills with high accuracy.`;
  
  const userMessage = `Analyze this resume for skills relevant to a chemical distribution company:

${resumeText}

Focus on identifying:
- Specific platform experience (TMS MyCarrier, Shopify, Amazon)
- Industry experience (warehouse, chemical, customer service)
- Years of customer service experience
- Relevant technical and soft skills`;

  try {
    const response = await openai.chat.completions.create({
      model: 'o3',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    return JSON.parse(content);
  } catch (error) {
    logScoringError('extractResumeSkills', 'Resume Analysis', error);
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
  const systemMessage = `You are an expert interviewer specializing in ${jobRole} roles for chemical distribution companies. Generate targeted questions that validate strengths and probe weak areas while assessing cultural fit.`;
  
  const userMessage = `Generate 5-7 targeted interview questions for this candidate profile:

Role: ${jobRole}
Overall Score: ${applicationScore.overallScore}
Strengths: ${candidateStrengths.join(', ')}
Areas to Probe: ${candidateWeaknesses.join(', ')}

Focus on:
1. Validating demonstrated strengths
2. Addressing concerning weak areas  
3. Cultural fit assessment
4. Role-specific safety and compliance scenarios

Return questions that will help determine if this candidate should be hired.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'o3',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.5, // Higher creativity for question variety
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    return JSON.parse(content);
  } catch (error) {
    logScoringError('generateInterviewQuestions', jobRole, error);
    return [
      'Tell me about your relevant experience for this role',
      'How do you handle challenging situations?',
      'What interests you about working in chemical distribution?',
      'Describe a time you had to follow strict safety protocols',
      'How do you ensure accuracy in your work?'
    ];
  }
}