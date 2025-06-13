import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { rewardsService } from '../../services/rewardsService';
import { WeeklyPool } from '../../types/rewards';
import { CurrencyDollarIcon, UserGroupIcon, TrophyIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Props {
  familyId: string;
}

export default function WeeklyPoolTracker({ familyId }: Props) {
  const { user } = useAuth();
  const [pool, setPool] = useState<WeeklyPool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isContributing, setIsContributing] = useState(false);

  useEffect(() => {
    loadPool();
  }, [familyId]);

  const loadPool = async () => {
    try {
      const currentPool = await rewardsService.getCurrentWeeklyPool(familyId);
      setPool(currentPool);
    } catch (error) {
      console.error('Error loading weekly pool:', error);
      toast.error('Failed to load weekly pool');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContribute = async () => {
    if (!user || !familyId || isContributing) return;
    
    setIsContributing(true);
    try {
      await rewardsService.contributeToPool(user.id, familyId, 2); // $2 weekly contribution
      toast.success('Successfully contributed to weekly pool!');
      loadPool(); // Reload pool data
    } catch (error) {
      console.error('Error contributing to pool:', error);
      toast.error('Failed to contribute to pool');
    } finally {
      setIsContributing(false);
    }
  };

  const getTimeRemaining = () => {
    if (!pool) return { days: 0, hours: 0, minutes: 0 };
    
    const end = new Date(pool.week_end);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    };
  };

  const hasContributed = pool?.participants.includes(user?.id || '');
  const remaining = getTimeRemaining();
  const canContribute = !hasContributed && pool?.status === 'active';

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 text-white">
        <h2 className="text-xl font-bold flex items-center mb-2">
          <CurrencyDollarIcon className="h-6 w-6 mr-2" />
          Weekly Money Pool
        </h2>
        <p className="text-green-100">Compete with family members for the weekly prize!</p>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center">
            <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : !pool ? (
          <div className="text-center text-gray-500">
            <p>No active pool this week.</p>
            {user && (
              <button
                onClick={handleContribute}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Start Pool ($2)
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">Current Pool</div>
                <div className="text-2xl font-bold text-gray-900">${pool.total_amount.toFixed(2)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">Participants</div>
                <div className="text-2xl font-bold text-gray-900">{pool.participants.length}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">Time Remaining</div>
                <div className="text-2xl font-bold text-gray-900">
                  {remaining.days}d {remaining.hours}h {remaining.minutes}m
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {pool.winners.length > 0 ? (
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <TrophyIcon className="h-5 w-5 mr-2 text-yellow-500" />
                    Winners
                  </h3>
                  <div className="space-y-2">
                    {pool.winners.map((winner: WeeklyPool['winners'][number]) => (
                      <div key={winner.user_id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                            {winner.rank}
                          </div>
                          <div>{winner.user_id}</div>
                        </div>
                        <div className="font-medium">${winner.payout_amount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  {canContribute ? (
                    <button
                      onClick={handleContribute}
                      disabled={isContributing}
                      className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isContributing ? 'Contributing...' : 'Contribute $2'}
                    </button>
                  ) : (
                    <div className="text-sm text-gray-500">
                      {hasContributed ? "You've contributed this week!" : 'Pool is closed for contributions'}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
