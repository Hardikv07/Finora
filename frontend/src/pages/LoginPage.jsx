import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Lock, ArrowRight, Activity, Wallet, PieChart, User as UserIcon, Key, Send, CheckCircle2, Loader2 } from 'lucide-react';

const AuthPage = ({ onLogin }) => {
  // Modes: 'login', 'register', 'forgot_password', 'verify_otp', 'new_password'
  const [mode, setMode] = useState('login');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const response = await fetch('http://localhost:7777/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'omit' // Switch to 'include' for secure cross-origin cookies in production
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('finora_auth_token', data.token);
        localStorage.setItem('finora_user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (err) {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const response = await fetch('http://localhost:7777/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Please sign in.');
        setMode('login');
        setPassword('');
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSending(true);
    setSendProgress(0);
    clearMessages();

    // Animate progress bar during sending
    const progressInterval = setInterval(() => {
      setSendProgress(prev => {
        if (prev >= 85) { clearInterval(progressInterval); return 85; }
        return prev + Math.random() * 18;
      });
    }, 300);

    try {
      const response = await fetch('http://localhost:7777/api/auth/forgotpassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (response.ok) {
        clearInterval(progressInterval);
        setSendProgress(100);
        setTimeout(() => {
          setSending(false);
          setMode('verify_otp');
        }, 600);
      } else {
        clearInterval(progressInterval);
        setSending(false);
        setError(data.message || 'Failed to request password reset.');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setSending(false);
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    // Just move to the new password screen; OTP will be validated on final submit
    setLoading(false);
    setMode('new_password');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const response = await fetch('http://localhost:7777/api/auth/resetpassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword: password })
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess('Password updated successfully! You can now log in.');
        setMode('login');
        setPassword('');
        setOtp('');
      } else {
        setError(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Left Side - Brand & Features */}
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-slate-900 text-white p-12 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px]" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 font-black text-2xl">
              F
            </div>
            <div>
              <span className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                Finora <span className="text-sm font-semibold px-2 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-md">Enterprise</span>
              </span>
            </div>
          </div>

          <h1 className="text-5xl font-bold leading-[1.15] tracking-tight mb-6 max-w-xl">
            Intelligent Wealth Management & Financial Analytics.
          </h1>
          <p className="text-lg text-slate-400 mb-12 max-w-md">
            Connect your accounts, automate your budget, and harness the power of AI to optimize your financial future.
          </p>

          <div className="space-y-6">
            {[
              { icon: Activity, title: 'Real-time Analytics', desc: 'Track cash flow and detect anomalies instantly.' },
              { icon: Wallet, title: 'Multi-Wallet Support', desc: 'Manage fiat and crypto across multiple currencies.' },
              { icon: PieChart, title: 'Automated Budgeting', desc: 'Smart rules categorize your spending securely.' }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-sm text-slate-500 border-t border-white/10 pt-8 mt-12">
          <p>© 2026 Finora Technologies</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Bank-grade 256-bit Encryption</span>
          </div>
        </div>
      </div>

      {/* Right Side - Dynamic Auth Forms */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10 bg-white shadow-2xl lg:shadow-none lg:rounded-l-3xl">
        <div className="max-w-sm w-full mx-auto">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              {mode === 'login' && 'Welcome back'}
              {mode === 'register' && 'Create your account'}
              {mode === 'forgot_password' && 'Reset Password'}
              {mode === 'verify_otp' && 'Check your inbox'}
              {mode === 'new_password' && 'Set New Password'}
            </h2>
            <p className="text-slate-500">
              {mode === 'login' && 'Sign in to your Finora workspace.'}
              {mode === 'register' && 'Join thousands of users optimizing their wealth.'}
              {mode === 'forgot_password' && 'We will send a 6-digit OTP to your email.'}
              {mode === 'verify_otp' && <span>Enter the 6-digit OTP sent to <strong className="text-slate-800">{email}</strong></span>}
              {mode === 'new_password' && 'Choose a strong new password for your account.'}
            </p>
          </div>

          {/* EMAIL SENDING OVERLAY */}
          {sending && (
            <div className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 space-y-4" style={{animation: 'fadeSlideIn 0.3s ease'}}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0" style={{animation: 'pulse 1.5s ease infinite'}}>
                  <Send className="w-5 h-5 text-white" style={{animation: 'sendFloat 1.2s ease-in-out infinite alternate'}} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Sending reset OTP…</p>
                  <p className="text-xs text-slate-500 truncate">Delivering to {email}</p>
                </div>
                <Loader2 className="w-5 h-5 text-indigo-500 flex-shrink-0" style={{animation: 'spin 1s linear infinite'}} />
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-indigo-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${Math.min(sendProgress, 100)}%`, transition: 'width 0.4s ease' }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Connecting to mail server</span>
                <span>{Math.round(Math.min(sendProgress, 100))}%</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-start gap-3 animate-fade-in">
              <div className="mt-0.5">⚠️</div>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-100 flex items-start gap-3 animate-fade-in">
              <div className="mt-0.5">✨</div>
              <p>{success}</p>
            </div>
          )}

          {/* FORMS */}
          <form
            onSubmit={
              mode === 'login' ? handleLogin :
              mode === 'register' ? handleRegister :
              mode === 'forgot_password' ? handleForgotPassword :
              mode === 'verify_otp' ? handleVerifyOtp :
              handleResetPassword
            }
            className="space-y-5"
          >
            {/* NAME FIELD (Register only) */}
            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            {/* EMAIL FIELD (Login, Register, Forgot Password only — hidden on OTP & new password screens) */}
            {(mode === 'login' || mode === 'register' || mode === 'forgot_password') && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>
            )}

            {/* OTP FIELD (verify_otp mode only) */}
            {mode === 'verify_otp' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">6-Digit OTP</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Key className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium tracking-[0.4em] text-center text-lg"
                    placeholder="· · · · · ·"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setMode('forgot_password'); setOtp(''); clearMessages(); }}
                  className="text-xs text-slate-400 hover:text-indigo-600 transition-colors mt-1"
                >
                  Didn't receive it? Resend OTP
                </button>
              </div>
            )}

            {/* PASSWORD FIELD (Login, Register, new_password only) */}
            {(mode === 'login' || mode === 'register' || mode === 'new_password') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    {mode === 'new_password' ? 'New Password' : 'Password'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot_password'); clearMessages(); }}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || sending}
              className="w-full group relative flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden mt-2 shadow-md"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {sending ? (
                <>
                  <Loader2 className="relative z-10 w-4 h-4" style={{animation: 'spin 1s linear infinite'}} />
                  <span className="relative z-10">Sending OTP…</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">
                    {loading ? 'Processing...' :
                     mode === 'login' ? 'Sign in to Workspace' :
                     mode === 'register' ? 'Create Account' :
                     mode === 'forgot_password' ? 'Send Reset OTP' :
                     mode === 'verify_otp' ? 'Continue →' :
                     'Confirm Password Reset'}
                  </span>
                  {!loading && <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </>
              )}
            </button>
          </form>



          {/* TOGGLE MODES */}
          <div className="mt-8 text-center space-y-3">
            {mode === 'login' && (
              <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <button onClick={() => { setMode('register'); clearMessages(); }} className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  Create one now
                </button>
              </p>
            )}

            {mode === 'register' && (
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); clearMessages(); }} className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  Sign in
                </button>
              </p>
            )}

            {(mode === 'forgot_password' || mode === 'verify_otp' || mode === 'new_password') && (
              <button
                onClick={() => { setMode('login'); setOtp(''); setPassword(''); clearMessages(); }}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                &larr; Back to login
              </button>
            )}
          </div>

          <style>{`
            @keyframes fadeSlideIn {
              from { opacity: 0; transform: translateY(12px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes popIn {
              from { opacity: 0; transform: scale(0.5); }
              to   { opacity: 1; transform: scale(1); }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
            @keyframes sendFloat {
              from { transform: translateX(-2px) rotate(-10deg); }
              to   { transform: translateX(2px) rotate(5deg); }
            }
            @keyframes pulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
              50%       { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
            }
          `}</style>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
