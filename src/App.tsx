import React, { Suspense } from 'react';
import { 
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
  Navigate,
  Outlet
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navigation from './components/layout/Navigation';
import OfflineIndicator from './components/common/OfflineIndicator';

// Lazy load components with error handling
const lazyLoad = (Component: React.LazyExoticComponent<any>) => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    }>
      <Component />
    </Suspense>
  );
};

// Import components
const Dashboard = React.lazy(() => import('./features/habits/HabitDashboard'));
const HabitList = React.lazy(() => import('./components/habits/HabitList'));
const HabitForm = React.lazy(() => import('./components/habits/HabitForm'));
const HabitTemplates = React.lazy(() => import('./components/habits/HabitTemplates'));
const FamilyDashboard = React.lazy(() => import('./components/family/FamilyDashboard'));
const FamilyChallenge = React.lazy(() => import('./components/family/FamilyChallenge'));
const Rewards = React.lazy(() => import('./components/rewards/Rewards'));
const CreateFamily = React.lazy(() => import('./components/family/CreateFamily'));
const JoinFamily = React.lazy(() => import('./components/family/JoinFamily'));
const UserSettings = React.lazy(() => import('./components/user/UserSettings'));
const AnalyticsDashboard = React.lazy(() => import('./components/analytics/AnalyticsDashboard'));

// Create a layout component that includes the Navigation and AnalyticsProvider
const AppLayout = () => (
  <AnalyticsProvider>
    <Navigation />
    <Outlet />
  </AnalyticsProvider>
);

// Create the router configuration
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={lazyLoad(Dashboard)} />
        <Route path="/habits" element={lazyLoad(HabitList)} />
        <Route path="/habits/new" element={lazyLoad(HabitForm)} />
        <Route path="/habits/:habitId/edit" element={lazyLoad(HabitForm)} />
        <Route path="/habits/templates" element={lazyLoad(HabitTemplates)} />
        <Route path="/family" element={lazyLoad(FamilyDashboard)} />
        <Route path="/family/create" element={lazyLoad(CreateFamily)} />
        <Route path="/family/join" element={lazyLoad(JoinFamily)} />
        <Route path="/family/challenges" element={lazyLoad(FamilyChallenge)} />
        <Route path="/rewards" element={lazyLoad(Rewards)} />
        <Route path="/settings" element={lazyLoad(UserSettings)} />
        <Route path="/analytics" element={lazyLoad(AnalyticsDashboard)} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
);

function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <Toaster position="top-right" />
        <OfflineIndicator />
        <div className="min-h-screen bg-gray-100">
          <RouterProvider router={router} />
        </div>
      </RealtimeProvider>
    </AuthProvider>
  );
}

export default App;
