import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Loader2, Mail, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { cn } from '@/lib/utils'

const VerifyPage = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { setToken, setUser } = useAuth()

    // ✅ Initialize code as array of empty strings (not undefined)
    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [cooldown, setCooldown] = useState(0)

    const inputRefs = useRef([])
    const emailFromState = location.state?.email || ''
    const emailFromQuery = new URLSearchParams(location.search).get('email') || ''
    const email = emailFromState || emailFromQuery
    const message = location.state?.message || ''
    const fromSignup = location.state?.fromSignup || false

    // Redirect if no email provided
    useEffect(() => {
        if (!email) {
            navigate('/signup')
        }
    }, [email, navigate])

    // Auto-send verification when coming from signup
    useEffect(() => {
        const autoSend = async () => {
            if (fromSignup && email) {
                try {
                    await authService.resendVerification({ email })
                    setSuccess('Verification code sent to your email')
                    setCooldown(60)
                } catch {
                    setError('Failed to send verification code. Please try again.')
                }
            }
        }
        autoSend()
        // We only want to run this once on first mount when fromSignup is true
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [cooldown])

    // ✅ Fixed handleCodeChange with proper state management
    const handleCodeChange = (index, value) => {
        // Only allow single digits
        if (value.length > 1) return

        // Update the code array
        const newCode = [...code]
        newCode[index] = value
        setCode(newCode)

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }

        // Clear errors when user types
        if (error) setError('')
    }

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }

        // Handle arrow keys
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
        if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }

        // Handle paste
        if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            navigator.clipboard.readText().then(text => {
                const digits = text.replace(/\D/g, '').slice(0, 6).split('')
                const newCode = ['', '', '', '', '', '']
                digits.forEach((digit, i) => {
                    if (i < 6) newCode[i] = digit
                })
                setCode(newCode)

                // Focus appropriate input
                const nextIndex = Math.min(digits.length, 5)
                inputRefs.current[nextIndex]?.focus()
            })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const verificationCode = code.join('')

        if (verificationCode.length !== 6) {
            setError('Please enter the complete 6-digit code')
            return
        }

        setLoading(true)
        setError('')

        try {
            const response = await authService.verifyCode({
                email,
                code: verificationCode
            })

            // Auto-login after verification: store token and user
            localStorage.setItem('token', response.token)
            setToken(response.token)
            setUser(response.user)
            setSuccess('Email verified successfully!')

            setTimeout(() => {
                navigate('/dashboard')
            }, 1500)
        } catch (err) {
            setError(err.message)
            // Clear invalid code
            setCode(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        } finally {
            setLoading(false)
        }
    }

    const handleResendCode = async () => {
        if (cooldown > 0) return

        setResending(true)
        setError('')

        try {
            await authService.resendVerification({ email })
            setSuccess('Verification code sent again!')
            setCooldown(60) // 60 second cooldown
        } catch (err) {
            setError('Failed to resend code. Please try again.')
        } finally {
            setResending(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
            {/* Background Pattern - ✅ pointer-events-none to prevent blocking */}
            <div
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2399BBEE' fill-opacity='1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px'
                }}
            />

            {/* Back to Login - ✅ Proper z-index */}
            <motion.div
                className="absolute top-8 left-8 z-10"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
            >
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-medium">Back to Login</span>
                </Link>
            </motion.div>

            {/* Main Content - ✅ Proper z-index */}
            <motion.div
                className="w-full max-w-md px-6 relative z-20"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <Mail className="w-8 h-8 text-primary" />
                    </motion.div>

                    <motion.h1
                        className="text-3xl font-bold text-foreground mb-2 font-mono uppercase tracking-wider"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        Verify Email
                    </motion.h1>

                    <motion.p
                        className="text-muted-foreground mb-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                    >
                        We sent a 6-digit code to
                    </motion.p>

                    <motion.p
                        className="text-foreground font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                    >
                        {email}
                    </motion.p>
                </div>

                {/* ✅ Fixed Verification Form */}
                <motion.form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 }}
                >
                    {/* Success Message */}
                    {success && (
                        <motion.div
                            className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm text-center"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {success}
                        </motion.div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm text-center"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Info Message */}
                    {message && !error && !success && (
                        <motion.div
                            className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-primary text-sm text-center"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {message}
                        </motion.div>
                    )}

                    {/* ✅ Fixed Code Input with proper attributes */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-foreground text-center">
                            Enter verification code
                        </label>
                        <div className="flex gap-3 justify-center">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => inputRefs.current[index] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    name={`code-digit-${index}`}
                                    value={digit}
                                    onChange={(e) => handleCodeChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-12 text-center text-lg font-semibold bg-input border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-foreground"
                                    autoComplete="one-time-code"
                                    disabled={loading}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ✅ Submit Button - Fixed */}
                    <motion.button
                        type="submit"
                        disabled={loading || code.join('').length !== 6}
                        className={cn(
                            "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2",
                            (loading || code.join('').length !== 6) && "opacity-50 cursor-not-allowed"
                        )}
                        whileHover={{ scale: (loading || code.join('').length !== 6) ? 1 : 1.02 }}
                        whileTap={{ scale: (loading || code.join('').length !== 6) ? 1 : 0.98 }}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            'Verify Email'
                        )}
                    </motion.button>
                </motion.form>

                {/* Resend Code - ✅ Fixed button */}
                <motion.div
                    className="mt-8 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                >
                    <p className="text-sm text-muted-foreground mb-3">
                        Didn't receive the code?
                    </p>
                    <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resending || cooldown > 0}
                        className={cn(
                            "inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors text-sm",
                            (resending || cooldown > 0) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {resending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending...
                            </>
                        ) : cooldown > 0 ? (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Resend in {cooldown}s
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Resend code
                            </>
                        )}
                    </button>
                </motion.div>
            </motion.div>
        </div>
    )
}

export default VerifyPage
