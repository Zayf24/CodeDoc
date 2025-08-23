import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add token to requests if available
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Token ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

export const authService = {
    login: async (credentials) => {
        try {
            const response = await apiClient.post('/api/users/login/', credentials)
            return response.data
        } catch (error) {
            if (error.response?.status === 403 && error.response?.data?.requires_verification) {
                throw new Error('VERIFICATION_REQUIRED', { cause: error.response.data })
            }
            throw new Error(error.response?.data?.message || 'Login failed')
        }
    },

    signup: async (userData) => {
        try {
            const response = await apiClient.post('/api/users/register/', userData)
            return response.data
        } catch (error) {
            const apiMessage = error.response?.data?.message || error.response?.data?.error
            throw new Error(apiMessage || 'Signup failed')
        }
    },

    resendVerification: async (emailPayload) => {
        try {
            const response = await apiClient.post('/api/users/send-verification/', emailPayload)
            return response.data
        } catch (error) {
            const apiMessage = error.response?.data?.message || error.response?.data?.error
            throw new Error(apiMessage || 'Failed to resend verification code')
        }
    },

    verifyCode: async (data) => {
        try {
            const response = await apiClient.post('/api/users/verify-code/', data)
            return response.data
        } catch (error) {
            const apiMessage = error.response?.data?.message || error.response?.data?.error
            throw new Error(apiMessage || 'Verification failed')
        }
    },

    // ✅ NEW: Get user profile
    getProfile: async () => {
        try {
            const response = await apiClient.get('/api/users/profile/')
            return response.data
        } catch (error) {
            console.error('Failed to get profile:', error)
            throw error
        }
    },

    // ✅ NEW: Get user stats
    getStats: async () => {
        try {
            const response = await apiClient.get('/api/users/stats/')
            return response.data
        } catch (error) {
            console.error('Failed to get stats:', error)
            throw error
        }
    },

    // ✅ NEW: Disconnect GitHub
    disconnectGitHub: async () => {
        try {
            const response = await apiClient.post('/api/users/disconnect-github/')
            return response.data
        } catch (error) {
            console.error('Failed to disconnect GitHub:', error)
            throw error
        }
    },

    // ✅ NEW: Sync GitHub Profile
    syncGitHubProfile: async () => {
        try {
            const response = await apiClient.post('/api/users/sync-github-profile/')
            return response.data
        } catch (error) {
            console.error('Failed to sync GitHub profile:', error)
            throw error
        }
    },

    logout: async () => {
        try {
            await apiClient.post('/api/users/logout/')
        } catch (error) {
            // Silent fail for logout
            console.warn('Logout request failed:', error)
        }
    },

    getGitHubAuthUrl: () => {
        return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/users/github/callback/`
    }
}

export default authService
