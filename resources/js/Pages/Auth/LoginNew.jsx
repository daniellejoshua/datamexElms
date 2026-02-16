import { useState, useEffect } from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import { Transition } from '@headlessui/react'
import { toast } from 'sonner'

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false)
    const [showLoader, setShowLoader] = useState(false)
    const [showErrorDialog, setShowErrorDialog] = useState(false)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [isResetLinkSent, setIsResetLinkSent] = useState(false)
    const [cooldownTime, setCooldownTime] = useState(0)

    // Block immediate login after logout to avoid stale CSRF race
    const [isBlockedAfterLogout, setIsBlockedAfterLogout] = useState(false)
    const [blockSeconds, setBlockSeconds] = useState(0)

    // Cooldown timer effect
    useEffect(() => {
        let interval
        if (cooldownTime > 0) {
            interval = setInterval(() => {
                setCooldownTime(time => time - 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [cooldownTime])

    // If the user just logged out (sessionStorage set by logout handler),
    // block immediate login for a short period and show a loader/banner.
    useEffect(() => {
        try {
            const ts = Number(sessionStorage.getItem('justLoggedOutAt')) || 0
            if (!ts) return

            const ageMs = Date.now() - ts
            const BLOCK_MS = 2500 // block duration (2.5s)

            if (ageMs < BLOCK_MS) {
                const remaining = Math.ceil((BLOCK_MS - ageMs) / 1000)
                setIsBlockedAfterLogout(true)
                setBlockSeconds(remaining)

                const countdown = setInterval(() => {
                    setBlockSeconds(s => {
                        if (s <= 1) {
                            clearInterval(countdown)
                            setIsBlockedAfterLogout(false)
                            try { sessionStorage.removeItem('justLoggedOutAt') } catch (e) {}
                            return 0
                        }
                        return s - 1
                    })
                }, 1000)

                return () => clearInterval(countdown)
            } else {
                // stale flag — remove it
                sessionStorage.removeItem('justLoggedOutAt')
            }
        } catch (e) {
            // ignore storage errors
        }
    }, [])

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    })

    const { data: forgotData, setData: setForgotData, post: postForgot } = useForm({
        email: '',
    })

    const submit = (e) => {
        e.preventDefault()

        if (isBlockedAfterLogout) {
            toast.error('Please wait a moment while your previous session finishes logging out.')
            return
        }

        // capture current CSRF token so we can detect whether it was refreshed
        const beforeCsrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null

        setShowLoader(true)

        post(route('login'), {
            onSuccess: () => {
                // set a small flag for the destination page to show the toast
                // after the refresh. do NOT show a client toast here to avoid
                // duplicate toasts after reload.
                try { sessionStorage.setItem('justLoggedInAt', Date.now().toString()) } catch (e) {}

                // after a short delay, if the page's CSRF meta did NOT change,
                // force a full reload to ensure the client has a fresh token.
                setTimeout(() => {
                    const afterCsrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null

                    if (beforeCsrf && afterCsrf === beforeCsrf) {
                        // still the same token -> force reload to fetch fresh meta
                        window.location.reload()
                    }
                }, 300)
            },
            onFinish: () => {
                reset('password')
                setShowLoader(false)
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
        if (isResetLinkSent || cooldownTime > 0) {
            toast.error('Please wait before requesting another password reset link.')
            return // Prevent multiple submissions
        }
        
        setShowLoader(true)
        setCooldownTime(60) // 60 second cooldown

        postForgot(route('password.email'), {
            onSuccess: () => {
                setShowLoader(false)
                setShowForgotPassword(false)
                setIsResetLinkSent(true)
                toast.success('Password reset link sent! Check your email for instructions.')
                setShowSuccessDialog(true)
                setTimeout(() => {
                    setShowSuccessDialog(false)
                }, 3000)
            },
            onError: (errors) => {
                setShowLoader(false)
                setCooldownTime(0) // Reset cooldown on error
                
                // Check if it's a rate limiting error
                if (errors.response && errors.response.status === 429) {
                    const retryAfter = errors.response.data?.retry_after || 60;
                    setCooldownTime(retryAfter); // Set cooldown based on server response
                    toast.error(`Too many password reset requests. Please wait ${retryAfter} seconds before trying again.`)
                    setErrorMessage(`Too many requests. Please wait ${retryAfter} seconds before trying again.`)
                } else {
                    toast.error('Email not found or invalid. Please check your email address.')
                    setErrorMessage('Email not found or invalid')
                }
                setShowErrorDialog(true)
            }
        })
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
                        <mask id="mask0" mask-type="alpha">
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
                                    disabled={cooldownTime > 0}
                                    className={`text-sm ${cooldownTime > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-500'}`}
                                    onClick={() => {
                                        if (cooldownTime > 0) {
                                            toast.error('Please wait before requesting another password reset.')
                                            return
                                        }
                                        setShowForgotPassword(true)
                                        setIsResetLinkSent(false)
                                        setForgotData('email', '')
                                    }}
                                >
                                    {cooldownTime > 0 ? `Forgot password? (Wait ${cooldownTime}s)` : 'Forgot your password?'}
                                </button>
                            )}
                        </div>

                        {/* Show a short banner when we're blocking immediate sign-in after logout */}
                        {isBlockedAfterLogout && (
                            <div className="mb-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 text-sm flex items-center gap-3">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500" />
                                Finishing sign-out — please wait {blockSeconds}s
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={processing || isBlockedAfterLogout}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                            >
                                {processing || isBlockedAfterLogout ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        {isBlockedAfterLogout ? 'Please wait...' : 'Signing in...'}
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
                            {isResetLinkSent 
                                ? "A password reset link has been sent to your email address. Please check your inbox and follow the instructions."
                                : "Enter your registered email address and we'll send you a password reset link:"
                            }
                        </p>
                        {!isResetLinkSent && (
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
                                        disabled={processing || cooldownTime > 0}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        {processing 
                                            ? 'Sending...' 
                                            : cooldownTime > 0 
                                                ? `Wait ${cooldownTime}s` 
                                                : 'Send Reset Link'
                                        }
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
                        )}
                        {isResetLinkSent && (
                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(false)}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition w-full"
                                >
                                    Got it!
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Transition>
        </div>
    )
}