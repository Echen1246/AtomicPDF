import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SUBSCRIPTION_LIMITS } from '../lib/supabase';
import SubscriptionPlans from './SubscriptionPlans';
import toast from 'react-hot-toast';

const UserProfile: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);

  if (!user || !profile) {
    return null;
  }

  const currentLimits = SUBSCRIPTION_LIMITS[profile.subscription_tier];
  const usagePercentage = currentLimits.pdfs_per_month === -1 
    ? 0 
    : (profile.pdf_count_used / currentLimits.pdfs_per_month) * 100;

  const handleManageSubscription = () => {
    if (profile.subscription_tier === 'free') {
      setShowSubscriptionPlans(true);
    } else {
      // For existing subscribers, show the subscription management
      setShowSubscriptionPlans(true);
    }
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=3b82f6&color=fff`}
              alt={profile.full_name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="text-sm font-medium text-gray-900">{profile.full_name}</h3>
              <p className="text-xs text-gray-500 capitalize">
                {profile.subscription_tier} Plan
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign Out
          </button>
        </div>

        {/* Usage Indicator */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>PDFs This Month</span>
            <span>
              {profile.pdf_count_used} / {currentLimits.pdfs_per_month === -1 ? '∞' : currentLimits.pdfs_per_month}
            </span>
          </div>
          {currentLimits.pdfs_per_month !== -1 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  usagePercentage >= 90 ? 'bg-red-500' : 
                  usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          <button
            onClick={handleManageSubscription}
            className="w-full bg-blue-600 text-white text-sm py-2 px-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            {profile.subscription_tier === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
          </button>

          {profile.subscription_tier === 'free' && usagePercentage >= 90 && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-xs text-amber-800">
                ⚠️ You're running low on PDFs. Upgrade to continue editing.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Plans Modal */}
      {showSubscriptionPlans && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Subscription Plans</h2>
              <button
                onClick={() => setShowSubscriptionPlans(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SubscriptionPlans 
              onClose={() => setShowSubscriptionPlans(false)}
              showCurrentPlan={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfile; 