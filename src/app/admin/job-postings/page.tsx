'use client';

import { useState, useEffect } from 'react';

interface JobPosting {
  id: number;
  title: string;
  department: string;
  description: string;
  requirements: string;
  reviewerEmail: string;
  isActive: boolean;
  createdAt: string;
}

export default function JobPostingsAdmin() {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    description: '',
    requirements: '',
    reviewerEmail: 'hr@alliancechemical.com',
    isActive: true
  });

  // Load existing job postings
  useEffect(() => {
    fetchJobPostings();
  }, []);

  const fetchJobPostings = async () => {
    try {
      const response = await fetch('/api/job-postings');
      if (response.ok) {
        const data = await response.json();
        setJobPostings(data);
      }
    } catch (error) {
      console.error('Error fetching job postings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/job-postings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Job posting created successfully!' });
        setFormData({
          title: '',
          department: '',
          description: '',
          requirements: '',
          reviewerEmail: 'hr@alliancechemical.com',
          isActive: true
        });
        fetchJobPostings(); // Refresh list
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to create job posting' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const quickAddDefaults = [
    {
      title: 'Customer Service Specialist',
      department: 'Sales',
      description: 'Provide exceptional customer service and support for chemical product inquiries',
      requirements: 'Experience with customer service, communication skills, attention to detail',
      reviewerEmail: 'hr@alliancechemical.com'
    }
  ];

  const addQuickJob = (job: typeof quickAddDefaults[0]) => {
    setFormData({ ...job, isActive: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Job Postings Management</h1>
          
          {/* Quick Add Buttons */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Quick Add (Currently Hiring):</h2>
            <div className="flex flex-wrap gap-2">
              {quickAddDefaults.map((job, index) => (
                <button
                  key={index}
                  onClick={() => addQuickJob(job)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Add {job.title}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Only Customer Service Specialist position is currently available for applications.
            </p>
          </div>

          {/* Add Job Posting Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Customer Service Specialist"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Sales, Operations"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the role..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requirements
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Job requirements and qualifications..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reviewer Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.reviewerEmail}
                  onChange={(e) => setFormData({ ...formData, reviewerEmail: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="hr@alliancechemical.com"
                />
              </div>
              
              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active (visible to applicants)
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
            >
              {submitting ? 'Adding...' : 'Add Job Posting'}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-4 rounded ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Current Job Postings */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Job Postings</h2>
          
          {loading ? (
            <p>Loading...</p>
          ) : jobPostings.length === 0 ? (
            <p className="text-gray-500">No job postings found. Add some above!</p>
          ) : (
            <div className="space-y-4">
              {jobPostings.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {job.title} {job.department && <span className="text-gray-500">- {job.department}</span>}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded ${job.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {job.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {job.description && (
                    <p className="text-gray-700 mb-2">{job.description}</p>
                  )}
                  
                  {job.requirements && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Requirements:</strong> {job.requirements}
                    </p>
                  )}
                  
                  <div className="text-sm text-gray-500">
                    <p>Reviewer: {job.reviewerEmail}</p>
                    <p>Created: {new Date(job.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 