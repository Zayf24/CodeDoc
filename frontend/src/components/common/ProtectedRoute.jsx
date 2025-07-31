import React from 'react';
import { useAuth } from '../../context/AuthContext';
import LoginForm from '../auth/LoginForm';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // If authenticated, show the protected content
  return children;
};

export default ProtectedRoute;
