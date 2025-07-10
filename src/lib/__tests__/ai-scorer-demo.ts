// Demo test showing the enhanced AI scoring system
// This would be used for testing the improved functionality

import { 
  scoreCustomerServiceApplication, 
  scoreWarehouseApplication,
  ApplicationScoreSchema,
  CustomerServiceAssessment,
  WarehouseAssessment 
} from '../ai-application-scorer-v2';

// Mock customer service assessment
const mockCustomerServiceAssessment: CustomerServiceAssessment = {
  tmsExperience: 'intermediate',
  shopifyExperience: 'I have managed Shopify stores for 2 years, handling order processing, customer inquiries, and inventory management.',
  amazonExperience: 'basic',
  scenarioResponses: {
    delayedShipment: 'I would immediately contact the carrier for an updated ETA, notify the customer with alternative solutions, and escalate to management if needed for expedited shipping options.',
    restrictedChemical: 'I would check our compliance database, verify the customer has proper certifications, document all communications, and flag for manager review before processing.',
    hazmatExplanation: 'Hazmat fees cover specialized packaging, trained driver requirements, DOT compliance documentation, and additional insurance required for safe transport of dangerous materials.'
  },
  personalAssessment: {
    learningApproach: 'I create detailed notes, practice in sandbox environments, and ask experienced colleagues for tips when learning new software.',
    motivations: ['Solving complex problems', 'Building long-term customer relationships', 'Learning new technologies'],
    stressManagement: 'I prioritize tasks by urgency and impact, take brief breaks when overwhelmed, and communicate proactively with customers about realistic timelines.',
    automation: 'I would automate order status updates and tracking notifications to reduce repetitive customer inquiries and free up time for complex problem-solving.'
  },
  advancedAssessment: {
    loyaltyFactor: 'reliability',
    dataUsage: 'Track response times, resolution rates, and customer satisfaction scores to identify training needs and process improvements.',
    workEnvironment: 'I prefer collaborative teams with clear communication, moderate pace with room for deep focus, and opportunities to learn from experienced professionals.'
  }
};

// Mock warehouse assessment
const mockWarehouseAssessment: WarehouseAssessment = {
  physicalCapabilities: {
    liftingAbility: 'yes',
    chemicalEnvironment: 'yes'
  },
  safetyKnowledge: {
    protocols: 'Always check SDS sheets before handling, wear appropriate PPE, follow LOTO procedures, maintain three points of contact, and report any incidents immediately.',
    damagedContainer: 'Secure the area, evacuate if necessary, check SDS for spill procedures, wear appropriate PPE, contain spill using proper materials, and notify emergency response team.'
  },
  workStyle: {
    motivation: 'I take pride in maintaining a safe workplace and ensuring accurate inventory. Knowing that my work directly impacts customer safety and satisfaction drives me to be thorough and reliable.',
    focus: 'I break repetitive tasks into smaller goals, rotate between different activities when possible, and focus on the importance of accuracy for customer safety.'
  }
};

// Demo function to test the enhanced AI scoring
export async function demoEnhancedScoring() {
  console.log('🧪 Testing Enhanced AI Scoring System...\n');

  try {
    // Test Customer Service scoring with enhanced features
    console.log('📊 Scoring Customer Service Candidate...');
    const csScore = await scoreCustomerServiceApplication(mockCustomerServiceAssessment);
    
    // Validate schema
    const validatedScore = ApplicationScoreSchema.safeParse(csScore);
    if (!validatedScore.success) {
      console.error('❌ Schema validation failed:', validatedScore.error);
      return;
    }
    
    console.log('✅ Customer Service Score:', {
      overall: csScore.overallScore,
      technical: csScore.technicalScore,
      experience: csScore.experienceScore,
      communication: csScore.communicationScore,
      culturalFit: csScore.culturalFitScore,
      redFlagsCount: csScore.redFlags.length,
      strengthsCount: csScore.strengths.length,
      reasoning: csScore.reasoning
    });

    // Test Warehouse scoring
    console.log('\n🏭 Scoring Warehouse Candidate...');
    const warehouseScore = await scoreWarehouseApplication(mockWarehouseAssessment);
    
    console.log('✅ Warehouse Score:', {
      overall: warehouseScore.overallScore,
      technical: warehouseScore.technicalScore,
      experience: warehouseScore.experienceScore,
      communication: warehouseScore.communicationScore,
      culturalFit: warehouseScore.culturalFitScore,
      redFlagsCount: warehouseScore.redFlags.length,
      strengthsCount: warehouseScore.strengths.length,
      reasoning: warehouseScore.reasoning
    });

    console.log('\n🎯 Enhanced Features Demonstrated:');
    console.log('✅ System/User message pattern');
    console.log('✅ Zod schema validation');
    console.log('✅ OpenAI function calling for structured output');
    console.log('✅ Enhanced error handling with context');
    console.log('✅ Common prompt fragments (reduced duplication)');
    console.log('✅ Improved reasoning with o3 model');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Example usage:
// demoEnhancedScoring().then(() => console.log('Demo complete!'));