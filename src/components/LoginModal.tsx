import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PRICING_PLANS } from '../lib/stripe';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  title = "Sign in to Continue",
  message = "Create an account or sign in to export your PDF and access all features."
}) => {
  const { user, signInWithGoogle, loading } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Modal will close automatically when auth state changes
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  // Close modal when user signs in
  React.useEffect(() => {
    if (isOpen && user) {
      onClose();
    }
  }, [user, isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
              <p className="text-gray-600">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Login Section */}
            <div>
              <div className="space-y-6">
                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? 'Signing in...' : 'Continue with Google'}
                </button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-blue-900">100% Private</h3>
                  </div>
                  <p className="text-sm text-blue-800">
                    Your PDF files are processed locally in your browser. We never see or store your documents.
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Start with 3 FREE PDFs • No credit card required
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing Preview */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Choose Your Plan</h3>
              <div className="space-y-3">
                {/* Free Plan */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">Free</h4>
                      <p className="text-xs text-gray-600">Perfect for trying out</p>
                    </div>
                    <div className="text-xl font-bold text-gray-900">$0</div>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-600">
                    <li className="flex items-center">
                      <svg className="w-3 h-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      3 PDFs per month
                    </li>
                    <li className="flex items-center">
                      <svg className="w-3 h-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Basic editing tools
                    </li>
                  </ul>
                </div>

                {/* Paid Plan */}
                <div
                  className="bg-white rounded-lg border p-4 border-blue-500 ring-1 ring-blue-200"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-semibold text-gray-900">Pro</h4>
                        <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                          Best Value
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">One-time payment</p>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      $0.99
                      <span className="text-sm font-normal text-gray-500">/one-time</span>
                    </div>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-600">
                    <li className="flex items-center">
                      <svg className="w-3 h-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Unlimited usage
                    </li>
                    <li className="flex items-center">
                      <svg className="w-3 h-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      All Pro features
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">100% Private</h4>
                <p className="text-xs text-gray-600">Your documents never leave your browser.</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Lightning Fast</h4>
                <p className="text-xs text-gray-600">Process PDFs instantly with local browser technology.</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Professional Tools</h4>
                <p className="text-xs text-gray-600">Full-featured PDF editing with annotations and more.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 