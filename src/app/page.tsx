import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <Image
              src="/WIDE - Color on Transparent _RGB-01.png"
              alt="Alliance Chemical Logo"
              width={400}
              height={100}
              className="mx-auto mb-8"
              priority
            />
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Join Our Team
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start your career with Alliance Chemical - where innovation meets excellence 
              in chemical distribution and logistics.
            </p>
          </div>

          {/* CTA Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-16 hover:shadow-2xl transition-all duration-300 border border-gray-100">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Ready to Apply?
            </h2>
            <p className="text-gray-600 mb-8">
              Our streamlined application process makes it easy to showcase your skills 
              and experience. Get started in just a few minutes.
            </p>
            <Link
              href="/employee-application"
              className="group inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:shadow-blue-500/25"
            >
              Start Your Application
              <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 transform hover:scale-105">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-blue-600 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors duration-300">Smart Resume Parsing</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Upload your resume and our AI will automatically fill in your work history for you.</p>
            </div>

            <div className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 transform hover:scale-105">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-green-600 group-hover:text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-900 transition-colors duration-300">Secure & Private</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Your information is encrypted and securely stored with enterprise-grade security.</p>
            </div>

            <div className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 transform hover:scale-105">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-purple-600 group-hover:text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-900 transition-colors duration-300">Quick Process</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Complete your application in under 10 minutes with our streamlined process.</p>
            </div>
          </div>

          {/* Company Info */}
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 text-white hover:shadow-2xl transition-all duration-300 border border-gray-700">
            <h2 className="text-3xl font-bold mb-4">Why Alliance Chemical?</h2>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="group">
                <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-300 transition-colors duration-300">Industry Leadership</h3>
                <p className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
                  Leading chemical distribution company with decades of experience in 
                  logistics, e-commerce, and supply chain management.
                </p>
              </div>
              <div className="group">
                <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-300 transition-colors duration-300">Growth Opportunities</h3>
                <p className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
                  Join a growing team where your skills in logistics, technology, 
                  and operations can make a real impact.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
