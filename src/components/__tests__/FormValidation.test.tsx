import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmployeeApplicationForm from '../EmployeeApplicationForm';

// Mock dependencies
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

global.fetch = jest.fn();

describe('Form Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
  });

  describe('Personal Information Validation', () => {
    it('validates required personal information fields', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data and navigate to personal info
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Personal Info')).toBeInTheDocument();
      });
      
      // Clear a required field
      const firstNameInput = screen.getByDisplayValue('John');
      fireEvent.change(firstNameInput, { target: { value: '' } });
      
      // Try to proceed
      const nextButton2 = screen.getByText('Next');
      fireEvent.click(nextButton2);
      
      // Should show validation error and stay on same step
      await waitFor(() => {
        expect(screen.getByText('Personal Info')).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data and navigate to personal info
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('john.doe@email.com');
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        
        // Field should show validation error
        fireEvent.blur(emailInput);
      });
    });

    it('validates phone number format', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data and navigate to personal info
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const phoneInput = screen.getByDisplayValue('(555) 123-4567');
        fireEvent.change(phoneInput, { target: { value: '123' } });
        
        // Field should show validation error
        fireEvent.blur(phoneInput);
      });
    });

    it('validates SSN format', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data and navigate to personal info
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const ssnInput = screen.getByDisplayValue('123-45-6789');
        fireEvent.change(ssnInput, { target: { value: '123456789' } });
        
        // Field should show validation error
        fireEvent.blur(ssnInput);
      });
    });

    it('validates date of birth format', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data and navigate to personal info
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const dobInput = screen.getByDisplayValue('1990-01-01');
        fireEvent.change(dobInput, { target: { value: '1990-13-01' } });
        
        // Field should show validation error
        fireEvent.blur(dobInput);
      });
    });
  });

  describe('Work Experience Validation', () => {
    it('validates required work experience fields', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data and navigate to work experience
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      // Navigate to work experience step
      const steps = ['Next', 'Next', 'Next', 'Next'];
      for (const step of steps) {
        const nextButton = screen.getByText(step);
        fireEvent.click(nextButton);
        await waitFor(() => {});
      }
      
      await waitFor(() => {
        expect(screen.getByText('Experience')).toBeInTheDocument();
      });
      
      // Clear a required field
      const companyInput = screen.getByDisplayValue('Tech Corp');
      fireEvent.change(companyInput, { target: { value: '' } });
      
      // Try to proceed
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      // Should show validation error and stay on same step
      await waitFor(() => {
        expect(screen.getByText('Experience')).toBeInTheDocument();
      });
    });

    it('validates date ranges in work experience', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data and navigate to work experience
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      // Navigate to work experience step
      const steps = ['Next', 'Next', 'Next', 'Next'];
      for (const step of steps) {
        const nextButton = screen.getByText(step);
        fireEvent.click(nextButton);
        await waitFor(() => {});
      }
      
      await waitFor(() => {
        expect(screen.getByText('Experience')).toBeInTheDocument();
      });
      
      // Set invalid date range (end date before start date)
      const startDateInput = screen.getByDisplayValue('2020-01');
      const endDateInput = screen.getByDisplayValue('2023-12');
      
      fireEvent.change(startDateInput, { target: { value: '2023-01' } });
      fireEvent.change(endDateInput, { target: { value: '2020-12' } });
      
      // Should show validation error
      fireEvent.blur(endDateInput);
    });
  });

  describe('Education Validation', () => {
    it('validates required education fields', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data and navigate to education
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      // Navigate to education step
      const steps = ['Next', 'Next', 'Next', 'Next', 'Next'];
      for (const step of steps) {
        const nextButton = screen.getByText(step);
        fireEvent.click(nextButton);
        await waitFor(() => {});
      }
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });
      
      // Clear a required field
      const institutionInput = screen.getByDisplayValue('University of Texas');
      fireEvent.change(institutionInput, { target: { value: '' } });
      
      // Try to proceed
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      // Should show validation error and stay on same step
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });
    });

    it('validates GPA format', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data and navigate to education
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      // Navigate to education step
      const steps = ['Next', 'Next', 'Next', 'Next', 'Next'];
      for (const step of steps) {
        const nextButton = screen.getByText(step);
        fireEvent.click(nextButton);
        await waitFor(() => {});
      }
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });
      
      // Set invalid GPA
      const gpaInput = screen.getByDisplayValue('3.5');
      fireEvent.change(gpaInput, { target: { value: '5.0' } });
      
      // Should show validation error
      fireEvent.blur(gpaInput);
    });
  });

  describe('References Validation', () => {
    it('validates required reference fields', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data and navigate to references
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      // Navigate to references step
      const steps = ['Next', 'Next', 'Next', 'Next', 'Next', 'Next'];
      for (const step of steps) {
        const nextButton = screen.getByText(step);
        fireEvent.click(nextButton);
        await waitFor(() => {});
      }
      
      await waitFor(() => {
        expect(screen.getByText('References')).toBeInTheDocument();
      });
      
      // Clear a required field
      const nameInput = screen.getByDisplayValue('Jane Manager');
      fireEvent.change(nameInput, { target: { value: '' } });
      
      // Try to proceed
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      // Should show validation error and stay on same step
      await waitFor(() => {
        expect(screen.getByText('References')).toBeInTheDocument();
      });
    });

    it('validates reference contact information', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data and navigate to references
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      // Navigate to references step
      const steps = ['Next', 'Next', 'Next', 'Next', 'Next', 'Next'];
      for (const step of steps) {
        const nextButton = screen.getByText(step);
        fireEvent.click(nextButton);
        await waitFor(() => {});
      }
      
      await waitFor(() => {
        expect(screen.getByText('References')).toBeInTheDocument();
      });
      
      // Set invalid email
      const emailInput = screen.getByDisplayValue('jane.manager@techcorp.com');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      // Should show validation error
      fireEvent.blur(emailInput);
    });
  });

  describe('File Upload Validation', () => {
    it('validates file types', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data and navigate to files
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      // Navigate to files step
      const steps = ['Next', 'Next', 'Next'];
      for (const step of steps) {
        const nextButton = screen.getByText(step);
        fireEvent.click(nextButton);
        await waitFor(() => {});
      }
      
      await waitFor(() => {
        expect(screen.getByText('Documents')).toBeInTheDocument();
      });
      
      // Try to upload invalid file type
      const fileInput = screen.getByLabelText(/resume/i);
      const invalidFile = new File(['content'], 'resume.txt', { type: 'text/plain' });
      
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      });
    });

    it('validates file size', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data and navigate to files
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      // Navigate to files step
      const steps = ['Next', 'Next', 'Next'];
      for (const step of steps) {
        const nextButton = screen.getByText(step);
        fireEvent.click(nextButton);
        await waitFor(() => {});
      }
      
      await waitFor(() => {
        expect(screen.getByText('Documents')).toBeInTheDocument();
      });
      
      // Try to upload oversized file
      const fileInput = screen.getByLabelText(/resume/i);
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'resume.pdf', { type: 'application/pdf' });
      
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/file size exceeds/i)).toBeInTheDocument();
      });
    });
  });

  describe('Digital Signature Validation', () => {
    it('validates signature presence', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data and navigate to signature
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      // Navigate to signature step
      const steps = ['Next', 'Next', 'Next', 'Next', 'Next', 'Next', 'Next'];
      for (const step of steps) {
        const nextButton = screen.getByText(step);
        fireEvent.click(nextButton);
        await waitFor(() => {});
      }
      
      await waitFor(() => {
        expect(screen.getByText('Signature')).toBeInTheDocument();
      });
      
      // Clear signature
      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);
      
      // Try to submit without signature
      const submitButton = screen.getByText('Submit Application');
      fireEvent.click(submitButton);
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/signature is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step Navigation Validation', () => {
    it('prevents navigation to next step with invalid data', async () => {
      render(<EmployeeApplicationForm />);
      
      // Try to navigate without selecting position
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      // Should stay on the same step
      await waitFor(() => {
        expect(screen.getByText('Position')).toBeInTheDocument();
      });
    });

    it('allows navigation to previous steps', async () => {
      render(<EmployeeApplicationForm />);
      
      // Fill with test data and navigate to next step
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Personal Info')).toBeInTheDocument();
      });
      
      // Navigate back
      const prevButton = screen.getByText('Back');
      fireEvent.click(prevButton);
      
      await waitFor(() => {
        expect(screen.getByText('Position')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission Validation', () => {
    it('validates complete form before submission', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      global.fetch = mockFetch;

      render(<EmployeeApplicationForm />);
      
      // Fill form with test data
      const fillStandardButton = screen.getByText('Fill Standard');
      fireEvent.click(fillStandardButton);
      
      // Navigate to submit step
      const steps = ['Next', 'Next', 'Next', 'Next', 'Next', 'Next', 'Next'];
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
          body: expect.any(FormData)
        }));
      });
    });
  });
});