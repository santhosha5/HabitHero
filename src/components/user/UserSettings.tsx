import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import {
  UserCircleIcon,
  KeyIcon,
  BellIcon,
  CreditCardIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import PaymentMethodForm from '../rewards/PaymentMethodForm';
import { offlineService } from '../../services/offlineService';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function UserSettings() {
  const { user, signOut, resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    avatarUrl: '',
  });
  const [changePassword, setChangePassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    completionReminders: true,
    familyActivity: true,
    weeklyRecap: true,
    challenges: true,
  });
  const [privacySettings, setPrivacySettings] = useState({
    showStreaks: true,
    showPoints: true,
    showCompletions: true,
    allowFamilyToSeeHabits: true,
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
        avatarUrl: user.user_metadata?.avatar_url || '',
      });

      // Load notification settings
      loadNotificationSettings();
      
      // Load privacy settings
      loadPrivacySettings();
    }
  }, [user]);

  const loadNotificationSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('notification_settings')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error loading notification settings:', error);
        return;
      }
      
      if (data?.notification_settings) {
        setNotifications(data.notification_settings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };
  
  const loadPrivacySettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('privacy_settings')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error loading privacy settings:', error);
        return;
      }
      
      if (data?.privacy_settings) {
        setPrivacySettings(data.privacy_settings);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSavingProfile(true);
    
    try {
      let avatarUrl = profileData.avatarUrl;
      
      // Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            upsert: true,
          });
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        avatarUrl = publicUrl;
      }
      
      // Update user profile in Supabase
      await supabase.from('users').update({
        full_name: profileData.fullName,
        avatar_url: avatarUrl,
      }).eq('id', user.id);
      // Optionally update user_metadata in auth if needed
      await supabase.auth.updateUser({
        data: {
          full_name: profileData.fullName,
          avatar_url: avatarUrl,
        }
      });
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validate passwords
    if (changePassword.newPassword !== changePassword.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (changePassword.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsSavingPassword(true);
    
    try {
      // First verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: changePassword.currentPassword,
      });
      
      if (signInError) {
        throw new Error('Current password is incorrect');
      }
      
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: changePassword.newPassword,
      });
      
      if (updateError) throw updateError;
      
      toast.success('Password updated successfully');
      
      // Clear form
      setChangePassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleNotificationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSavingNotifications(true);
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notification_settings: notifications,
          updated_at: new Date().toISOString(),
        });
        
      if (error) throw error;
      
      toast.success('Notification settings saved');
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast.error(error.message || 'Failed to save notification settings');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handlePrivacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSavingPrivacy(true);
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          privacy_settings: privacySettings,
          updated_at: new Date().toISOString(),
        });
        
      if (error) throw error;
      
      toast.success('Privacy settings saved');
    } catch (error: any) {
      console.error('Error saving privacy settings:', error);
      toast.error(error.message || 'Failed to save privacy settings');
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      
      // Clear offline cache
      await offlineService.clearCache();
      
      // Sign out
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      if (!user?.email) {
        toast.error('No email address found');
        return;
      }
      
      await resetPassword(user.email);
      toast.success('Password reset email sent. Check your inbox.');
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast.error(error.message || 'Failed to send password reset email');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large. Maximum size is 2MB.');
      return;
    }
    
    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const categories = [
    {
      id: 'profile',
      name: 'Profile',
      icon: UserCircleIcon,
    },
    {
      id: 'security',
      name: 'Password',
      icon: KeyIcon,
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: BellIcon,
    },
    {
      id: 'payments',
      name: 'Payment Methods',
      icon: CreditCardIcon,
    },
    {
      id: 'privacy',
      name: 'Privacy',
      icon: ShieldCheckIcon,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>
      
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/10 p-1 overflow-x-auto">
          {categories.map((category) => (
            <Tab
              key={category.id}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'flex items-center justify-center',
                  'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-primary-700 shadow'
                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-primary-600'
                )
              }
            >
              <category.icon className="h-5 w-5 mr-2" />
              {category.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-6">
          {/* Profile Panel */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {(avatarPreview || profileData.avatarUrl) ? (
                    <img
                      src={avatarPreview || profileData.avatarUrl}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Picture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, GIF up to 2MB
                  </p>
                </div>
              </div>
              
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={profileData.email}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Contact support to change your email address
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Sign Out
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </Tab.Panel>

          {/* Security Panel */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Password Settings</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={changePassword.currentPassword}
                  onChange={(e) => setChangePassword({ ...changePassword, currentPassword: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={changePassword.newPassword}
                  onChange={(e) => setChangePassword({ ...changePassword, newPassword: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={changePassword.confirmPassword}
                  onChange={(e) => setChangePassword({ ...changePassword, confirmPassword: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Reset Password
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isSavingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </Tab.Panel>

          {/* Notifications Panel */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h2>
            <form onSubmit={handleNotificationsSubmit} className="space-y-6">
              <fieldset>
                <legend className="text-sm font-medium text-gray-700">Email Notifications</legend>
                <div className="mt-2 space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="emailNotifications"
                        type="checkbox"
                        checked={notifications.emailNotifications}
                        onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="emailNotifications" className="font-medium text-gray-700">Email Notifications</label>
                      <p className="text-gray-500">Receive emails about your account activity and habit progress</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="completionReminders"
                        type="checkbox"
                        checked={notifications.completionReminders}
                        onChange={(e) => setNotifications({ ...notifications, completionReminders: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="completionReminders" className="font-medium text-gray-700">Habit Reminders</label>
                      <p className="text-gray-500">Receive reminders to complete your habits</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="familyActivity"
                        type="checkbox"
                        checked={notifications.familyActivity}
                        onChange={(e) => setNotifications({ ...notifications, familyActivity: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="familyActivity" className="font-medium text-gray-700">Family Activity</label>
                      <p className="text-gray-500">Get notified when family members complete habits or reach milestones</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="weeklyRecap"
                        type="checkbox"
                        checked={notifications.weeklyRecap}
                        onChange={(e) => setNotifications({ ...notifications, weeklyRecap: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="weeklyRecap" className="font-medium text-gray-700">Weekly Recap</label>
                      <p className="text-gray-500">Receive a weekly summary of your habit progress</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="challenges"
                        type="checkbox"
                        checked={notifications.challenges}
                        onChange={(e) => setNotifications({ ...notifications, challenges: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="challenges" className="font-medium text-gray-700">Family Challenges</label>
                      <p className="text-gray-500">Get notified about new challenges and updates</p>
                    </div>
                  </div>
                </div>
              </fieldset>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingNotifications}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isSavingNotifications ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          </Tab.Panel>

          {/* Payment Methods Panel */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h2>
            <PaymentMethodForm />
          </Tab.Panel>

          {/* Privacy Panel */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h2>
            <form onSubmit={handlePrivacySubmit} className="space-y-6">
              <fieldset>
                <legend className="text-sm font-medium text-gray-700">Family Visibility</legend>
                <div className="mt-2 space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="showStreaks"
                        type="checkbox"
                        checked={privacySettings.showStreaks}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, showStreaks: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="showStreaks" className="font-medium text-gray-700">Show Streaks to Family</label>
                      <p className="text-gray-500">Allow family members to see your habit streaks</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="showPoints"
                        type="checkbox"
                        checked={privacySettings.showPoints}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, showPoints: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="showPoints" className="font-medium text-gray-700">Show Points to Family</label>
                      <p className="text-gray-500">Allow family members to see your point totals</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="showCompletions"
                        type="checkbox"
                        checked={privacySettings.showCompletions}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, showCompletions: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="showCompletions" className="font-medium text-gray-700">Show Completions in Activity Feed</label>
                      <p className="text-gray-500">Allow your habit completions to show in the family activity feed</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="allowFamilyToSeeHabits"
                        type="checkbox"
                        checked={privacySettings.allowFamilyToSeeHabits}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, allowFamilyToSeeHabits: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="allowFamilyToSeeHabits" className="font-medium text-gray-700">Share Habits with Family</label>
                      <p className="text-gray-500">Allow family members to see your habit list</p>
                    </div>
                  </div>
                </div>
              </fieldset>

              <div className="pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Data Management</h3>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => offlineService.sync()}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Sync Offline Data
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingPrivacy}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isSavingPrivacy ? 'Saving...' : 'Save Privacy Settings'}
                </button>
              </div>
            </form>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}