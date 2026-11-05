import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Calendar,
  Hash,
  MapPin,
  Phone,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type AuthMode = 'login' | 'signup' | 'otp_phone' | 'otp_verify';

export const AuthModal: React.FC = () => {
  const { showAuthModal, closeAuthModal, login, register, sendOtp, verifyOtp } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');

  // Form states
  // Log In fields:
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up / Registration fields:
  const [name, setName] = useState('');
  const [mail, setMail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [dob, setDob] = useState('');
  const [number, setNumber] = useState('');
  const [address, setAddress] = useState('');

  // Phone OTP fields (legacy / alternate):
  const [phone, setPhone] = useState('+91 ');
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!showAuthModal) return null;

  // Handle Email + Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Full Sign-Up / Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!age || Number(age) < 1 || Number(age) > 130) {
      setError('Please enter a valid age.');
      return;
    }
    if (!dob) {
      setError('Please select your Date of Birth (DOB).');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        mail,
        password,
        age: Number(age),
        dob,
        number,
        address,
      });
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Dispatch
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await sendOtp(phone);
      if (res.devOtp) setDevOtpHint(res.devOtp);
      setSuccessMsg(res.message || 'Verification code sent to your phone.');
      setMode('otp_verify');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(phone, otp, name);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLoginEmail('');
    setLoginPassword('');
    setName('');
    setMail('');
    setPassword('');
    setAge('');
    setDob('');
    setNumber('');
    setAddress('');
    setOtp('');
    setDevOtpHint(null);
    setError(null);
    setSuccessMsg(null);
    setShowPassword(false);
    setMode('login');
    closeAuthModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 my-auto max-h-[95vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={resetForm}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 flex items-center justify-center shadow-inner flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {mode === 'login'
                ? 'Welcome Back'
                : mode === 'signup'
                ? 'Create Your Account'
                : mode === 'otp_phone'
                ? 'Phone Number Sign In'
                : 'Enter Verification Code'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'login'
                ? 'Log in using your registered email and password.'
                : mode === 'signup'
                ? 'Provide your details to register for Flood Prediction and 3D GIS Twin access.'
                : mode === 'otp_phone'
                ? 'Sign in using SMS OTP verification.'
                : `We sent a 6-digit verification code to ${phone}`}
            </p>
          </div>
        </div>

        {/* Main Tab Navigation */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode('login');
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode('signup');
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode('otp_phone');
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'otp_phone' || mode === 'otp_verify'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Phone OTP
          </button>
        </div>

        {/* Alert Notifications */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && !error && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 1: LOG IN (Using Mail and Password)                                 */}
        {/* ========================================================================= */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address / Mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging In...</span>
                </>
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Don't have an account yet? </span>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('signup');
                }}
                className="text-xs text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
              >
                Sign Up Now
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: SIGN UP (Details: name, password, age, DOB, mail, number, address)*/}
        {/* ========================================================================= */}
        {mode === 'signup' && (
          <form onSubmit={handleRegister} className="space-y-3">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Navaneeth B"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Email / Mail & Mobile Number (2-column on sm) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email / Mail <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={mail}
                    onChange={(e) => setMail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Age & Date of Birth (DOB) (2-column) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Age <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    required
                    min={1}
                    max={130}
                    value={age}
                    onChange={(e) => setAge(e.target.value ? parseInt(e.target.value, 10) : '')}
                    placeholder="e.g. 25"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date of Birth (DOB) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Address (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Residential Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute top-2.5 left-3.5 pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street name, locality, city, postal code..."
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sign Up & Continue</span>
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Already registered? </span>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="text-xs text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
              >
                Log In Here
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* MODE 3 & 4: PHONE OTP AUTHENTICATION (LEGACY / ALTERNATE)               */}
        {/* ========================================================================= */}
        {(mode === 'otp_phone' || mode === 'otp_verify') && (
          <>
            {devOtpHint && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>
                  Dev OTP: <strong>{devOtpHint}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setOtp(devOtpHint)}
                  className="text-[11px] underline font-bold hover:text-amber-950 dark:hover:text-amber-100"
                >
                  Auto-fill Code
                </button>
              </div>
            )}

            {mode === 'otp_phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Dispatching Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('otp_phone')}
                    className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                  >
                    Change Phone
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otp.length < 4}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Sign In</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Public Access Notice */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Public exploration of the 3D GIS Twin & Live Flood Sensors is always free without sign-in.
          </p>
        </div>
      </div>
    </div>
  );
};
