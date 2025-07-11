import { sendEmailViaGraph, GraphEmailData } from './microsoft-graph';
import { EmployeeApplicationForm } from './employee-validation';
import { MultiAgentAnalysisResult } from './ai-multi-agent-analyzer';

export interface EmailAttachment {
  name: string;
  contentType: string;
  content: string; // base64 encoded
}

export interface EmailNotificationResult {
  success: boolean;
  employeeEmailSent?: boolean;
  bossEmailSent?: boolean;
  error?: string;
}

// Configuration - these should be environment variables
const BOSS_EMAIL = process.env.BOSS_EMAIL || 'andre@alliancechemical.com';
const CC_EMAIL = process.env.CC_EMAIL; // Optional CC email for boss notifications
const COMPANY_NAME = 'Alliance Chemical';

/**
 * Send application confirmation email to the employee
 */
export async function sendEmployeeConfirmationEmail(
  applicationData: EmployeeApplicationForm,
  applicationId: number,
  pdfBuffer: Buffer,
  aiSummary?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const employeeEmail = applicationData.personalInfo.email;
    const employeeName = `${applicationData.personalInfo.firstName} ${applicationData.personalInfo.lastName}`;
    
    // Convert PDF to base64 for attachment
    const pdfBase64 = pdfBuffer.toString('base64');
    
    const emailData: GraphEmailData = {
      to: [employeeEmail],
      subject: `Application Confirmation - ${COMPANY_NAME} (Application #${applicationId})`,
      htmlContent: generateEmployeeEmailHTML(employeeName, applicationId, aiSummary),
      attachments: [
        {
          name: `${employeeName.replace(/\s+/g, '_')}_Application_${applicationId}.pdf`,
          contentType: 'application/pdf',
          content: pdfBase64
        }
      ]
    };

    const result = await sendEmailViaGraph(emailData);
    
    return {
      success: result.success,
      error: result.error?.message || result.message
    };

  } catch (error) {
    console.error('Error sending employee confirmation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Send application notification email to the boss
 */
export async function sendBossNotificationEmail(
  applicationData: EmployeeApplicationForm,
  applicationId: number,
  pdfBuffer: Buffer,
  multiAgentAnalysis?: MultiAgentAnalysisResult
): Promise<{ success: boolean; error?: string }> {
  try {
    const employeeName = `${applicationData.personalInfo.firstName} ${applicationData.personalInfo.lastName}`;
    
    // Convert PDF to base64 for attachment
    const pdfBase64 = pdfBuffer.toString('base64');
    
    const emailData: GraphEmailData = {
      to: [BOSS_EMAIL],
      cc: CC_EMAIL ? [CC_EMAIL] : undefined,
      subject: `New Employee Application - ${employeeName} (Application #${applicationId})`,
      htmlContent: generateBossEmailHTML(applicationData, applicationId, multiAgentAnalysis),
      attachments: [
        {
          name: `${employeeName.replace(/\s+/g, '_')}_Application_${applicationId}.pdf`,
          contentType: 'application/pdf',
          content: pdfBase64
        }
      ]
    };

    const result = await sendEmailViaGraph(emailData);
    
    return {
      success: result.success,
      error: result.error?.message || result.message
    };

  } catch (error) {
    console.error('Error sending boss notification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Send both employee and boss emails
 */
export async function sendApplicationNotificationEmails(
  applicationData: EmployeeApplicationForm,
  applicationId: number,
  pdfBuffer: Buffer,
  multiAgentAnalysis?: MultiAgentAnalysisResult
): Promise<EmailNotificationResult> {
  try {
    // Send both emails in parallel
    const [employeeResult, bossResult] = await Promise.allSettled([
      sendEmployeeConfirmationEmail(applicationData, applicationId, pdfBuffer, multiAgentAnalysis?.executiveSummary),
      sendBossNotificationEmail(applicationData, applicationId, pdfBuffer, multiAgentAnalysis)
    ]);

    const employeeSuccess = employeeResult.status === 'fulfilled' && employeeResult.value.success;
    const bossSuccess = bossResult.status === 'fulfilled' && bossResult.value.success;

    let error: string | undefined;
    if (!employeeSuccess && !bossSuccess) {
      error = 'Failed to send both emails';
    } else if (!employeeSuccess) {
      error = 'Failed to send employee confirmation email';
    } else if (!bossSuccess) {
      error = 'Failed to send boss notification email';
    }

    return {
      success: employeeSuccess && bossSuccess,
      employeeEmailSent: employeeSuccess,
      bossEmailSent: bossSuccess,
      error
    };

  } catch (error) {
    console.error('Error sending application notification emails:', error);
    return {
      success: false,
      employeeEmailSent: false,
      bossEmailSent: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate HTML content for employee confirmation email
 */
function generateEmployeeEmailHTML(
  employeeName: string,
  applicationId: number,
  aiSummary?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .summary { background-color: #e5e7eb; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${COMPANY_NAME}</h1>
                <h2>Application Confirmation</h2>
            </div>
            
            <div class="content">
                <h3>Dear ${employeeName},</h3>
                
                <p>Thank you for submitting your application for the Customer Service Specialist position at ${COMPANY_NAME}. We have successfully received your application.</p>
                
                <p><strong>Application Details:</strong></p>
                <ul>
                    <li><strong>Application ID:</strong> #${applicationId}</li>
                    <li><strong>Position:</strong> Customer Service Specialist</li>
                    <li><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</li>
                </ul>
                
                <p>We have attached a copy of your complete application to this email for your records.</p>
                
                ${aiSummary ? `
                <div class="summary">
                    <h4>Application Summary:</h4>
                    <p>${aiSummary}</p>
                </div>
                ` : ''}
                
                <p><strong>What's Next?</strong></p>
                <p>Our HR team will review your application and contact you within 3-5 business days with next steps. If you have any questions in the meantime, please don't hesitate to reach out.</p>
                
                <p>Thank you again for your interest in joining the ${COMPANY_NAME} team!</p>
                
                <p>Best regards,<br>
                ${COMPANY_NAME} HR Team</p>
            </div>
            
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>${COMPANY_NAME} | Human Resources Department</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML content for boss notification email
 */
function generateBossEmailHTML(
  applicationData: EmployeeApplicationForm,
  applicationId: number,
  multiAgentAnalysis?: MultiAgentAnalysisResult
): string {
  const employeeName = `${applicationData.personalInfo.firstName} ${applicationData.personalInfo.lastName}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .applicant-info { background-color: #f3f4f6; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .summary { background-color: #fef3c7; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Employee Application</h1>
                <h2>Customer Service Specialist Position</h2>
            </div>
            
            <div class="content">
                <h3>Application Alert</h3>
                
                <p>A new application has been submitted for the Customer Service Specialist position.</p>
                
                <div class="applicant-info">
                    <h4>Applicant Information:</h4>
                    <ul>
                        <li><strong>Name:</strong> ${employeeName}</li>
                        <li><strong>Email:</strong> ${applicationData.personalInfo.email}</li>
                        <li><strong>Phone:</strong> ${applicationData.personalInfo.phone}</li>
                        <li><strong>Location:</strong> ${applicationData.personalInfo.city}, ${applicationData.personalInfo.state}</li>
                        <li><strong>Available Start Date:</strong> ${applicationData.personalInfo.availableStartDate}</li>
                        <li><strong>Hours Available:</strong> ${applicationData.personalInfo.hoursAvailable}</li>
                    </ul>
                </div>
                
                <p><strong>Application Details:</strong></p>
                <ul>
                    <li><strong>Application ID:</strong> #${applicationId}</li>
                    <li><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</li>
                    <li><strong>Position:</strong> Customer Service Specialist</li>
                </ul>
                
                ${multiAgentAnalysis ? generateMultiAgentAnalysisHTML(multiAgentAnalysis) : ''}
                
                <p><strong>Next Steps:</strong></p>
                <ul>
                    <li>Review the attached complete application PDF</li>
                    <li>Schedule initial screening call if qualified</li>
                    <li>Contact applicant within 3-5 business days</li>
                </ul>
                
                <p>The complete application is attached to this email for your review.</p>
                
                <p>Best regards,<br>
                HR Application System</p>
            </div>
            
            <div class="footer">
                <p>This is an automated notification from the HR system.</p>
                <p>${COMPANY_NAME} | Application Management System</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Check if email service is configured
 */
export function isEmailServiceConfigured(): boolean {
  return !!BOSS_EMAIL;
}

/**
 * Get email service configuration
 */
export function getEmailServiceConfig() {
  return {
    isConfigured: isEmailServiceConfigured(),
    bossEmail: BOSS_EMAIL,
    ccEmail: CC_EMAIL,
    companyName: COMPANY_NAME,
    hasCcEmail: !!CC_EMAIL
  };
}

/**
 * Generate sophisticated multi-agent analysis HTML for boss email
 */
function generateMultiAgentAnalysisHTML(analysis: MultiAgentAnalysisResult): string {
  const recommendationColor = getRecommendationColor(analysis.finalRecommendation);
  const confidenceIcon = getConfidenceIcon(analysis.confidenceLevel);
  
  return `
    <div style="background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin-top: 0;">🤖 Multi-Agent AI Analysis</h3>
      
      <!-- Overall Recommendation -->
      <div style="background-color: ${recommendationColor}; color: white; padding: 15px; border-radius: 6px; margin: 15px 0; text-align: center;">
        <h4 style="margin: 0; font-size: 18px;">
          ${confidenceIcon} ${analysis.finalRecommendation.replace('_', ' ')} 
          (Score: ${analysis.overallScore}/10)
        </h4>
        <p style="margin: 5px 0 0 0; font-size: 14px;">
          Confidence: ${analysis.confidenceLevel}
        </p>
      </div>
      
      <!-- Executive Summary -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0;">
        <h4 style="color: #92400e; margin-top: 0;">📋 Executive Summary</h4>
        <p style="color: #78350f; margin: 0;">${analysis.executiveSummary}</p>
      </div>
      
      <!-- Agent Analyses -->
      <h4 style="color: #1f2937;">👥 Agent Assessments</h4>
      <div style="display: grid; gap: 15px;">
        ${analysis.agentAnalyses.map(agent => `
          <div style="background-color: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h5 style="margin: 0; color: #374151;">${agent.agentName}</h5>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="background-color: ${getScoreColor(agent.score)}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
                  ${agent.score}/10
                </span>
                <span style="background-color: ${getRecommendationBadgeColor(agent.recommendation)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                  ${agent.recommendation}
                </span>
              </div>
            </div>
            <p style="color: #4b5563; margin: 10px 0; font-style: italic;">${agent.analysis}</p>
            
            ${agent.strengths.length > 0 ? `
              <div style="margin: 10px 0;">
                <strong style="color: #059669;">✓ Strengths:</strong>
                <ul style="margin: 5px 0 0 20px; color: #059669;">
                  ${agent.strengths.map(strength => `<li>${strength}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${agent.concerns.length > 0 ? `
              <div style="margin: 10px 0;">
                <strong style="color: #dc2626;">⚠ Concerns:</strong>
                <ul style="margin: 5px 0 0 20px; color: #dc2626;">
                  ${agent.concerns.map(concern => `<li>${concern}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      
      <!-- Key Decision Factors -->
      ${analysis.keyDecisionFactors.length > 0 ? `
        <div style="background-color: #e0e7ff; border: 1px solid #c7d2fe; border-radius: 6px; padding: 15px; margin: 15px 0;">
          <h4 style="color: #3730a3; margin-top: 0;">🎯 Key Decision Factors</h4>
          <ul style="color: #3730a3; margin: 0;">
            ${analysis.keyDecisionFactors.map(factor => `<li>${factor}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      <!-- Risk Assessment -->
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 15px; margin: 15px 0;">
        <h4 style="color: #991b1b; margin-top: 0;">⚠️ Risk Assessment</h4>
        <p style="color: #991b1b; margin: 0;">${analysis.riskAssessment}</p>
      </div>
      
      <!-- Next Steps -->
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 15px; margin: 15px 0;">
        <h4 style="color: #065f46; margin-top: 0;">📋 Recommended Next Steps</h4>
        <ol style="color: #065f46; margin: 0;">
          ${analysis.nextSteps.map(step => `<li>${step}</li>`).join('')}
        </ol>
      </div>
    </div>
  `;
}

/**
 * Get color for recommendation badge
 */
function getRecommendationColor(recommendation: string): string {
  switch (recommendation) {
    case 'STRONG_HIRE': return '#059669';
    case 'HIRE': return '#0891b2';
    case 'CONSIDER': return '#d97706';
    case 'WEAK_CANDIDATE': return '#dc2626';
    case 'REJECT': return '#7f1d1d';
    default: return '#6b7280';
  }
}

/**
 * Get color for score badge
 */
function getScoreColor(score: number): string {
  if (score >= 8) return '#059669';
  if (score >= 6) return '#0891b2';
  if (score >= 4) return '#d97706';
  return '#dc2626';
}

/**
 * Get color for recommendation badge
 */
function getRecommendationBadgeColor(recommendation: string): string {
  switch (recommendation) {
    case 'HIRE': return '#059669';
    case 'CONSIDER': return '#d97706';
    case 'REJECT': return '#dc2626';
    default: return '#6b7280';
  }
}

/**
 * Get confidence icon
 */
function getConfidenceIcon(confidence: string): string {
  switch (confidence) {
    case 'HIGH': return '🎯';
    case 'MEDIUM': return '⚖️';
    case 'LOW': return '❓';
    default: return '📊';
  }
} 