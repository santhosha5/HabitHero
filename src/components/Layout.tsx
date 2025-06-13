import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  TrophyIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  TrophyIcon as TrophyIconSolid,
} from '@heroicons/react/24/solid';

interface NavItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  activeIcon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  badge?: number;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, activeIcon: HomeIconSolid },
  { name: 'Habits', href: '/habits', icon: ClipboardDocumentListIcon, activeIcon: ClipboardDocumentListIconSolid, badge: 3 },
  { name: 'Family', href: '/family', icon: UserGroupIcon, activeIcon: UserGroupIconSolid },
  { name: 'Rewards', href: '/rewards', icon: TrophyIcon, activeIcon: TrophyIconSolid, badge: 2 },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [greeting, setGreeting] = useState('');
  
  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Apply dark mode class to document if needed
    document.documentElement.classList.toggle('dark-mode');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'} transition-colors duration-300`}>
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 z-50 p-4 md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-md focus:outline-none"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          ) : (
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>
      
      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar for mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl md:hidden"
          >
            <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
              <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                <div className="flex flex-shrink-0 items-center px-4">
                  <h1 className="text-2xl font-bold text-primary-600">HabitHero</h1>
                </div>
                <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {isActive ? (
                          <item.activeIcon
                            className="mr-3 h-6 w-6 flex-shrink-0 text-primary-600"
                            aria-hidden="true"
                          />
                        ) : (
                          <item.icon
                            className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                            aria-hidden="true"
                          />
                        )}
                        {item.name}
                        {item.badge && (
                          <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-100 bg-primary-600 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <ArrowRightOnRectangleIcon
                    className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500"
                    aria-hidden="true"
                  />
                  Sign out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <motion.div 
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`flex min-h-0 flex-1 flex-col border-r ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} transition-colors duration-300`}
        >
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <motion.h1 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-primary-600"
              >
                HabitHero
              </motion.h1>
            </div>
            
            {/* User profile section */}
            <div className="mt-6 px-4">
              <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-primary-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {greeting}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <motion.div
                    key={item.name}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? `${isDarkMode ? 'bg-gray-900 text-primary-400' : 'bg-primary-50 text-primary-600'}`
                          : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
                      } transition-all duration-150`}
                    >
                      {isActive ? (
                        <item.activeIcon
                          className={`mr-3 h-6 w-6 flex-shrink-0 ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <item.icon
                          className={`mr-3 h-6 w-6 flex-shrink-0 ${
                            isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-500'
                          }`}
                          aria-hidden="true"
                        />
                      )}
                      {item.name}
                      {item.badge && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-100 bg-primary-600 rounded-full"
                        >
                          {item.badge}
                        </motion.span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </div>
          
          <div className={`flex flex-shrink-0 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4 justify-between transition-colors duration-300`}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => signOut()}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ArrowRightOnRectangleIcon
                className={`mr-3 h-6 w-6 ${
                  isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-500'
                }`}
                aria-hidden="true"
              />
              Sign out
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${
                isDarkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 md:hidden">
          <div className={`flex h-16 items-center justify-between ${isDarkMode ? 'bg-gray-800' : 'bg-white'} px-4 shadow-sm transition-colors duration-300`}>
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-primary-600">HabitHero</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full ${
                  isDarkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {isDarkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1"
        >
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}