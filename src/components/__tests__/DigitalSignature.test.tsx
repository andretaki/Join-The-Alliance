import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DigitalSignature from '../DigitalSignature';

// Mock SignatureCanvas
jest.mock('react-signature-canvas', () => {
  return function MockSignatureCanvas({ onEnd, ...props }: any) {
    return (
      <div data-testid="signature-canvas" {...props}>
        <canvas data-testid="signature-canvas-element" />
        <button 
          data-testid="mock-signature-button"
          onClick={() => onEnd && onEnd()}
        >
          Mock Signature
        </button>
      </div>
    );
  };
});

describe('DigitalSignature', () => {
  const mockProps = {
    value: '',
    onChange: jest.fn(),
    onSignatureCapture: jest.fn(),
    onClear: jest.fn(),
    error: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders signature component with draw mode by default', () => {
    render(<DigitalSignature {...mockProps} />);
    
    expect(screen.getByText('Digital Signature')).toBeInTheDocument();
    expect(screen.getByText('Draw')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByTestId('signature-canvas')).toBeInTheDocument();
  });

  it('switches between draw and type modes', () => {
    render(<DigitalSignature {...mockProps} />);
    
    // Start with draw mode
    expect(screen.getByTestId('signature-canvas')).toBeInTheDocument();
    
    // Switch to type mode
    const typeButton = screen.getByText('Type');
    fireEvent.click(typeButton);
    
    expect(screen.getByPlaceholderText('Type your full name')).toBeInTheDocument();
    
    // Switch back to draw mode
    const drawButton = screen.getByText('Draw');
    fireEvent.click(drawButton);
    
    expect(screen.getByTestId('signature-canvas')).toBeInTheDocument();
  });

  it('handles typed signature input', () => {
    render(<DigitalSignature {...mockProps} />);
    
    // Switch to type mode
    const typeButton = screen.getByText('Type');
    fireEvent.click(typeButton);
    
    const input = screen.getByPlaceholderText('Type your full name');
    fireEvent.change(input, { target: { value: 'John Doe' } });
    
    expect(mockProps.onChange).toHaveBeenCalledWith('John Doe');
  });

  it('displays signature preview in type mode', () => {
    render(<DigitalSignature {...mockProps} value="John Doe" />);
    
    // Switch to type mode
    const typeButton = screen.getByText('Type');
    fireEvent.click(typeButton);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows clear button when signature exists', () => {
    render(<DigitalSignature {...mockProps} value="John Doe" />);
    
    const clearButton = screen.getByText('Clear');
    expect(clearButton).toBeInTheDocument();
    
    fireEvent.click(clearButton);
    expect(mockProps.onClear).toHaveBeenCalled();
  });

  it('displays error message when provided', () => {
    render(<DigitalSignature {...mockProps} error="Signature is required" />);
    
    expect(screen.getByText('Signature is required')).toBeInTheDocument();
  });

  it('handles signature capture from canvas', () => {
    render(<DigitalSignature {...mockProps} />);
    
    const mockSignatureButton = screen.getByTestId('mock-signature-button');
    fireEvent.click(mockSignatureButton);
    
    expect(mockProps.onSignatureCapture).toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<DigitalSignature {...mockProps} />);
    
    const drawButton = screen.getByText('Draw');
    const typeButton = screen.getByText('Type');
    
    expect(drawButton).toHaveAttribute('role', 'button');
    expect(typeButton).toHaveAttribute('role', 'button');
  });

  it('maintains signature state across mode switches', () => {
    render(<DigitalSignature {...mockProps} value="John Doe" />);
    
    // Switch to type mode
    const typeButton = screen.getByText('Type');
    fireEvent.click(typeButton);
    
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    
    // Switch back to draw mode
    const drawButton = screen.getByText('Draw');
    fireEvent.click(drawButton);
    
    // Value should still be maintained
    expect(mockProps.value).toBe('John Doe');
  });
});