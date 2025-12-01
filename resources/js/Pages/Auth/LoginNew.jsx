import { useState, useEffect } from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import { Transition } from '@headlessui/react'

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false)
    const [showLoader, setShowLoader] = useState(false)
    const [showSuccessDialog, setShowSuccessDialog] = useState(false)
    const [showErrorDialog, setShowErrorDialog] = useState(false)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [showOtpDialog, setShowOtpDialog] = useState(false)
    const [showResetPassword, setShowResetPassword] = useState(false)
    const [otpTimer, setOtpTimer] = useState(0)
    const [resendCount, setResendCount] = useState(0)
    const [errorMessage, setErrorMessage] = useState('')

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    })

    const { data: forgotData, setData: setForgotData, post: postForgot } = useForm({
        email: '',
    })

    const { data: otpData, setData: setOtpData, post: postOtp } = useForm({
        otp: '',
        email: '',
    })

    const { data: resetData, setData: setResetData, post: postReset } = useForm({
        email: '',
        password: '',
        password_confirmation: '',
        token: '',
    })

    // OTP Timer Effect
    useEffect(() => {
        let interval = null
        if (otpTimer > 0) {
            interval = setInterval(() => {
                setOtpTimer(timer => timer - 1)
            }, 1000)
        } else if (otpTimer === 0) {
            clearInterval(interval)
        }
        return () => clearInterval(interval)
    }, [otpTimer])

    const submit = (e) => {
        e.preventDefault()
        setShowLoader(true)

        post(route('login'), {
            onFinish: () => {
                reset('password')
                setShowLoader(false)
            },
            onSuccess: () => {
                setShowSuccessDialog(true)
                setTimeout(() => {
                    setShowSuccessDialog(false)
                }, 2000)
            },
            onError: () => {
                setErrorMessage('Wrong email or password')
                setShowErrorDialog(true)
                setTimeout(() => {
                    setShowErrorDialog(false)
                }, 3000)
            }
        })
    }

    const handleForgotPassword = (e) => {
        e.preventDefault()
        setShowLoader(true)

        postForgot(route('password.email'), {
            onSuccess: () => {
                setShowLoader(false)
                setShowForgotPassword(false)
                setShowOtpDialog(true)
                setOtpTimer(300) // 5 minutes
                setOtpData('email', forgotData.email)
            },
            onError: () => {
                setShowLoader(false)
                setErrorMessage('Email not found')
                setShowErrorDialog(true)
            }
        })
    }

    const handleOtpVerification = (e) => {
        e.preventDefault()
        // In a real implementation, you would verify OTP with backend
        setShowOtpDialog(false)
        setShowResetPassword(true)
    }

    const handleResendOtp = () => {
        if (resendCount >= 3) {
            setErrorMessage('You have exceeded the maximum number of resend attempts')
            setShowErrorDialog(true)
            return
        }
        setResendCount(prev => prev + 1)
        setOtpTimer(300)
        // Resend OTP logic here
    }

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    return (
        <div className="min-h-screen flex">
            <Head title="Admin Login" />

            {/* Background SVG */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-800"></div>
                <svg 
                    className="absolute inset-0 w-full h-full object-cover"
                    viewBox="0 0 566 840" 
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <mask id="mask0" maskType="alpha">
                            <path d="M342.407 73.6315C388.53 56.4007 394.378 17.3643 391.538 0H566V840H0C14.5385 834.991 100.266 804.436 77.2046 707.263C49.6393 591.11 115.306 518.927 176.468 488.873C363.385 397.026 156.98 302.824 167.945 179.32C173.46 117.209 284.755 95.1699 342.407 73.6315Z"/>
                        </mask>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.1)"/>
                            <stop offset="100%" stopColor="rgba(255,255,255,0.05)"/>
                        </linearGradient>
                    </defs>
                    <g mask="url(#mask0)">
                        <rect width="566" height="840" fill="url(#gradient)"/>
                    </g>
                </svg>
                
                {/* Logo and branding overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                        <div className="mb-8">
                            <img 
                                src="/images/datamexlogo.png" 
                                alt="Datamex Logo" 
                                className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/10 p-4 object-contain"
                            />
                        </div>
                        <h2 className="text-4xl font-bold mb-4">Welcome Back</h2>
                        <p className="text-xl opacity-90">Access your admin dashboard</p>
                    </div>
                </div>
            </div>

            {/* Login Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-md w-full space-y-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center">
                        <img 
                            src="/images/datamexlogo.png" 
                            alt="Datamex Logo" 
                            className="w-20 h-20 mx-auto mb-4 rounded-full bg-white p-2 object-contain"
                        />
                        <h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
                        <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
                    </div>

                    {/* Desktop Title */}
                    <div className="hidden lg:block text-center">
                        <h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
                        <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
                    </div>

                    {status && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                            {status}
                        </div>
                    )}

                    <form className="mt-8 space-y-6" onSubmit={submit}>
                        <div className="space-y-4">
                            {/* Email Field */}
                            <div className="relative">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="relative block w-full px-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                                    placeholder="Email address"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i className="ri-mail-fill text-gray-400"></i>
                                </div>
                                {errors.email && <div className="mt-1 text-sm text-red-600">{errors.email}</div>}
                            </div>

                            {/* Password Field */}
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    className="relative block w-full px-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm pr-12"
                                    placeholder="Password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i className="ri-lock-fill text-gray-400"></i>
                                </div>
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`${showPassword ? 'ri-eye-fill' : 'ri-eye-off-fill'} text-gray-400 hover:text-gray-600`}></i>
                                </button>
                                {errors.password && <div className="mt-1 text-sm text-red-600">{errors.password}</div>}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    name="remember"
                                    type="checkbox"
                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
                                    Remember me
                                </label>
                            </div>

                            {canResetPassword && (
                                <button
                                    type="button"
                                    className="text-sm text-red-600 hover:text-red-500"
                                    onClick={() => setShowForgotPassword(true)}
                                >
                                    Forgot your password?
                                </button>
                            )}
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                            >
                                {processing ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Signing in...
                                    </div>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </div>

                      
                    </form>
                </div>
            </div>

            {/* Loader Modal */}
            <Transition show={showLoader}>
                <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black bg-opacity-25">
                    <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-lg">
                        <p className="text-lg font-semibold text-gray-700 mb-4">
                            Signing you in...
                        </p>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    </div>
                </div>
            </Transition>

            {/* Success Dialog */}
            <Transition show={showSuccessDialog}>
                <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black bg-opacity-25">
                    <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-lg animate-bounce">
                        <div className="w-16 h-16 text-green-600 animate-pulse">
                            <i className="ri-checkbox-circle-fill text-6xl"></i>
                        </div>
                        <p className="mt-6 text-green-600 text-lg font-semibold text-center">
                            Success! Welcome back!
                        </p>
                        <p className="text-sm text-gray-700 mt-2">Redirecting to dashboard...</p>
                    </div>
                </div>
            </Transition>

            {/* Error Dialog */}
            <Transition show={showErrorDialog}>
                <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black bg-opacity-25">
                    <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-lg">
                        <div className="w-16 h-16 text-red-600">
                            <i className="ri-error-warning-fill text-6xl animate-pulse"></i>
                        </div>
                        <p className="mt-6 text-red-600 text-lg font-semibold text-center">
                            {errorMessage}
                        </p>
                        <button
                            onClick={() => setShowErrorDialog(false)}
                            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </Transition>

            {/* Forgot Password Dialog */}
            <Transition show={showForgotPassword}>
                <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black bg-opacity-25">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">Forgot Password</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Enter your registered email address:
                        </p>
                        <form onSubmit={handleForgotPassword}>
                            <input
                                type="email"
                                placeholder="Email address"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                value={forgotData.email}
                                onChange={(e) => setForgotData('email', e.target.value)}
                                required
                            />
                            <div className="flex gap-3 mt-4">
                                <button
                                    type="submit"
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                                >
                                    Send OTP
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(false)}
                                    className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Transition>

            {/* OTP Verification Dialog */}
            <Transition show={showOtpDialog}>
                <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black bg-opacity-25">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">Verify OTP</h3>
                        <p className="text-sm text-gray-600 mb-2">Enter the OTP sent to your email:</p>
                        <p className="text-sm text-gray-500 mb-4">
                            Time remaining: {formatTime(otpTimer)}
                        </p>
                        <form onSubmit={handleOtpVerification}>
                            <input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                                value={otpData.otp}
                                onChange={(e) => setOtpData('otp', e.target.value)}
                                maxLength={6}
                                required
                            />
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                                >
                                    Verify OTP
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={otpTimer > 0 || resendCount >= 3}
                                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                                >
                                    Resend OTP
                                </button>
                            </div>
                        </form>
                        <p className="text-xs text-gray-500 mt-2">
                            Resends remaining: {3 - resendCount}
                        </p>
                    </div>
                </div>
            </Transition>
        </div>
    )
}