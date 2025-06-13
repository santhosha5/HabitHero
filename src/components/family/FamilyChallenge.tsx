import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  PlusCircleIcon, 
  TrophyIcon, 
  FireIcon, 
  CalendarDaysIcon,
  UsersIcon,
  ClockIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { challengeService, FamilyChallenge, ChallengeParticipant } from '../../services/challengeService';

export default function FamilyChallenges() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<FamilyChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<FamilyChallenge | null>(null);
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    if (!user?.id || !user?.user_metadata?.family_id) return;
    
    const loadChallenges = async () => {
      setIsLoading(true);
      try {
        const familyChallenges = await challengeService.getFamilyChallenges(user.user_metadata?.family_id || '');
        setChallenges(familyChallenges);
      } catch (error) {
        console.error('Error loading challenges:', error);
        toast.error('Failed to load family challenges');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChallenges();
  }, [user?.id, user?.user_metadata?.family_id]);

  const handleCreateChallenge = () => {
    setShowCreateModal(true);
  };

  const handleViewChallengeDetails = async (challenge: FamilyChallenge) => {
    setSelectedChallenge(challenge);
    
    try {
      const challengeParticipants = await challengeService.getChallengeParticipants(challenge.id);
      setParticipants(challengeParticipants);
      
      // Check if current user is participating
      setIsParticipant(challengeParticipants.some(p => p.user_id === user?.id));
      
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading challenge participants:', error);
      toast.error('Failed to load challenge details');
    }
  };

  const handleJoinChallenge = async () => {
    if (!user?.id || !selectedChallenge) return;
    
    try {
      await challengeService.joinChallenge(selectedChallenge.id, user.id);
      toast.success('Successfully joined the challenge!');
      
      // Refresh participants
      const updatedParticipants = await challengeService.getChallengeParticipants(selectedChallenge.id);
      setParticipants(updatedParticipants);
      setIsParticipant(true);
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error('Failed to join challenge');
    }
  };

  const getChallengeStatusColor = (challenge: FamilyChallenge) => {
    switch (challenge.status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChallengeTypeIcon = (challenge: FamilyChallenge) => {
    switch (challenge.challenge_type) {
      case 'streak':
        return <FireIcon className="h-5 w-5 text-orange-500" />;
      case 'points':
        return <TrophyIcon className="h-5 w-5 text-yellow-500" />;
      case 'completion':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'custom':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <TrophyIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getTimeRemaining = (endDate: string) => {
    const end = parseISO(endDate);
    const now = new Date();
    
    if (isBefore(end, now)) {
      return 'Challenge ended';
    }
    
    const diffTime = Math.abs(end.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
  };

  const isChallengePast = (challenge: FamilyChallenge) => {
    return isAfter(new Date(), parseISO(challenge.end_date));
  };

  const isChallengeFuture = (challenge: FamilyChallenge) => {
    return isBefore(new Date(), parseISO(challenge.start_date));
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Family Challenges</h2>
        <button
          onClick={handleCreateChallenge}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" />
          New Challenge
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        </div>
      ) : challenges.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <TrophyIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No challenges yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Create a challenge to motivate your family to build better habits together!
          </p>
          <button
            onClick={handleCreateChallenge}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Create Your First Challenge
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Challenges */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Active Challenges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges
                .filter(c => c.status === 'active')
                .map(challenge => (
                  <motion.div
                    key={challenge.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white shadow rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleViewChallengeDetails(challenge)}
                  >
                    <div className="p-5">
                      <div className="flex justify-between">
                        <div className="flex items-center space-x-2">
                          {getChallengeTypeIcon(challenge)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getChallengeStatusColor(challenge)}`}>
                            {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {getTimeRemaining(challenge.end_date)}
                        </span>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mt-2">{challenge.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{challenge.description}</p>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <UsersIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {/* We don't have participant count available directly */}
                            0 participants
                          </span>
                        </div>
                        <span className="inline-flex items-center text-xs font-medium text-primary-600">
                          View Details <ArrowRightIcon className="ml-1 h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              {challenges.filter(c => c.status === 'active').length === 0 && (
                <div className="col-span-2 bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-500">No active challenges at the moment.</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Challenges */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Upcoming Challenges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges
                .filter(c => c.status === 'upcoming')
                .map(challenge => (
                  <motion.div
                    key={challenge.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white shadow rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleViewChallengeDetails(challenge)}
                  >
                    <div className="p-5">
                      <div className="flex justify-between">
                        <div className="flex items-center space-x-2">
                          {getChallengeTypeIcon(challenge)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getChallengeStatusColor(challenge)}`}>
                            {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Starts in {Math.ceil((parseISO(challenge.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mt-2">{challenge.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{challenge.description}</p>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <UsersIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            0 participants
                          </span>
                        </div>
                        <span className="inline-flex items-center text-xs font-medium text-primary-600">
                          View Details <ArrowRightIcon className="ml-1 h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              {challenges.filter(c => c.status === 'upcoming').length === 0 && (
                <div className="col-span-2 bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-500">No upcoming challenges scheduled.</p>
                </div>
              )}
            </div>
          </div>

          {/* Past Challenges */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Past Challenges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges
                .filter(c => c.status === 'completed' || isChallengePast(c))
                .slice(0, 4) // Show only recent 4
                .map(challenge => (
                  <motion.div
                    key={challenge.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white shadow rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow opacity-80"
                    onClick={() => handleViewChallengeDetails(challenge)}
                  >
                    <div className="p-5">
                      <div className="flex justify-between">
                        <div className="flex items-center space-x-2">
                          {getChallengeTypeIcon(challenge)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getChallengeStatusColor(challenge)}`}>
                            {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Ended {Math.ceil((new Date().getTime() - parseISO(challenge.end_date).getTime()) / (1000 * 60 * 60 * 24))} days ago
                        </span>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mt-2">{challenge.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{challenge.description}</p>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <UsersIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {participants.length || '0'} participants
                          </span>
                        </div>
                        <span className="inline-flex items-center text-xs font-medium text-primary-600">
                          View Results <ArrowRightIcon className="ml-1 h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              {challenges.filter(c => c.status === 'completed' || isChallengePast(c)).length === 0 && (
                <div className="col-span-2 bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-500">No past challenges found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Challenge Details Modal */}
      {showDetailsModal && selectedChallenge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    {getChallengeTypeIcon(selectedChallenge)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getChallengeStatusColor(selectedChallenge)}`}>
                      {selectedChallenge.status.charAt(0).toUpperCase() + selectedChallenge.status.slice(1)}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedChallenge.title}</h2>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mt-4">
                <p className="text-gray-600">{selectedChallenge.description}</p>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Start Date</div>
                    <div className="font-medium">{format(parseISO(selectedChallenge.start_date), 'MMM d, yyyy')}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">End Date</div>
                    <div className="font-medium">{format(parseISO(selectedChallenge.end_date), 'MMM d, yyyy')}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Challenge Type</div>
                    <div className="font-medium capitalize">{selectedChallenge.challenge_type}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Target</div>
                    <div className="font-medium">{selectedChallenge.target_value} {selectedChallenge.challenge_type === 'streak' ? 'days' : selectedChallenge.challenge_type === 'points' ? 'points' : 'completions'}</div>
                  </div>
                </div>
                
                {selectedChallenge.reward_description && (
                  <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <TrophyIcon className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
                      <div>
                        <div className="font-medium text-yellow-800">Reward</div>
                        <p className="text-yellow-700 text-sm">{selectedChallenge.reward_description}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Participants ({participants.length})</h3>
                  {participants.length === 0 ? (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No one has joined this challenge yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {participants.map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                              {participant.user?.avatar_url ? (
                                <img src={participant.user.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full" />
                              ) : (
                                <UsersIcon className="h-4 w-4 text-primary-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{participant.user?.full_name || 'User'}</div>
                              <div className="text-xs text-gray-500">Joined {format(parseISO(participant.joined_at), 'MMM d')}</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="mr-3">
                              <div className="text-xs text-gray-500">Progress</div>
                              <div className="font-medium">{Math.round((participant.current_progress / selectedChallenge.target_value) * 100)}%</div>
                            </div>
                            <div className="w-24 bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-primary-600 h-2.5 rounded-full" 
                                style={{ width: `${Math.min(100, Math.round((participant.current_progress / selectedChallenge.target_value) * 100))}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-between">
                {selectedChallenge.created_by === user?.id && (
                  <button
                    onClick={() => {
                      // Handle edit challenge
                      setShowDetailsModal(false);
                      // Navigate to edit view
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Edit Challenge
                  </button>
                )}
                
                {selectedChallenge.status === 'active' && !isParticipant && (
                  <button
                    onClick={handleJoinChallenge}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Join Challenge
                  </button>
                )}
                
                {isParticipant && (
                  <button
                    onClick={() => {
                      // Handle view personal progress
                      setShowDetailsModal(false);
                      // Navigate to progress view
                    }}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    View My Progress
                  </button>
                )}
                
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <CreateChallengeModal 
          familyId={user?.user_metadata?.family_id || ''}
          userId={user?.id || ''}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newChallenge) => {
            setChallenges([newChallenge, ...challenges]);
            setShowCreateModal(false);
            toast.success('Challenge created successfully!');
          }}
        />
      )}
    </div>
  );
}

interface CreateChallengeModalProps {
  familyId: string;
  userId: string;
  onClose: () => void;
  onSuccess: (challenge: FamilyChallenge) => void;
}

function CreateChallengeModal({ familyId, userId, onClose, onSuccess }: CreateChallengeModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 1 week from now
    challengeType: 'streak',
    targetValue: 7,
    rewardDescription: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!familyId || !userId) {
      toast.error('Family information is missing');
      return;
    }
    
    // Validate form
    const newErrors: {[key: string]: string} = {};
    
    if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    
    if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (endDate <= startDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    if (formData.targetValue <= 0) {
      newErrors.targetValue = 'Target value must be greater than 0';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const challenge = await challengeService.createChallenge({
        family_id: familyId,
        title: formData.title,
        description: formData.description,
        start_date: new Date(formData.startDate).toISOString(),
        end_date: new Date(formData.endDate).toISOString(),
        created_by: userId,
        status: new Date(formData.startDate) <= new Date() ? 'active' : 'upcoming',
        challenge_type: formData.challengeType as any,
        target_value: Number(formData.targetValue),
        reward_description: formData.rewardDescription,
      });
      
      onSuccess(challenge);
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Failed to create challenge');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-gray-900">Create New Family Challenge</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Challenge Title
              </label>
              <input
                type="text"
                id="title"
                required
                className={`mt-1 block w-full rounded-md ${errors.title ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-primary-500 focus:ring-primary-500`}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., 7-Day Meditation Challenge"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                required
                rows={3}
                className={`mt-1 block w-full rounded-md ${errors.description ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-primary-500 focus:ring-primary-500`}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the challenge and its purpose..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  required
                  className={`mt-1 block w-full rounded-md ${errors.endDate ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-primary-500 focus:ring-primary-500`}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="challengeType" className="block text-sm font-medium text-gray-700">
                  Challenge Type
                </label>
                <select
                  id="challengeType"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={formData.challengeType}
                  onChange={(e) => setFormData({ ...formData, challengeType: e.target.value })}
                >
                  <option value="streak">Streak Challenge</option>
                  <option value="points">Points Challenge</option>
                  <option value="completion">Completion Challenge</option>
                  <option value="custom">Custom Challenge</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {formData.challengeType === 'streak' ? 'Complete habits for consecutive days' :
                   formData.challengeType === 'points' ? 'Earn a target number of points' :
                   formData.challengeType === 'completion' ? 'Complete habits a specific number of times' :
                   'Custom challenge with manual tracking'}
                </p>
              </div>
              
              <div>
                <label htmlFor="targetValue" className="block text-sm font-medium text-gray-700">
                  Target {formData.challengeType === 'streak' ? 'Days' : 
                         formData.challengeType === 'points' ? 'Points' : 
                         formData.challengeType === 'completion' ? 'Completions' : 'Value'}
                </label>
                <input
                  type="number"
                  id="targetValue"
                  required
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: parseInt(e.target.value) || 0 })}
                />
                {errors.targetValue && (
                  <p className="mt-1 text-sm text-red-600">{errors.targetValue}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="rewardDescription" className="block text-sm font-medium text-gray-700">
                Reward (Optional)
              </label>
              <textarea
                id="rewardDescription"
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.rewardDescription}
                onChange={(e) => setFormData({ ...formData, rewardDescription: e.target.value })}
                placeholder="Describe the reward for completing this challenge..."
              />
              <p className="mt-1 text-sm text-gray-500">
                What will participants receive or earn for completing this challenge?
              </p>
            </div>
            
            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Challenge'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}