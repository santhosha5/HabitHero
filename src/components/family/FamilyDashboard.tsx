import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon, 
  CalendarDaysIcon, 
  ShareIcon, 
  ClipboardDocumentCheckIcon, 
  PaperAirplaneIcon,
  UserPlusIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { 
  familyService, 
  FamilyMember, 
  FamilyDetails, 
  FamilyActivity, 
  FamilyCalendarEvent 
} from '../../services/familyService';

export default function FamilyDashboard() {
  const { user } = useAuth();
  const { subscribeToFamilyActivity, subscribeToFamily } = useRealtime();
  const navigate = useNavigate();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyDetails, setFamilyDetails] = useState<FamilyDetails | null>(null);
  const [familyActivities, setFamilyActivities] = useState<FamilyActivity[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<FamilyCalendarEvent[]>([]);
  const [habitSuggestions, setHabitSuggestions] = useState<string[]>([]);
  const [inviteLink, setInviteLink] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const isUpdatingRef = useRef(false);
  
  // Selected tab management
  const [selectedTab, setSelectedTab] = useState(0);
  const tabOptions = ['Overview', 'Members', 'Calendar', 'Activity'];

  const hasFamily = !!familyDetails;
  
  // Generate calendar date range
  const calendarDates = useMemo(() => {
    const dates = [];
    const startDate = new Date(selectedDate);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }, [selectedDate]);

  // Load family data
  useEffect(() => {
    const loadFamilyData = async () => {
      if (!user?.id) return;

      try {
        // Get family details
        const details = await familyService.getFamilyDetails(user.id);
        setFamilyDetails(details);
        
        if (!details) {
          setIsLoading(false);
          return;
        }
        
        // Get family members
        const members = await familyService.getFamilyMembers(user.id);
        setFamilyMembers(members);
        
        // Get family activities
        const activities = await familyService.getFamilyActivity(user.id);
        setFamilyActivities(activities);
        
        // Get habit suggestions
        const suggestions = await familyService.getFamilyHabitSuggestions(user.id);
        setHabitSuggestions(suggestions);
        
        // Get invite link
        const link = await familyService.getInviteLink(user.id);
        if (link) setInviteLink(link);
        
      } catch (error: any) {
        console.error('Error loading family data:', error);
        toast.error('Failed to load family data');
      } finally {
        setIsLoading(false);
      }
    };

    loadFamilyData();
  }, [user?.id]);
  
  // Set up real-time subscriptions when family details are loaded
  useEffect(() => {
    let isSubscribed = true;
    const subscriptions: (() => void)[] = [];

    const setupSubscriptions = async () => {
      if (!user?.id || !familyDetails?.id) return;

      const familyId = familyDetails.id;

      // Subscribe to family activity updates
      const activityUnsubscribe = subscribeToFamilyActivity(
        familyId,
        (payload) => {
          if (!isSubscribed) return;
          
          if (payload.eventType === 'INSERT') {
            const newActivity = payload.new;
            setFamilyActivities(prev => {
              const updated = [newActivity, ...prev].slice(0, 50);
              return updated;
            });
          }
        }
      );
      subscriptions.push(activityUnsubscribe);

      // Subscribe to family details updates
      const familyUnsubscribe = subscribeToFamily(
        familyId,
        async (payload) => {
          if (!isSubscribed) return;
          
          if (payload.eventType === 'UPDATE' && !isUpdatingRef.current) {
            try {
              isUpdatingRef.current = true;
              const updatedDetails = await familyService.getFamilyDetails(user.id);
              
              if (!isSubscribed) return;
              
              if (updatedDetails) {
                setFamilyDetails(prev => {
                  if (JSON.stringify(prev) === JSON.stringify(updatedDetails)) {
                    return prev;
                  }
                  return updatedDetails;
                });

                // Only update members if the count changed
                if (updatedDetails.member_count !== familyDetails.member_count) {
                  const members = await familyService.getFamilyMembers(user.id);
                  if (isSubscribed) {
                    setFamilyMembers(members);
                  }
                }
              }
            } finally {
              isUpdatingRef.current = false;
            }
          }
        }
      );
      subscriptions.push(familyUnsubscribe);
    };

    setupSubscriptions();

    // Cleanup function
    return () => {
      isSubscribed = false;
      subscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [user?.id, familyDetails?.id, familyDetails?.member_count, subscribeToFamilyActivity, subscribeToFamily]);
  
  // Load calendar data when the selected date changes
  useEffect(() => {
    const loadCalendarData = async () => {
      if (!user?.id || !hasFamily) return;
      
      setIsLoadingCalendar(true);
      
      try {
        const startDateStr = calendarDates[0].toISOString().split('T')[0];
        const endDateStr = calendarDates[6].toISOString().split('T')[0];
        
        const events = await familyService.getFamilyCalendar(
          user.id,
          startDateStr,
          endDateStr
        );
        
        setCalendarEvents(events);
      } catch (error: any) {
        console.error('Error loading calendar data:', error);
        toast.error('Failed to load calendar data');
      } finally {
        setIsLoadingCalendar(false);
      }
    };
    
    if (selectedTab === 2) { // Calendar tab
      loadCalendarData();
    }
  }, [user?.id, hasFamily, selectedTab, calendarDates]);

  // Handle invite sharing
  const handleShareInvite = async () => {
    if (!recipientEmail || !user?.id || !familyDetails) {
      toast.error('Please wait for family data to load');
      return;
    }
    
    setIsSharing(true);
    
    try {
      await familyService.shareInviteByEmail(user.id, recipientEmail, familyDetails);
      toast.success(`Invitation sent to ${recipientEmail}`);
      setRecipientEmail('');
    } catch (error: any) {
      console.error('Error sharing invite:', error);
      toast.error('Failed to send invitation');
    } finally {
      setIsSharing(false);
    }
  };
  
  // Copy invite link to clipboard
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
      .then(() => toast.success('Invite link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy invite link'));
  };
  
  // Navigate week in calendar
  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setSelectedDate(newDate);
  };
  
  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarEvents.filter(event => event.scheduled_date === dateStr);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasFamily) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900">Family Dashboard</h1>
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">You haven't joined a family yet.</p>
          <div className="mt-4 space-x-4">
            <button
              onClick={() => navigate('/family/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Create Family
            </button>
            <button
              onClick={() => navigate('/family/join')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Join Family
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {familyDetails?.name || 'Family'} Dashboard
        </h1>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <div className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
            {familyDetails?.member_count || 0} members
          </div>
          
          <div className="relative inline-block">
            <button
              onClick={copyInviteLink}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <ShareIcon className="h-5 w-5 mr-2" />
              Share Invite
            </button>
          </div>
        </div>
      </div>
      
      {/* Invite section */}
      <div className="mb-8 bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 bg-primary-50 border-b border-primary-100">
          <h2 className="text-lg font-medium text-primary-800">Invite Family Members</h2>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Code
            </label>
            <div className="flex">
              <input
                type="text"
                readOnly
                value={familyDetails?.invite_code || ''}
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <button
                onClick={copyInviteLink}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Copy Link
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Invitation
            </label>
            <div className="flex">
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <button
                onClick={handleShareInvite}
                disabled={isSharing || !recipientEmail}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                {isSharing ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-primary-50 p-1 mb-8">
          {tabOptions.map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 ${
                  selected
                    ? 'bg-white shadow text-primary-700'
                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-primary-600'
                }`
              }
            >
              {tab}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          {/* Overview Tab */}
          <Tab.Panel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Family habit suggestions */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-4 bg-primary-50 border-b border-primary-100">
                  <h2 className="text-lg font-medium text-primary-800 flex items-center">
                    <LightBulbIcon className="h-5 w-5 mr-2 text-primary-600" />
                    Family Habit Suggestions
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">
                    Popular habits in your family that you might want to try:
                  </p>
                  <ul className="space-y-3">
                    {habitSuggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-xs text-primary-600 mr-2">
                          {index + 1}
                        </span>
                        <span className="text-gray-800">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Recent family activity */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-4 bg-primary-50 border-b border-primary-100">
                  <h2 className="text-lg font-medium text-primary-800 flex items-center">
                    <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 text-primary-600" />
                    Recent Family Activity
                  </h2>
                </div>
                <div className="p-6">
                  {familyActivities.length > 0 ? (
                    <ul className="space-y-4">
                      {familyActivities.slice(0, 5).map((activity) => (
                        <li key={activity.id} className="border-b border-gray-100 pb-3">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-gray-900">{activity.user_name}</span>{' '}
                            {activity.activity_type === 'habit_completed' && 'completed'}
                            {activity.activity_type === 'streak_milestone' && 'reached a streak of'}
                            {activity.activity_type === 'joined_family' && 'joined the family'}
                            {activity.activity_type === 'medal_earned' && 'earned a medal'}{' '}
                            {activity.activity_type === 'habit_completed' && (
                              <span className="text-primary-700">
                                {activity.activity_data.habit_title}
                              </span>
                            )}
                            {activity.activity_type === 'streak_milestone' && (
                              <span className="text-primary-700">
                                {activity.activity_data.streak_count} days
                              </span>
                            )}
                            {activity.activity_type === 'medal_earned' && (
                              <span className="text-primary-700">
                                {activity.activity_data.medal_type}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No recent activity to show.</p>
                  )}
                </div>
              </div>
            </div>
          </Tab.Panel>
          
          {/* Members Tab */}
          <Tab.Panel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {familyMembers.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.full_name}
                          className="h-16 w-16 rounded-full"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 text-xl font-medium">
                            {member.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">{member.full_name || 'Anonymous'}</h3>
                        <p className="text-sm text-gray-500">{member.total_points} points</p>
                      </div>
                    </div>
                    
                    {/* Preferred habits */}
                    {member.preferred_habits && member.preferred_habits.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Preferred Habits</h4>
                        <ul className="space-y-1">
                          {member.preferred_habits.map((habit, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-center">
                              <span className="h-2 w-2 bg-primary-400 rounded-full mr-2"></span>
                              {habit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Tab.Panel>
          
          {/* Calendar Tab */}
          <Tab.Panel>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 bg-primary-50 border-b border-primary-100 flex justify-between items-center">
                <h2 className="text-lg font-medium text-primary-800 flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 mr-2 text-primary-600" />
                  Family Habit Calendar
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigateCalendar('prev')}
                    className="p-1 rounded-md hover:bg-gray-200"
                  >
                    &larr;
                  </button>
                  <span className="text-sm font-medium">
                    {calendarDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                    {calendarDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <button
                    onClick={() => navigateCalendar('next')}
                    className="p-1 rounded-md hover:bg-gray-200"
                  >
                    &rarr;
                  </button>
                </div>
              </div>
              <div className="p-4">
                {isLoadingCalendar ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {/* Day headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center font-medium text-gray-700 pb-2">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar days */}
                    {calendarDates.map((date) => {
                      const dateEvents = getEventsForDate(date);
                      const isToday = new Date().toDateString() === date.toDateString();
                      
                      return (
                        <div
                          key={date.toISOString()}
                          className={`border rounded-md p-2 min-h-[100px] ${
                            isToday ? 'bg-primary-50 border-primary-300' : ''
                          }`}
                        >
                          <div className="text-right text-sm text-gray-500 mb-1">
                            {date.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dateEvents.map((event) => (
                              <div
                                key={event.id}
                                className={`text-xs p-1 rounded truncate ${
                                  event.is_completed
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                                title={`${event.user_name}: ${event.habit_title}`}
                              >
                                <span className="font-medium">{event.user_name}</span>: {event.habit_title}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Tab.Panel>
          
          {/* Activity Tab */}
          <Tab.Panel>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 bg-primary-50 border-b border-primary-100">
                <h2 className="text-lg font-medium text-primary-800">Family Activity Feed</h2>
              </div>
              <div className="p-6">
                {familyActivities.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {familyActivities.map((activity) => (
                      <li key={activity.id} className="py-4">
                        <div className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 text-sm font-medium">
                                {activity.user_name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.user_name}
                              {activity.activity_type === 'habit_completed' && ' completed a habit'}
                              {activity.activity_type === 'streak_milestone' && ' reached a streak milestone'}
                              {activity.activity_type === 'joined_family' && ' joined the family'}
                              {activity.activity_type === 'medal_earned' && ' earned a medal'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {activity.activity_type === 'habit_completed' && (
                                <>Completed <span className="font-medium">{activity.activity_data.habit_title}</span></>
                              )}
                              {activity.activity_type === 'streak_milestone' && (
                                <>Reached a streak of <span className="font-medium">{activity.activity_data.streak_count}</span> days</>
                              )}
                              {activity.activity_type === 'medal_earned' && (
                                <>Earned a <span className="font-medium">{activity.activity_data.medal_type}</span> medal</>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No recent activity to show.</p>
                )}
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}