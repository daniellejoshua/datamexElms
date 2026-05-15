import { useState, useEffect, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const MAX_PASSWORD_ATTEMPTS = 3;

export default function InactivityMonitor() {
    const [isInactive, setIsInactive] = useState(() => {
        // restore from local storage so reload doesn't clear modal
        try {
            return JSON.parse(localStorage.getItem('inactive')) || false;
        } catch {
            return false;
        }
    });
    const [password, setPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const timeoutRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    const resetTimer = () => {
        lastActivityRef.current = Date.now();
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setIsInactive(true);
            localStorage.setItem('inactive', 'true');
        }, INACTIVITY_TIMEOUT);
    };

    const handleActivity = () => {
        if (!isInactive) {
            resetTimer();
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!password.trim()) {
            toast.error('Please enter your password');
            return;
        }

        setIsVerifying(true);
        try {
            const response = await fetch('/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setIsInactive(false);
                localStorage.removeItem('inactive');
                setPassword('');
                setAttempts(0);
                resetTimer();
                toast.success('Session extended successfully');
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                setPassword('');

                if (newAttempts >= MAX_PASSWORD_ATTEMPTS) {
                    toast.error('Too many failed attempts. Logging out...');
                    setTimeout(() => {
                        router.post('/logout');
                    }, 2000);
                } else {
                    toast.error(`Incorrect password. ${MAX_PASSWORD_ATTEMPTS - newAttempts} attempts remaining.`);
                }
            }
        } catch (error) {
            console.error('Password verification error:', error);
            toast.error('An error occurred. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    useEffect(() => {
        // Set up activity listeners
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        const handleEvent = () => handleActivity();

        events.forEach(event => {
            document.addEventListener(event, handleEvent, true);
        });

        // Start the timer
        resetTimer();

        // Cleanup
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleEvent, true);
            });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Handle page visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Page is hidden, don't reset timer
            } else {
                // Page is visible again, reset timer
                resetTimer();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    return (
        <Dialog open={isInactive} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-md" hideCloseButton>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-orange-500" />
                        Session Timeout
                    </DialogTitle>
                    <DialogDescription>
                        Your session has been inactive for 5 minutes. Please enter your password to continue.
                    </DialogDescription>
                    {attempts > 0 && (
                        <div className="flex items-center gap-2 mt-2 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            {MAX_PASSWORD_ATTEMPTS - attempts} attempts remaining
                        </div>
                    )}
                </DialogHeader>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoFocus
                            disabled={isVerifying}
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            disabled={isVerifying || !password.trim()}
                            className="flex-1"
                        >
                            {isVerifying ? 'Verifying...' : 'Continue Session'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleLogout}
                            disabled={isVerifying}
                        >
                            Logout
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}