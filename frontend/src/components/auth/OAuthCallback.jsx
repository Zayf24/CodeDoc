// src/components/auth/OAuthCallback.jsx

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=' + error);
        return;
      }

      if (token) {
        try {
          // Use the token to log the user in
          await login(token, () => {
            console.log('OAuth login successful, redirecting to dashboard...');
            navigate('/dashboard');
          });
        } catch (error) {
          console.error('Failed to complete OAuth login:', error);
          navigate('/login?error=token_invalid');
        }
      } else {
        // No token provided, redirect to login
        navigate('/login?error=no_token');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing GitHub login...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
