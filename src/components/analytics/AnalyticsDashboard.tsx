import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsService } from '../../services/analyticsService';
import {
  ChartBarIcon,
  FireIcon,
  UsersIcon,
  StarIcon,
  TrophyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';

interface Stat {
  name: string;
  value: string | number;
  icon: any;
  change?: number;
  changeType?: 'increase' | 'decrease';
  changeText?: string;
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [userMetrics, setUserMetrics] = useState<any>(null);
  const [familyMetrics, setFamilyMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        const metrics = await analyticsService.getUserMetrics(user.id);
        setUserMetrics(metrics);

        if (user.user_metadata?.family_id) {
          const fMetrics = await analyticsService.getFamilyMetrics(user.user_metadata.family_id);
          setFamilyMetrics(fMetrics);
        }
      } catch (error) {
        console.error('Error loading metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, [user?.id, user?.user_metadata?.family_id]);

  const userStats: Stat[] = !userMetrics
    ? []
    : [
        {
          name: 'Active Habits',
          value: userMetrics.active_habits,
          icon: ChartBarIcon,
        },
        {
          name: 'Longest Streak',
          value: `${userMetrics.longest_streak} days`,
          icon: FireIcon,
        },
        {
          name: 'Total Points',
          value: userMetrics.total_points,
          icon: StarIcon,
          change: 15,
          changeType: 'increase',
          changeText: 'vs. last week',
        },
        {
          name: 'Completion Rate',
          value: `${userMetrics.completion_rate}%`,
          icon: TrophyIcon,
          change: userMetrics.weekly_completion_rate - userMetrics.completion_rate,
          changeType:
            userMetrics.weekly_completion_rate > userMetrics.completion_rate
              ? 'increase'
              : 'decrease',
          changeText: 'this week',
        },
      ];

  const familyStats: Stat[] = !familyMetrics
    ? []
    : [
        {
          name: 'Family Members',
          value: familyMetrics.member_count,
          icon: UsersIcon,
        },
        {
          name: 'Family Points',
          value: familyMetrics.total_family_points,
          icon: StarIcon,
        },
        {
          name: 'Weekly Activity',
          value: familyMetrics.activity_last_week,
          icon: ChartBarIcon,
        },
        {
          name: 'Family Completion Rate',
          value: `${familyMetrics.completion_rate}%`,
          icon: TrophyIcon,
        },
      ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Habit Analytics</h1>

      {/* Personal Analytics */}
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Progress</h2>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {userStats.map((stat) => (
              <div
                key={stat.name}
                className="relative bg-white pt-5 px-4 pb-6 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
              >
                <dt>
                  <div className="absolute bg-primary-500 rounded-md p-3">
                    <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-sm font-medium text-gray-500 truncate">{stat.name}</p>
                </dt>
                <dd className="ml-16 flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  {stat.change !== undefined && (
                    <p
                      className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.changeType === 'increase' ? (
                        <ArrowUpIcon
                          className="self-center flex-shrink-0 h-4 w-4 text-green-500"
                          aria-hidden="true"
                        />
                      ) : (
                        <ArrowDownIcon
                          className="self-center flex-shrink-0 h-4 w-4 text-red-500"
                          aria-hidden="true"
                        />
                      )}
                      <span className="sr-only">
                        {stat.changeType === 'increase' ? 'Increased' : 'Decreased'} by
                      </span>
                      {Math.abs(stat.change)}%
                    </p>
                  )}
                  {stat.changeText && (
                    <div className="ml-1 text-sm text-gray-500">{stat.changeText}</div>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {familyMetrics && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Family Stats</h2>
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {familyStats.map((stat) => (
                <div
                  key={stat.name}
                  className="relative bg-white pt-5 px-4 pb-6 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
                >
                  <dt>
                    <div className="absolute bg-blue-500 rounded-md p-3">
                      <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <p className="ml-16 text-sm font-medium text-gray-500 truncate">{stat.name}</p>
                  </dt>
                  <dd className="ml-16 flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    {stat.change !== undefined && (
                      <p
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {stat.changeType === 'increase' ? (
                          <ArrowUpIcon
                            className="self-center flex-shrink-0 h-4 w-4 text-green-500"
                            aria-hidden="true"
                          />
                        ) : (
                          <ArrowDownIcon
                            className="self-center flex-shrink-0 h-4 w-4 text-red-500"
                            aria-hidden="true"
                          />
                        )}
                        <span className="sr-only">
                          {stat.changeType === 'increase' ? 'Increased' : 'Decreased'} by
                        </span>
                        {Math.abs(stat.change)}%
                      </p>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Top Performers */}
        {familyMetrics && familyMetrics.top_performers && familyMetrics.top_performers.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Top Family Performers</h2>
            <div className="flow-root">
              <ul className="divide-y divide-gray-200">
                {familyMetrics.top_performers.map((performer: any, index: number) => (
                  <li key={performer.user_id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-100 text-primary-700">
                          {index === 0 ? (
                            <TrophyIcon className="h-6 w-6 text-yellow-500" />
                          ) : (
                            <span className="text-lg font-bold">{index + 1}</span>
                          )}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {performer.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {performer.completions} completions this week
                        </p>
                      </div>
                      <div className="inline-flex items-center text-sm font-semibold text-primary-600">
                        {performer.points} points
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}