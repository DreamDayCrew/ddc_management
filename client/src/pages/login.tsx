import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/queryClient';
import { type TeamMember } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Mail, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = 'service_dsvsoaq';
const EMAILJS_TEMPLATE_ID = 'template_ufd0aek';
const EMAILJS_PUBLIC_KEY = 'ojcaaXdZZl0BcPZ5t';

type AuthStep = 'SELECT_USER' | 'ENTER_PASSWORD' | 'OTP_SENT' | 'SET_PASSWORD';

export default function LoginPage() {
  const { login } = useAuth();
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [authStep, setAuthStep] = useState<AuthStep>('SELECT_USER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { data: teamMembers = [], isLoading: isLoadingMembers } = useQuery<TeamMember[]>({
    queryKey: ['/api/team'],
  });

  const validatePasswordMutation = useMutation({
    mutationFn: async ({ memberId, password }: { memberId: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/validate', { memberId, password });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        login(data.member);
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ memberId, password, otp }: { memberId: string; password: string; otp: string }) => {
      const response = await apiRequest('POST', '/api/auth/update-password', { memberId, password, otp });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        login(data.member);
      } else {
        setError('Failed to set password. Please try again.');
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const generateOtpMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiRequest('POST', '/api/auth/generate-otp', { memberId });
      return response.json();
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async ({ memberId, otp }: { memberId: string; otp: string }) => {
      const response = await apiRequest('POST', '/api/auth/verify-otp', { memberId, otp });
      return response.json();
    },
  });

  useEffect(() => {
    if (selectedMemberId) {
      const member = teamMembers.find(m => m.id === selectedMemberId);
      setSelectedMember(member || null);
      setError('');
      setSuccess('');
      setPassword('');
      setOtpInput('');
      setShowForgotPassword(false);
      
      if (member) {
        const hasPassword = member.password && member.password.trim() !== '';
        if (hasPassword) {
          setAuthStep('ENTER_PASSWORD');
        } else {
          setAuthStep('SELECT_USER');
        }
      }
    } else {
      setSelectedMember(null);
      setAuthStep('SELECT_USER');
    }
  }, [selectedMemberId, teamMembers]);

  const handleUserSelected = () => {
    if (!selectedMember) return;
    
    const hasPassword = selectedMember.password && selectedMember.password.trim() !== '';
    
    if (hasPassword) {
      setAuthStep('ENTER_PASSWORD');
    } else {
      const hasEmail = selectedMember.email && selectedMember.email.trim() !== '';
      if (!hasEmail) {
        setError("It seems like you are logging in for the first time and we don't have your email to authenticate you. Please contact admin.");
        return;
      }
      sendOtp();
    }
  };

  const sendOtp = async () => {
    if (!selectedMember?.email) {
      setError('No email found for this user. Please contact admin.');
      return;
    }

    setIsSendingOtp(true);
    setError('');
    
    try {
      // Generate OTP on server side
      const otpData = await generateOtpMutation.mutateAsync(selectedMember.id);
      
      if (!otpData.success) {
        setError(otpData.error || 'Failed to generate OTP');
        return;
      }
      
      const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes to match server
      const readableExpiry = new Date(expiryTime).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // Send OTP via EmailJS
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          email: otpData.email,
          passcode: otpData.otp,
          time: readableExpiry,
        },
        EMAILJS_PUBLIC_KEY
      );

      setOtpExpiry(expiryTime);
      setAuthStep('OTP_SENT');
      setSuccess(`OTP sent successfully to ${otpData.email}`);
    } catch (error) {
      console.error('OTP Error:', error);
      setError('Failed to send OTP. Please check your connection and try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!selectedMember) return;
    setError('');
    
    const now = Date.now();
    if (!otpExpiry || now > otpExpiry) {
      setError('This OTP has expired. Please request a new one.');
      setOtpInput('');
      return;
    }

    try {
      // Verify OTP on server side
      const result = await verifyOtpMutation.mutateAsync({ 
        memberId: selectedMember.id, 
        otp: otpInput 
      });
      
      if (result.valid) {
        setGeneratedOtp(otpInput); // Store verified OTP for password update
        setSuccess('OTP verified successfully! Please set your password.');
        setAuthStep('SET_PASSWORD');
      } else {
        setError(result.error || 'Incorrect OTP. Please try again.');
      }
    } catch (error) {
      setError('Failed to verify OTP. Please try again.');
    }
  };

  const handlePasswordSubmit = () => {
    if (!selectedMember) return;
    setError('');
    validatePasswordMutation.mutate({ memberId: selectedMember.id, password });
  };

  const handleSetPassword = () => {
    if (!selectedMember) return;
    setError('');

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!generatedOtp) {
      setError('OTP verification required. Please start over.');
      return;
    }

    updatePasswordMutation.mutate({ memberId: selectedMember.id, password, otp: generatedOtp });
  };

  const handleForgotPassword = () => {
    if (!selectedMember) return;
    
    const hasEmail = selectedMember.email && selectedMember.email.trim() !== '';
    if (!hasEmail) {
      setError("We don't have your email on file to reset your password. Please contact admin.");
      return;
    }
    
    setShowForgotPassword(true);
    sendOtp();
  };

  const handleBack = () => {
    setAuthStep('SELECT_USER');
    setSelectedMemberId('');
    setSelectedMember(null);
    setPassword('');
    setConfirmPassword('');
    setOtpInput('');
    setError('');
    setSuccess('');
    setShowForgotPassword(false);
  };

  if (isLoadingMembers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#800020]/10 via-background to-[#800020]/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-[#800020] rounded-full flex items-center justify-center mb-2">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Dream Day Crew</CardTitle>
          <CardDescription>
            {authStep === 'SELECT_USER' && 'Select your name to continue'}
            {authStep === 'ENTER_PASSWORD' && 'Enter your password'}
            {authStep === 'OTP_SENT' && 'Enter the OTP sent to your email'}
            {authStep === 'SET_PASSWORD' && 'Set your password'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">{success}</AlertDescription>
            </Alert>
          )}

          {authStep === 'SELECT_USER' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="member-select">Select Your Name</Label>
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger id="member-select" data-testid="select-member">
                    <SelectValue placeholder="Choose your name..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} - {member.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                className="w-full bg-[#800020] hover:bg-[#600018]" 
                onClick={handleUserSelected}
                disabled={!selectedMemberId || isSendingOtp}
                data-testid="button-continue"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </>
          )}

          {authStep === 'ENTER_PASSWORD' && (
            <>
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Welcome back, <span className="font-medium text-foreground">{selectedMember?.name}</span>
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    data-testid="input-password"
                  />
                </div>
              </div>
              
              <Button 
                className="w-full bg-[#800020] hover:bg-[#600018]" 
                onClick={handlePasswordSubmit}
                disabled={!password || validatePasswordMutation.isPending}
                data-testid="button-login"
              >
                {validatePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Login'
                )}
              </Button>

              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" size="sm" onClick={handleBack} data-testid="button-back">
                  Back
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleForgotPassword}
                  disabled={isSendingOtp}
                  className="text-[#800020] hover:text-[#600018]"
                  data-testid="button-forgot-password"
                >
                  {isSendingOtp ? 'Sending OTP...' : 'Forgot Password?'}
                </Button>
              </div>
            </>
          )}

          {authStep === 'OTP_SENT' && (
            <>
              <div className="text-center mb-4">
                <Mail className="mx-auto h-12 w-12 text-[#800020] mb-2" />
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to<br />
                  <span className="font-medium text-foreground">{selectedMember?.email}</span>
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  data-testid="input-otp"
                />
              </div>
              
              <Button 
                className="w-full bg-[#800020] hover:bg-[#600018]" 
                onClick={handleVerifyOtp}
                disabled={otpInput.length !== 6}
                data-testid="button-verify-otp"
              >
                Verify OTP
              </Button>

              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" size="sm" onClick={handleBack} data-testid="button-back">
                  Back
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={sendOtp}
                  disabled={isSendingOtp}
                  className="text-[#800020] hover:text-[#600018]"
                  data-testid="button-resend-otp"
                >
                  {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                </Button>
              </div>
            </>
          )}

          {authStep === 'SET_PASSWORD' && (
            <>
              <div className="text-center mb-4">
                <KeyRound className="mx-auto h-12 w-12 text-[#800020] mb-2" />
                <p className="text-sm text-muted-foreground">
                  {showForgotPassword ? 'Reset your password' : 'Create your password (min 4 characters)'}
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter password (min 4 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-new-password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSetPassword()}
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>
              
              <Button 
                className="w-full bg-[#800020] hover:bg-[#600018]" 
                onClick={handleSetPassword}
                disabled={password.length < 4 || password !== confirmPassword || updatePasswordMutation.isPending}
                data-testid="button-set-password"
              >
                {updatePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting Password...
                  </>
                ) : (
                  'Set Password & Login'
                )}
              </Button>

              <Button variant="ghost" size="sm" onClick={handleBack} className="w-full" data-testid="button-back">
                Back
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
