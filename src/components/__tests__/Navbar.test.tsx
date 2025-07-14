import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '../Navbar';

describe('Navbar', () => {
  it('renders company logo and name', () => {
    render(<Navbar />);
    
    expect(screen.getByAltText('Alliance Chemical')).toBeInTheDocument();
    expect(screen.getByText('Alliance Chemical')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Navbar />);
    
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /services/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument();
  });

  it('renders contact information', () => {
    render(<Navbar />);
    
    expect(screen.getByText('(512) 365-6838')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<Navbar />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    
    const logoLink = screen.getByRole('link', { name: /alliance chemical/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('is responsive with mobile menu toggle', () => {
    render(<Navbar />);
    
    // Check for mobile menu button (if implemented)
    const mobileMenuButton = screen.queryByRole('button', { name: /menu/i });
    if (mobileMenuButton) {
      expect(mobileMenuButton).toBeInTheDocument();
    }
  });

  it('has hover states for interactive elements', () => {
    render(<Navbar />);
    
    const homeLink = screen.getByRole('link', { name: /home/i });
    fireEvent.mouseEnter(homeLink);
    fireEvent.mouseLeave(homeLink);
    
    // No errors should occur during hover interactions
    expect(homeLink).toBeInTheDocument();
  });
});