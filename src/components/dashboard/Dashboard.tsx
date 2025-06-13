import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.email}</h1>
      <div className="mt-8">
        <p className="text-gray-600">Dashboard content will be implemented here.</p>
      </div>
    </div>
  );
} 