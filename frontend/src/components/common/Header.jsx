import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    // Optionally redirect to home page
    window.location.href = '/';
  };

  return (
    <header className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold">
              <span className="text-blue-400">Code</span>Doc AI
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Authenticated user menu */}
                <span className="text-gray-300">
                  Welcome, {user?.username}!
                </span>
                
                {user?.profile?.avatar_url && (
                  <img
                    src={user.profile.avatar_url}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Guest menu */}
                <a
                  href="/login"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </a>
                <a
                  href="/signup"
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </a>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
