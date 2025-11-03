import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '@/services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // Computed property for authentication status
  const isAuthenticated = !!token && !!user

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token')

      if (storedToken) {
        try {
          // Set token first
          setToken(storedToken)

          // Then fetch user profile
          const response = await apiClient.get('/api/users/profile/')
          setUser(response.data)
        } catch (error) {
          console.error('Auth initialization failed:', error)
          // Only clear auth if token is invalid
          if (error.response?.status === 401) {
            localStorage.removeItem('token')
            setToken(null)
            setUser(null)
          }
        }
      }

      setLoading(false)
    }

    initializeAuth()
  }, [])

  // ✅ Update API client when token changes
  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Token ${token}`
    } else {
      delete apiClient.defaults.headers.common['Authorization']
    }
  }, [token])

  const login = async (credentials) => {
    try {
      const response = await apiClient.post('/api/users/login/', credentials)
      const { token: authToken, user: userData } = response.data

      // Store token and update context
      localStorage.setItem('token', authToken)
      setToken(authToken)
      setUser(userData)

      return response.data
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.requires_verification) {
        const customError = new Error('VERIFICATION_REQUIRED')
        customError.cause = error.response.data
        throw customError
      }
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  const logout = async () => {
    try {
      await apiClient.post('/api/users/logout/')
    } catch (error) {
      console.warn('Logout request failed:', error)
    } finally {
      // Always clear local state
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)

      // Redirect to landing page
      window.location.href = '/'
    }
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    setUser, // ✅ Expose setUser for OAuth callback
    setToken, // ✅ Expose setToken for OAuth callback
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
