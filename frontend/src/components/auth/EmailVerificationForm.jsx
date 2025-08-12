import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EmailVerificationForm = ({ email, onBack }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/users/verify-code/', {
        email: email,
        code: verificationCode
      });

      // Login user with the token
      await login(response.data.token, () => {
        console.log('Email verified and logged in successfully!');
        navigate('/dashboard');
      });

    } catch (error) {
      console.error('Code verification failed:', error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Invalid verification code. Please try again.');
      }
      
      // Clear the code inputs on error
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setError('');

    try {
      await axios.post('http://localhost:8000/api/users/send-verification/', {
        email: email
      });
      
      setTimeLeft(15 * 60); // Reset timer
      setCode(['', '', '', '', '', '']); // Clear existing code
      document.getElementById('code-0')?.focus();
      
    } catch (error) {
      console.error('Failed to resend code:', error);
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Enter Verification Code</h2>
        <p className="mt-2 text-sm text-gray-600">
          We've sent a 6-digit code to:
        </p>
        <p className="mt-1 font-medium text-blue-600">{email}</p>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleVerifyCode} className="mt-6">
        <div className="flex justify-center space-x-2 mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]"
              maxLength="1"
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              autoComplete="off"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || code.join('').length !== 6}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div className="mt-4 text-center">
        {timeLeft > 0 ? (
          <p className="text-sm text-gray-600">
            Code expires in: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </p>
        ) : (
          <p className="text-sm text-red-600">Code has expired</p>
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">Didn't receive the code?</p>
        <button
          onClick={handleResendCode}
          disabled={resending}
          className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {resending ? 'Sending...' : 'Resend Code'}
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-500 font-medium"
        >
          ← Back to Sign Up
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationForm;