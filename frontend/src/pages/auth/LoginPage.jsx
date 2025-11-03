import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Github, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { cn } from '@/lib/utils'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  
  // ✅ Initialize with empty strings
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(formData)
      navigate(from, { replace: true })
    } catch (err) {
      if (err.message === 'VERIFICATION_REQUIRED') {
        navigate('/verify', { 
          state: { 
            email: err.cause?.email,
            message: err.cause?.message 
          }
        })
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubLogin = () => {
    window.location.href = authService.getGitHubAuthUrl()
  }

  // ✅ Fixed onChange handler
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2399BBEE' fill-opacity='1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Back to Landing */}
      <motion.div 
        className="absolute top-8 left-8 z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to Home</span>
        </Link>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="w-full max-w-md px-6 relative z-20"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-3xl font-bold text-foreground mb-2 font-mono uppercase tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Welcome Back
          </motion.h1>
          <motion.p 
            className="text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Sign in to your CodeDoc AI account
          </motion.p>
        </div>

        {/* GitHub OAuth Button */}
        <motion.button
          type="button"
          onClick={handleGitHubLogin}
          className="w-full mb-6 bg-card hover:bg-card/80 border border-border hover:border-primary/30 rounded-lg p-4 transition-all duration-300 group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center gap-3">
            <Github className="w-5 h-5 text-foreground" />
            <span className="font-medium text-foreground">Continue with GitHub</span>
          </div>
        </motion.button>

        {/* Divider */}
        <motion.div 
          className="relative mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-4 text-muted-foreground">or continue with email</span>
          </div>
        </motion.div>

        {/* ✅ Fixed Login Form */}
        <motion.form 
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          {/* Error Message */}
          {error && (
            <motion.div 
              className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          {/* ✅ Username/Email Field - Fixed */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-foreground">
              Username or Email
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username} 
              onChange={handleChange}  
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-foreground placeholder:text-muted-foreground"
              placeholder="Enter your username or email"
              required
              autoComplete="username"
            />
          </div>

          {/* ✅ Password Field - Fixed */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"  
                value={formData.password} 
                onChange={handleChange} 
                className="w-full px-4 py-3 pr-12 bg-input border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-foreground placeholder:text-muted-foreground"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* ✅ Submit Button - Fixed */}
          <motion.button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2",
              loading && "opacity-50 cursor-not-allowed"
            )}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </motion.button>
        </motion.form>

        {/* Footer Links */}
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default LoginPage
