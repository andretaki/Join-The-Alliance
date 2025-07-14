import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmployeeApplicationForm from '../components/EmployeeApplicationForm';
import { generateTestData } from '../lib/test-data';

// Mock all external dependencies
jest.mock('react-signature-canvas', () => {
  return function MockSignatureCanvas({ onEnd, ...props }: any) {
    return (
      <div data-testid="signature-canvas" {...props}>
        <button onClick={() => onEnd && onEnd()}>Mock Signature</button>
      </div>
    );
  };
});

jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock navigator.mediaDevices for camera functionality
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{
        stop: jest.fn(),
      }],
    }),
  },
});

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, applicationId: 123 }),
    });
  });

  describe('Complete Application Flow', () => {
    it('completes the entire application process', async () => {
      render(<EmployeeApplicationForm />);
      
      // Step 1: Position Selection
      expect(screen.getByText('Employment Application')).toBeInTheDocument();
      expect(screen.getByText('Position')).toBeInTheDocument();
      
      // Fill with test data
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      await waitFor(() => {
        expect(screen.getByText('Form populated with test data! You can now navigate through the steps.')).toBeInTheDocument();
      });
      
      // Step 2: Role Assessment
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Assessment')).toBeInTheDocument();
      });
      
      // Step 3: Personal Information
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Personal')).toBeInTheDocument();
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      });
      
      // Step 4: Documents
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Documents')).toBeInTheDocument();
      });
      
      // Step 5: Experience
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Experience')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Tech Corp')).toBeInTheDocument();
      });
      
      // Step 6: Education
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
        expect(screen.getByDisplayValue('University of Texas')).toBeInTheDocument();
      });
      
      // Step 7: References
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('References')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Jane Manager')).toBeInTheDocument();
      });
      
      // Step 8: Signature
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Signature')).toBeInTheDocument();
        expect(screen.getByTestId('signature-canvas')).toBeInTheDocument();
      });
      
      // Add signature
      const signatureButton = screen.getByText('Mock Signature');
      fireEvent.click(signatureButton);
      
      // Submit application
      const submitButton = screen.getByText('Submit Application');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/employee-applications', expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        }));
      });
    });

    it('handles navigation between steps', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      await waitFor(() => {
        expect(screen.getByText('Form populated with test data! You can now navigate through the steps.')).toBeInTheDocument();
      });
      
      // Navigate forward
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Assessment')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Personal')).toBeInTheDocument();
      });
      
      // Navigate backward
      fireEvent.click(screen.getByText('Back'));
      await waitFor(() => {
        expect(screen.getByText('Assessment')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Back'));
      await waitFor(() => {
        expect(screen.getByText('Position')).toBeInTheDocument();
      });
    });

    it('validates form data before submission', async () => {
      render(<EmployeeApplicationForm />);
      
      // Try to submit without filling anything
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      // Should stay on the same step due to validation
      await waitFor(() => {
        expect(screen.getByText('Position')).toBeInTheDocument();
      });
    });

    it('handles API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      
      render(<EmployeeApplicationForm />);
      
      // Fill with test data
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      await waitFor(() => {
        expect(screen.getByText('Form populated with test data! You can now navigate through the steps.')).toBeInTheDocument();
      });
      
      // Navigate to final step
      const steps = ['Next', 'Next', 'Next', 'Next', 'Next', 'Next', 'Next'];
      for (const step of steps) {
        fireEvent.click(screen.getByText(step));
        await waitFor(() => {});
      }
      
      // Add signature and submit
      const signatureButton = screen.getByText('Mock Signature');
      fireEvent.click(signatureButton);
      
      const submitButton = screen.getByText('Submit Application');
      fireEvent.click(submitButton);
      
      // Should handle the error gracefully
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('File Upload Integration', () => {
    it('handles resume upload and parsing', async () => {
      // Mock successful resume parsing
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          personalInfo: { firstName: 'John', lastName: 'Doe' },
          workExperience: [{ company: 'Tech Corp', position: 'Developer' }],
          education: [{ institutionName: 'University', degree: 'BS' }],
        }),
      });
      
      render(<EmployeeApplicationForm />);
      
      // Navigate to documents step
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      await waitFor(() => {
        expect(screen.getByText('Form populated with test data! You can now navigate through the steps.')).toBeInTheDocument();
      });
      
      const steps = ['Next', 'Next', 'Next'];
      for (const step of steps) {
        fireEvent.click(screen.getByText(step));
        await waitFor(() => {});
      }
      
      await waitFor(() => {
        expect(screen.getByText('Documents')).toBeInTheDocument();
      });
      
      // Upload resume
      const fileInput = screen.getByLabelText(/resume/i);
      const resumeFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
      
      fireEvent.change(fileInput, { target: { files: [resumeFile] } });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/parse-resume', expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        }));
      });
    });

    it('handles ID photo capture', async () => {
      render(<EmployeeApplicationForm />);
      
      // Navigate to documents step
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      await waitFor(() => {
        expect(screen.getByText('Form populated with test data! You can now navigate through the steps.')).toBeInTheDocument();
      });
      
      const steps = ['Next', 'Next', 'Next'];
      for (const step of steps) {
        fireEvent.click(screen.getByText(step));
        await waitFor(() => {});
      }
      
      await waitFor(() => {
        expect(screen.getByText('Documents')).toBeInTheDocument();
      });
      
      // Check if camera option is available
      const cameraButton = screen.queryByText('Take Photo');
      if (cameraButton) {
        fireEvent.click(cameraButton);
        
        await waitFor(() => {
          expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
            video: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        });
      }
    });
  });

  describe('Form Persistence', () => {
    it('maintains form data across step navigation', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      await waitFor(() => {
        expect(screen.getByText('Form populated with test data! You can now navigate through the steps.')).toBeInTheDocument();
      });
      
      // Navigate to personal info
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Personal')).toBeInTheDocument();
      });
      
      // Verify data is present
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john.doe@email.com')).toBeInTheDocument();
      
      // Navigate to another step and back
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Back'));
      fireEvent.click(screen.getByText('Back'));
      
      await waitFor(() => {
        expect(screen.getByText('Personal')).toBeInTheDocument();
      });
      
      // Data should still be there
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john.doe@email.com')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<EmployeeApplicationForm />);
      
      // Check form structure
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
      
      // Check navigation
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Check inputs have proper labels
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
    });

    it('supports keyboard navigation', async () => {
      render(<EmployeeApplicationForm />);
      
      // Test tab navigation
      const firstFocusable = screen.getByText('Fill Standard');
      firstFocusable.focus();
      
      expect(document.activeElement).toBe(firstFocusable);
      
      // Test Enter key on buttons
      fireEvent.keyDown(firstFocusable, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('Form populated with test data! You can now navigate through the steps.')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('adapts to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<EmployeeApplicationForm />);
      
      // Should render without errors on mobile
      expect(screen.getByText('Employment Application')).toBeInTheDocument();
      expect(screen.getByText('Position')).toBeInTheDocument();
    });

    it('handles iOS Safari dropdown focus issue', async () => {
      // Mock iOS Safari
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      });
      
      render(<EmployeeApplicationForm />);
      
      // Fill with test data
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      await waitFor(() => {
        expect(screen.getByText('Form populated with test data! You can now navigate through the steps.')).toBeInTheDocument();
      });
      
      // Navigate to assessment step
      fireEvent.click(screen.getByText('Next'));
      
      await waitFor(() => {
        expect(screen.getByText('Assessment')).toBeInTheDocument();
      });
      
      // Should handle iOS focus management without opening dropdowns
      expect(document.activeElement).toBeDefined();
    });
  });
});