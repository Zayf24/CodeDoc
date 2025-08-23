import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import apiClient from '@/services/api'

const CallbackPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setToken, setUser } = useAuth()
  
  const [status, setStatus] = useState('processing') // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Processing authentication...')
  
  const token = searchParams.get('token')
  const error = searchParams.get('error')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle OAuth error
        if (error) {
          setStatus('error')
          setMessage('GitHub authentication failed. Please try again.')
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                error: 'GitHub authentication failed. Please try again.' 
              }
            })
          }, 2000)
          return
        }

        // Check for token
        if (!token) {
          setStatus('error')
          setMessage('No authentication token received.')
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                error: 'Authentication failed. No token received.' 
              }
            })
          }, 2000)
          return
        }

        // ✅ CRITICAL FIX: Store token immediately in localStorage
        localStorage.setItem('token', token)
        setToken(token)

        setMessage('Fetching your profile...')

        // ✅ Fetch user profile with the token
        const response = await apiClient.get('/api/users/profile/', {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.status !== 200) {
          throw new Error('Failed to fetch user profile')
        }

        const userData = response.data

        // ✅ Set user data in context
        setUser(userData)

        // ✅ Show success message
        setStatus('success')
        setMessage('Successfully authenticated! Taking you to your dashboard...')

        // ✅ Navigate to dashboard after brief delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1500)

      } catch (err) {
        console.error('OAuth callback error:', err)
        
        // ✅ Don't clear token if it's just a profile fetch issue
        setStatus('error')
        setMessage('Authentication error occurred. Please try again.')
        
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              error: 'Authentication failed. Please try logging in again.' 
            }
          })
        }, 2000)
      }
    }

    handleCallback()
  }, [token, error, navigate, setToken, setUser])

  // ✅ Visual feedback based on status
  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      case 'error':
        return <XCircle className="w-16 h-16 text-destructive mx-auto" />
      default:
        return <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-500'
      case 'error': return 'text-destructive'
      default: return 'text-foreground'
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div 
        className="text-center max-w-md px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-6">
          {getStatusIcon()}
        </div>
        
        <motion.h1 
          className={`text-2xl font-bold mb-4 ${getStatusColor()}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {status === 'processing' && 'Processing Authentication'}
          {status === 'success' && 'Authentication Successful!'}
          {status === 'error' && 'Authentication Failed'}
        </motion.h1>
        
        <motion.p 
          className="text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {message}
        </motion.p>

        {status === 'processing' && (
          <motion.div 
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div 
                className="bg-primary h-2 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default CallbackPage
