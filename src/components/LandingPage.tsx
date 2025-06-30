import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 mr-3">
                <svg viewBox="0 0 32 32" className="w-full h-full">
                  <rect x="6" y="4" width="18" height="24" rx="2" ry="2" fill="#ffffff" stroke="#3b82f6" strokeWidth="1.5"/>
                  <path d="M20 4 L24 8 L20 8 Z" fill="#e5e7eb" stroke="#3b82f6" strokeWidth="1"/>
                  <text x="15" y="14" fontFamily="Arial, sans-serif" fontSize="4" fontWeight="bold" textAnchor="middle" fill="#dc2626">PDF</text>
                  <circle cx="19" cy="22" r="2.5" fill="none" stroke="#3b82f6" strokeWidth="0.8"/>
                  <circle cx="19" cy="22" r="0.8" fill="#3b82f6"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">AtomicPDF</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600">How it Works</a>
              <a href="#privacy" className="text-gray-700 hover:text-blue-600">Privacy</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Professional PDF Editor
            <span className="block text-blue-600">Built for Privacy</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Edit, annotate, and manage PDF documents with powerful tools. Everything happens locally in your browser – your files never leave your device.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/editor"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Editing PDFs
            </Link>
            <a
              href="#features"
              className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful PDF Editing Tools</h2>
            <p className="text-xl text-gray-600">Everything you need to work with PDF documents</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Text Annotations */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Text Annotations</h3>
              <p className="text-gray-600">Add text boxes with full formatting options - fonts, sizes, colors, and styles.</p>
            </div>

            {/* Highlighting */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4v10a2 2 0 002 2h6a2 2 0 002-2V8M7 8h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Highlighting</h3>
              <p className="text-gray-600">Highlight important text with multiple colors and adjustable brush sizes.</p>
            </div>

            {/* Drawing Tools */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Drawing & Sketching</h3>
              <p className="text-gray-600">Draw freehand annotations with multiple pen colors and sizes.</p>
            </div>

            {/* Page Operations */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Page Management</h3>
              <p className="text-gray-600">Rotate, move, merge, and collate pages with intuitive controls.</p>
            </div>

            {/* Export Options */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Multiple Export Formats</h3>
              <p className="text-gray-600">Export to PDF, PNG, Word, or Excel with customizable options.</p>
            </div>

            {/* Privacy First */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">100% Private</h3>
              <p className="text-gray-600">All processing happens locally. Your documents never leave your browser.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How AtomicPDF Works</h2>
            <p className="text-xl text-gray-600">Simple, secure, and powerful PDF editing in 3 steps</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your PDF</h3>
              <p className="text-gray-600">Drag and drop or click to select your PDF file. Everything stays on your device.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Edit & Annotate</h3>
              <p className="text-gray-600">Use our powerful tools to add text, highlights, drawings, and manage pages.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Export & Save</h3>
              <p className="text-gray-600">Download your edited PDF or export to other formats like PNG, Word, or Excel.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section id="privacy" className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Privacy is Our Priority</h2>
          <p className="text-xl text-gray-600 mb-8">
            Unlike other online PDF editors, AtomicPDF processes everything locally in your browser. 
            Your documents are never uploaded to our servers or stored in the cloud.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="flex items-start">
              <div className="w-6 h-6 text-green-600 mr-3 mt-1">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">No File Uploads</h3>
                <p className="text-gray-600">Files never leave your device</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 text-green-600 mr-3 mt-1">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">No Data Collection</h3>
                <p className="text-gray-600">We don't track or store your data</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 text-green-600 mr-3 mt-1">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Open Source</h3>
                <p className="text-gray-600">Transparent and auditable code</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Edit Your PDFs?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust AtomicPDF for secure, professional PDF editing.
          </p>
          <Link
            to="/editor"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            Start Editing Now - It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 mr-2">
                <svg viewBox="0 0 32 32" className="w-full h-full">
                  <rect x="6" y="4" width="18" height="24" rx="2" ry="2" fill="#ffffff" stroke="#3b82f6" strokeWidth="1.5"/>
                  <path d="M20 4 L24 8 L20 8 Z" fill="#e5e7eb" stroke="#3b82f6" strokeWidth="1"/>
                  <text x="15" y="14" fontFamily="Arial, sans-serif" fontSize="4" fontWeight="bold" textAnchor="middle" fill="#dc2626">PDF</text>
                  <circle cx="19" cy="22" r="2.5" fill="none" stroke="#3b82f6" strokeWidth="0.8"/>
                  <circle cx="19" cy="22" r="0.8" fill="#3b82f6"/>
                </svg>
              </div>
              <span className="text-xl font-bold">AtomicPDF</span>
            </div>
            <div className="text-gray-400">
              <p>&copy; 2024 AtomicPDF. Built with privacy in mind.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 