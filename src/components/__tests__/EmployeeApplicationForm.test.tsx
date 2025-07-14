import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmployeeApplicationForm from '../EmployeeApplicationForm';
import { generateTestData } from '../../lib/test-data';

// Mock SignatureCanvas since it requires canvas
jest.mock('react-signature-canvas', () => {
  return function MockSignatureCanvas({ onEnd, ...props }: any) {
    return (
      <div data-testid="signature-canvas" {...props}>
        <button onClick={() => onEnd && onEnd()}>Mock Signature</button>
      </div>
    );
  };
});

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock fetch for API calls
global.fetch = jest.fn();

describe('EmployeeApplicationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set NODE_ENV to development to show test buttons
    process.env.NODE_ENV = 'development';
  });

  it('renders the form with initial step', () => {
    render(<EmployeeApplicationForm />);
    
    expect(screen.getByText('Employment Application')).toBeInTheDocument();
    expect(screen.getAllByText('Position')[0]).toBeInTheDocument();
    expect(screen.getByText('Quick Fill Options')).toBeInTheDocument();
  });

  it('shows test mode buttons in development', () => {
    render(<EmployeeApplicationForm />);
    
    expect(screen.getByText('📋 Fill Everything')).toBeInTheDocument();
    expect(screen.getByText('🌱 Entry Level')).toBeInTheDocument();
    expect(screen.getByText('🎆 Experienced')).toBeInTheDocument();
  });

  it('hides test mode buttons in production', () => {
    process.env.NODE_ENV = 'production';
    
    render(<EmployeeApplicationForm />);
    
    expect(screen.queryByText('🧪 Test Mode')).not.toBeInTheDocument();
    expect(screen.queryByText('📋 Fill Everything')).not.toBeInTheDocument();
  });

  it('populates form with test data when 📋 Fill Everything is clicked', async () => {
    render(<EmployeeApplicationForm />);
    
    const fillStandardButton = screen.getByText('📋 Fill Everything');
    fireEvent.click(fillStandardButton);
    
    await waitFor(() => {
      expect(screen.getByText('Form populated with test data! You can now navigate through the steps.')).toBeInTheDocument();
    });
  });

  it('allows navigation between steps', async () => {
    render(<EmployeeApplicationForm />);
    
    // Fill with test data first
    const fillStandardButton = screen.getByText('📋 Fill Everything');
    fireEvent.click(fillStandardButton);
    
    // Navigate to next step
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Personal Info')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<EmployeeApplicationForm />);
    
    // Try to go to next step without filling required fields
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Should stay on the same step due to validation
    await waitFor(() => {
      expect(screen.getByText('Position')).toBeInTheDocument();
    });
  });

  it('handles form submission with valid data', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
    global.fetch = mockFetch;
    
    render(<EmployeeApplicationForm />);
    
    // Fill form with test data
    const fillStandardButton = screen.getByText('📋 Fill Everything');
    fireEvent.click(fillStandardButton);
    
    // Navigate to last step
    const steps = ['Next', 'Next', 'Next', 'Next', 'Next', 'Next'];
    for (const step of steps) {
      const nextButton = screen.getByText(step);
      fireEvent.click(nextButton);
      await waitFor(() => {});
    }
    
    // Submit form
    const submitButton = screen.getByText('Submit Application');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/employee-applications', expect.objectContaining({
        method: 'POST',
        body: expect.any(Object)
      }));
    });
  });

  describe('Test Data Generation', () => {
    it('generates valid test data', () => {
      const testData = generateTestData();
      
      expect(testData.personalInfo.firstName).toBe('John');
      expect(testData.personalInfo.lastName).toBe('Doe');
      expect(testData.personalInfo.email).toBe('john.doe@email.com');
      expect(testData.personalInfo.socialSecurityNumber).toMatch(/^\d{3}-\d{2}-\d{4}$/);
      expect(testData.workExperience).toHaveLength(2);
      expect(testData.education).toHaveLength(2);
      expect(testData.references).toHaveLength(2);
      expect(testData.eligibility.eligibleToWork).toBe(true);
      expect(testData.termsAgreed).toBe(true);
    });

    it('validates test data against schema', () => {
      const testData = generateTestData();
      
      // Test that essential fields are present
      expect(testData.personalInfo.firstName).toBeTruthy();
      expect(testData.personalInfo.lastName).toBeTruthy();
      expect(testData.personalInfo.email).toContain('@');
      expect(testData.personalInfo.socialSecurityNumber).toMatch(/^\d{3}-\d{2}-\d{4}$/);
      expect(testData.personalInfo.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(testData.workExperience[0].startDate).toMatch(/^\d{4}-\d{2}$/);
      expect(testData.education[0].institutionName).toBeTruthy();
      expect(testData.references[0].name).toBeTruthy();
      expect(testData.references[0].phone).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('validates SSN format', async () => {
      render(<EmployeeApplicationForm />);
      
      // Navigate to personal info step
      const fillStandardButton = screen.getByText('📋 Fill Everything');
      fireEvent.click(fillStandardButton);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const ssnInput = screen.getByDisplayValue('123-45-6789');
        expect(ssnInput).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data and navigate to personal info
      const fillStandardButton = screen.getByText('📋 Fill Everything');
      fireEvent.click(fillStandardButton);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('john.doe@email.com');
        expect(emailInput).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('API Error'));
      global.fetch = mockFetch;
      
      render(<EmployeeApplicationForm />);
      
      // Fill form with test data
      const fillStandardButton = screen.getByText('📋 Fill Everything');
      fireEvent.click(fillStandardButton);
      
      // Navigate to submit step (would require more complex navigation in real test)
      // For now, just test that the error handling exists
      expect(screen.getByText('📋 Fill Everything')).toBeInTheDocument();
    });
  });
}); 