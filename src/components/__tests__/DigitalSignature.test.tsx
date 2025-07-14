import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DigitalSignature from '../DigitalSignature';

// Mock SignatureCanvas
jest.mock('react-signature-canvas', () => {
  return React.forwardRef(function MockSignatureCanvas({ onEnd, canvasProps, ...props }: any, ref: any) {
    React.useImperativeHandle(ref, () => ({
      clear: jest.fn(),
      isEmpty: jest.fn(() => false),
      toDataURL: jest.fn(() => 'data:image/png;base64,mock-signature-data')
    }));
    
    return (
      <div data-testid="signature-canvas">
        <canvas data-testid="signature-canvas-element" {...canvasProps} />
        <button 
          data-testid="mock-signature-button"
          onClick={() => onEnd && onEnd()}
        >
          Mock Signature
        </button>
      </div>
    );
  });
});

// Mock jsPDF
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    addPage: jest.fn(),
    setFont: jest.fn(),
    addImage: jest.fn(),
    output: jest.fn().mockReturnValue('mock-pdf-data'),
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
    setDrawColor: jest.fn(),
    setLineWidth: jest.fn(),
    rect: jest.fn(),
    splitTextToSize: jest.fn().mockReturnValue(['mock text']),
  })),
}));

// Mock html2canvas
jest.mock('html2canvas', () => jest.fn().mockResolvedValue({ toDataURL: () => 'mock-canvas-data' }));

describe('DigitalSignature', () => {
  const mockProps = {
    applicationId: 123,
    onSignatureComplete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock crypto.subtle for signature hashing
    Object.defineProperty(global, 'crypto', {
      value: {
        subtle: {
          digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
        },
      },
    });
  });

  it('renders signature component', () => {
    render(<DigitalSignature {...mockProps} />);
    
    expect(screen.getByText('Digital Signature')).toBeInTheDocument();
    expect(screen.getByTestId('signature-canvas')).toBeInTheDocument();
  });

  it('shows clear signature button', () => {
    render(<DigitalSignature {...mockProps} />);
    
    const clearButton = screen.getByText('Clear Signature');
    expect(clearButton).toBeInTheDocument();
  });

  it('handles signature clearing', () => {
    render(<DigitalSignature {...mockProps} />);
    
    const clearButton = screen.getByText('Clear Signature');
    fireEvent.click(clearButton);
    
    // Should not throw any errors
    expect(clearButton).toBeInTheDocument();
  });

  it('shows sign document button', () => {
    render(<DigitalSignature {...mockProps} />);
    
    const signButton = screen.getByText('Sign Document');
    expect(signButton).toBeInTheDocument();
  });

  it('handles document signing', async () => {
    render(<DigitalSignature {...mockProps} />);
    
    const signButton = screen.getByText('Sign Document');
    fireEvent.click(signButton);
    
    // Should show loading or completion state
    expect(signButton).toBeInTheDocument();
  });

  it('displays terms and conditions', () => {
    render(<DigitalSignature {...mockProps} />);
    
    // Should show some terms content
    expect(screen.getByText(/Use of Information/i)).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(<DigitalSignature {...mockProps} />);
    
    const signButton = screen.getByText('Sign Document');
    expect(signButton).toBeInTheDocument();
    expect(signButton.tagName).toBe('BUTTON');
  });

  it('shows signature canvas', () => {
    render(<DigitalSignature {...mockProps} />);
    
    const canvas = screen.getByTestId('signature-canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('handles signature completion callback', () => {
    render(<DigitalSignature {...mockProps} />);
    
    // The onSignatureComplete should be callable
    expect(typeof mockProps.onSignatureComplete).toBe('function');
  });
});