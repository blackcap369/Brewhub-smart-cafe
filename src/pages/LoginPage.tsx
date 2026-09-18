import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { sendOTP, login, loading, error, clearError, isAuthenticated } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/menu', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-focus first OTP input when step changes
  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  // Clear error when step changes
  useEffect(() => {
    clearError();
  }, [step, clearError]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validate phone
    const fullPhone = `+91${phone}`;
    if (!/^\d{10}$/.test(phone)) {
      return;
    }

    const result = await sendOTP(fullPhone);

    if (result.success) {
      setOtpSent(true);
      setStep('otp');
      setResendTimer(30);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    // Handle enter
    if (e.key === 'Enter') {
      handleOtpSubmit(e);
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      return;
    }

    const fullPhone = `+91${phone}`;
    const result = await login(fullPhone, otpString);

    if (result.success) {
      setSuccessMessage('Login successful! Redirecting...');
      setTimeout(() => {
        navigate('/menu', { replace: true });
      }, 1000);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    clearError();
    const fullPhone = `+91${phone}`;
    const result = await sendOTP(fullPhone);

    if (result.success) {
      setOtp(['', '', '', '', '', '']);
      setResendTimer(30);
      otpRefs.current[0]?.focus();
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp(['', '', '', '', '', '']);
    clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-amber-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg shadow-primary-500/20 mb-4">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to BrewHub</h1>
          <p className="text-gray-600 mt-2">Sign in to continue</p>
        </motion.div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <AnimatePresence mode="wait">
            {/* Phone Input Step */}
            {step === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Enter your phone number</h2>
                <p className="text-sm text-gray-600 mb-6">
                  We'll send you a verification code
                </p>

                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="flex">
                      <div className="flex items-center px-4 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">
                        <span className="text-gray-600 font-medium">+91</span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="1234567890"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                    {phone.length > 0 && phone.length < 10 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Please enter a valid 10-digit phone number
                      </p>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <p className="text-sm text-red-700">{error}</p>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || phone.length !== 10}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* OTP Input Step */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change number
                </button>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">Enter verification code</h2>
                <p className="text-sm text-gray-600 mb-6">
                  We sent a 6-digit code to <span className="font-medium">+91{phone}</span>
                </p>

                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  {/* OTP Inputs */}
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                        disabled={loading}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  {/* Success Message */}
                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <p className="text-sm text-emerald-700 font-medium">{successMessage}</p>
                    </motion.div>
                  )}

                  {/* Error Message */}
                  {error && !successMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <p className="text-sm text-red-700">{error}</p>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otp.join('').length !== 6 || !!successMessage}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : successMessage ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Verified!
                      </>
                    ) : (
                      'Verify & Login'
                    )}
                  </button>

                  {/* Resend OTP */}
                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <p className="text-sm text-gray-600">
                        Resend OTP in{' '}
                        <span className="font-semibold text-primary-600">{resendTimer}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        Didn't receive code? Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          By continuing, you agree to our{' '}
          <a href="#" className="text-primary-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </motion.div>
    </div>
  );
}
