import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SUBSCRIPTION_LIMITS } from '../lib/supabase';
import LoginModal from './LoginModal';
import UserProfile from './UserProfile';
import { Link } from 'react-router-dom';

const EditorHeader: React.FC = () => {
  const { user, profile, signInWithGoogle, loading, refreshProfile } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  // Show header immediately with whatever data we have
  // Don't wait for profile - user data is enough

  // Not authenticated - show login/signup buttons
  if (!user) {
    return (
      <>
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8">
                <svg viewBox="0 0 32 32" className="w-full h-full">
                  <rect x="6" y="4" width="18" height="24" rx="2" ry="2" fill="#ffffff" stroke="#3b82f6" strokeWidth="1.5"/>
                  <path d="M20 4 L24 8 L20 8 Z" fill="#e5e7eb" stroke="#3b82f6" strokeWidth="1"/>
                  <text x="15" y="14" fontFamily="Arial, sans-serif" fontSize="4" fontWeight="bold" textAnchor="middle" fill="#dc2626">PDF</text>
                  <circle cx="19" cy="22" r="2.5" fill="none" stroke="#3b82f6" strokeWidth="0.8"/>
                  <circle cx="19" cy="22" r="0.8" fill="#3b82f6"/>
                </svg>
              </div>
              <h1 className="text-lg font-bold text-gray-900">AtomicPDF</h1>
            </Link>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign Up Free
              </button>
            </div>
          </div>
        </div>

        <LoginModal 
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="Get Started with AtomicPDF"
          message="Create a free account to export your PDFs and access all features. No credit card required."
        />
      </>
    );
  }

  // Authenticated - show user info (with or without profile)
  if (user) {
    // Use profile data if available, otherwise use defaults
    const displayProfile = profile || {
      email: user.email!,
      full_name: user.user_metadata?.full_name || user.email!.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url,
      subscription_tier: 'free',
      subscription_status: 'active',
      pdf_count_used: 0
    };
    
    const currentLimits = SUBSCRIPTION_LIMITS[displayProfile.subscription_tier as keyof typeof SUBSCRIPTION_LIMITS];
    const usagePercentage = currentLimits.pdfs_per_month === -1 
      ? 0 
      : (displayProfile.pdf_count_used / currentLimits.pdfs_per_month) * 100;

    return (
      <>
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8">
                <svg viewBox="0 0 32 32" className="w-full h-full">
                  <rect x="6" y="4" width="18" height="24" rx="2" ry="2" fill="#ffffff" stroke="#3b82f6" strokeWidth="1.5"/>
                  <path d="M20 4 L24 8 L20 8 Z" fill="#e5e7eb" stroke="#3b82f6" strokeWidth="1"/>
                  <text x="15" y="14" fontFamily="Arial, sans-serif" fontSize="4" fontWeight="bold" textAnchor="middle" fill="#dc2626">PDF</text>
                  <circle cx="19" cy="22" r="2.5" fill="none" stroke="#3b82f6" strokeWidth="0.8"/>
                  <circle cx="19" cy="22" r="0.8" fill="#3b82f6"/>
                </svg>
              </div>
              <h1 className="text-lg font-bold text-gray-900">AtomicPDF</h1>
            </Link>
            
            <div className="flex items-center space-x-3">
              {/* Usage indicator */}
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs text-gray-600">
                  {displayProfile.pdf_count_used} / {currentLimits.pdfs_per_month === -1 ? '∞' : currentLimits.pdfs_per_month} PDFs
                </span>
                {currentLimits.pdfs_per_month !== -1 && (
                  <div className="w-20 bg-gray-200 rounded-full h-1 mt-1">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        usagePercentage >= 90 ? 'bg-red-500' : 
                        usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {/* Upgrade button for free users */}
              {displayProfile.subscription_tier === 'free' && (
                <button
                  onClick={() => setShowUserProfile(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm px-4 py-2 rounded-md hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-sm"
                >
                  Upgrade
                </button>
              )}

              {/* User profile button */}
              <button
                onClick={() => setShowUserProfile(true)}
                className="flex items-center space-x-2 hover:bg-gray-50 rounded-md p-2 transition-colors"
              >
                <img
                  src={displayProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayProfile.full_name)}&background=3b82f6&color=fff`}
                  alt={displayProfile.full_name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{displayProfile.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{displayProfile.subscription_tier}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* User Profile Modal/Dropdown */}
        {showUserProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="relative">
                <button
                  onClick={() => setShowUserProfile(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <UserProfile />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export default EditorHeader; 