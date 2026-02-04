import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Mail, Lock, User, Shield, Key, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
  onLogout?: () => void; // Add logout callback
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess, onLogout }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [formData, setFormData] = useState({
    name: '',
    confirmPassword: '',
    password: '', // Add password to formData for registration
  });

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate credentials first
    if (!email || (isLogin ? !password : !formData.password)) {
      alert('Please enter both email and password');
      return;
    }

    // For login, check if user exists first (validate against backend)
    if (isLogin) {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5002/api/v1/auth/request-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password: password, // For login, use the password state
            isLogin: true
          }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // User exists and credentials are valid, proceed to OTP
          setStep('otp');
        } else {
          // User doesn't exist or invalid credentials
          alert(data.error || 'Invalid credentials');
          return;
        }
      } catch (error) {
        console.error('Error checking user credentials:', error);
        alert('Failed to verify credentials. Please try again.');
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // For registration, validate password confirmation
    if (!isLogin) {
      if (!formData.name) {
        alert('Please enter your name');
        return;
      }
      
      if (!formData.password) {
        alert('Please enter a password');
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }
      
      // For registration, proceed to OTP step
      setStep('otp');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const otpCode = otp.join('');
    
    try {
      const response = await fetch('http://localhost:5002/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otpCode,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store user data in localStorage
        localStorage.setItem('userEmail', email);
        localStorage.setItem('username', formData.name || email.split('@')[0]);
        localStorage.setItem('userId', data.userId || 'default-user');
        
        // Store join date - use existing date if available, otherwise set current date
        // For new registrations, this will be the first login date
        // For existing users, we preserve their original join date
        const existingJoinDate = localStorage.getItem('userJoinDate');
        if (!existingJoinDate) {
          localStorage.setItem('userJoinDate', new Date().toISOString());
        }
        
        onAuthSuccess();
      } else {
        alert(data.error || 'Invalid OTP');
        // Clear OTP fields
        setOtp(['', '', '', '', '', '']);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpRequest = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5002/api/v1/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: isLogin ? password : formData.password,
          isLogin,
          name: formData.name
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('OTP sent successfully to your email!');
      } else {
        alert(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    if (paste.length === 6 && /^\d+$/.test(paste)) {
      const newOtp = paste.split('');
      setOtp(newOtp);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setStep('credentials');
    setEmail('');
    setPassword('');
    setOtp(['', '', '', '', '', '']);
    setFormData({
      name: '',
      confirmPassword: '',
      password: '', // Reset password too
    });
  };

  const goBackToCredentials = () => {
    setStep('credentials');
    setOtp(['', '', '', '', '', '']);
  };

  // Add a reset function
  const resetAuthState = () => {
    setIsLogin(true);
    setStep('credentials');
    setEmail('');
    setPassword('');
    setOtp(['', '', '', '', '', '']);
    setFormData({
      name: '',
      confirmPassword: '',
      password: '',
    });
  };

  // Update the close handler to reset state
  const handleClose = () => {
    resetAuthState();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetAuthState();
        onClose();
      }
    }}>
      <DialogContent 
        className="sm:max-w-md border-0 bg-transparent shadow-none p-0"
        onPointerDownOutside={(e) => e.preventDefault()} // Prevent closing on outside click
        onInteractOutside={(e) => e.preventDefault()} // Prevent closing on outside interaction
      >
        <div className="relative">
          {/* Blur Overlay */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal Card */}
          <Card className={cn(
            "relative mx-auto w-full max-w-md border-0 shadow-2xl",
            "animate-in fade-in-0 zoom-in-95 duration-300"
          )}>
            {/* Close Button */}
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full hover:bg-muted"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
            
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                {step === 'credentials' 
                  ? (isLogin ? 'Welcome Back' : 'Create Account')
                  : 'Verify Your Email'
                }
              </CardTitle>
              <CardDescription>
                {step === 'credentials'
                  ? (isLogin 
                    ? 'Enter your credentials to continue' 
                    : 'Create your account to get started')
                  : `Enter the 6-digit code sent to ${email}`
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {step === 'credentials' ? (
                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required={!isLogin}
                          className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={isLogin ? password : formData.password}
                        onChange={(e) => isLogin ? setPassword(e.target.value) : setFormData({...formData, password: e.target.value})}
                        required
                        minLength={6}
                        className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                          required={!isLogin}
                          className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full mt-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-2">⏳</span>
                        Validating...
                      </span>
                    ) : (
                      'Continue to OTP'
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-center block">Enter 6-digit code</Label>
                    <div className="flex justify-center gap-2">
                      {otp.map((digit, index) => (
                        <Input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onPaste={handleOtpPaste}
                          className="w-12 h-12 text-center text-xl font-bold"
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Code will expire in 10 minutes
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                    disabled={isLoading || otp.some(d => d === '')}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-2">⏳</span>
                        Verifying...
                      </span>
                    ) : (
                      'Verify OTP'
                    )}
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center">
                {step === 'credentials' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={switchMode}
                    className="text-sm transition-colors duration-200 hover:text-primary"
                  >
                    {isLogin 
                      ? "Don't have an account? Sign up" 
                      : "Already have an account? Sign in"
                    }
                  </Button>
                ) : (
                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={goBackToCredentials}
                      className="text-sm transition-colors duration-200 hover:text-primary"
                    >
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleOtpRequest}
                      className="text-sm transition-colors duration-200 hover:text-primary"
                      disabled={isLoading}
                    >
                      Resend OTP
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};