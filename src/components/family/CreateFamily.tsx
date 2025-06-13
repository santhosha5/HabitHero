import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { ensureUserProfile, updateUserFamilyId } from '../../utils/userProfileUtils';

export default function CreateFamily() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [familyName, setFamilyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Ensure user profile exists when component mounts
  useEffect(() => {
    if (user) {
      ensureUserProfile().catch(error => {
        console.error('Error ensuring user profile:', error);
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsLoading(true);

    try {
      // Generate a random 6-character invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create the family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert([{
          name: familyName,
          invite_code: inviteCode,
          created_by: user.id
        }])
        .select()
        .single();

      if (familyError) throw familyError;

      // Update the user's family_id using the utility function
      await updateUserFamilyId(family.id);

      toast.success('Family created successfully!');
      navigate('/family');
    } catch (error: any) {
      console.error('Error creating family:', error);
      toast.error(error.message || 'Failed to create family');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Create Family</h1>
      
      <div className="mt-8 max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="familyName" className="block text-sm font-medium text-gray-700">
              Family Name
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="familyName"
                id="familyName"
                required
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter your family name"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/family')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Family'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 