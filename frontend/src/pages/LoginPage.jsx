import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, ArrowRight, Activity, Wallet, PieChart, User as UserIcon, Key, Send, Loader2 } from 'lucide-react';
import FinoraLogo from '../components/common/FinoraLogo';

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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
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
      setError('Network error. Is the backend running on port 7777?');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include',
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

    const progressInterval = setInterval(() => {
      setSendProgress(prev => {
        if (prev >= 85) { clearInterval(progressInterval); return 85; }
        return prev + Math.random() * 18;
      });
    }, 300);

    try {
      const response = await fetch('/api/auth/forgotpassword', {
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
    clearMessages();
    setMode('new_password');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const response = await fetch('/api/auth/resetpassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword: password }),
        credentials: 'include',
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
    <div className="min-h-screen flex bg-[#121214] font-sans selection:bg-[#d96b43] selection:text-white">
      {/* Left Side - Brand & Features in Dark Theme */}
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-[#161619] text-white p-12 relative overflow-hidden border-r border-[#26262e]">
        {/* Soft Ambient Light Glow Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#d96b43]/15 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#86c8a7]/15 blur-[130px] pointer-events-none" />
        <div className="absolute top-[40%] right-[15%] w-[40%] h-[40%] rounded-full bg-[#b09cec]/10 blur-[110px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="mb-14">
            <FinoraLogo size="lg" variant="dark" badgeText="Enterprise AI" />
          </div>

          <h1 className="text-4xl xl:text-5xl font-black leading-[1.15] tracking-tight mb-6 max-w-xl text-white">
            Intelligent Wealth Management & Financial Analytics.
          </h1>
          <p className="text-base xl:text-lg text-slate-400 mb-10 max-w-md font-normal leading-relaxed">
            Connect your accounts, automate your budget, and harness the power of AI to optimize your financial future.
          </p>

          <div className="space-y-4 max-w-lg">
            {[
              { icon: Activity, title: 'Real-time Analytics', desc: 'Track cash flow and detect anomalies instantly with precision RAG.', color: 'bg-[#ea9d85] text-slate-900' },
              { icon: Wallet, title: 'Multi-Wallet Support', desc: 'Manage fiat, bank accounts, and cards across multiple currencies.', color: 'bg-[#86c8a7] text-slate-900' },
              { icon: PieChart, title: 'Automated Budgeting', desc: 'Smart categorization rules optimize your monthly spending.', color: 'bg-[#b09cec] text-slate-900' }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-[#1c1c22] border border-[#2e2e38] hover:border-[#3d3d4a] transition-all">
                <div className={`w-11 h-11 rounded-2xl ${feature.color} flex items-center justify-center font-bold shrink-0 shadow-md`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{feature.title}</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-[#26262e] pt-6 mt-8">
          <p>© 2026 Finora Technologies</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#86c8a7]" />
            <span className="font-semibold text-slate-400">Bank-grade 256-bit Encryption</span>
          </div>
        </div>
      </div>

      {/* Right Side - Dynamic Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 xl:px-28 relative z-10 bg-[#121214]">
        <div className="max-w-md w-full mx-auto">
          
          {/* Mobile Logo View */}
          <div className="lg:hidden mb-8 flex justify-center">
            <FinoraLogo size="lg" variant="dark" badgeText="Enterprise AI" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight mb-2">
              {mode === 'login' && 'Welcome back'}
              {mode === 'register' && 'Create your account'}
              {mode === 'forgot_password' && 'Reset Password'}
              {mode === 'verify_otp' && 'Check your inbox'}
              {mode === 'new_password' && 'Set New Password'}
            </h2>
            <p className="text-sm font-medium text-slate-400">
              {mode === 'login' && 'Sign in to your Finora financial workspace.'}
              {mode === 'register' && 'Join thousands of users optimizing their wealth.'}
              {mode === 'forgot_password' && 'We will send a 6-digit OTP to your email.'}
              {mode === 'verify_otp' && <span>Enter the 6-digit OTP sent to <strong className="text-slate-200">{email}</strong></span>}
              {mode === 'new_password' && 'Choose a strong new password for your account.'}
            </p>
          </div>

          {/* EMAIL SENDING OVERLAY */}
          {sending && (
            <div className="mb-6 rounded-2xl border border-[#3b231c] bg-[#1e1918] p-5 space-y-4 shadow-sm" style={{animation: 'fadeSlideIn 0.3s ease'}}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d96b43] flex items-center justify-center shadow-md shadow-[#d96b43]/30 flex-shrink-0" style={{animation: 'pulse 1.5s ease infinite'}}>
                  <Send className="w-5 h-5 text-white" style={{animation: 'sendFloat 1.2s ease-in-out infinite alternate'}} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">Sending reset OTP…</p>
                  <p className="text-xs text-slate-400 truncate">Delivering to {email}</p>
                </div>
                <Loader2 className="w-5 h-5 text-[#ea9d85] flex-shrink-0" style={{animation: 'spin 1s linear infinite'}} />
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#2a1c18] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#d96b43] to-[#86c8a7]"
                  style={{ width: `${Math.min(sendProgress, 100)}%`, transition: 'width 0.4s ease' }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Connecting to mail server</span>
                <span>{Math.round(Math.min(sendProgress, 100))}%</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 text-red-400 text-sm font-semibold border border-red-500/20 flex items-start gap-3 animate-fade-in">
              <div className="mt-0.5">⚠️</div>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-[#86c8a7]/10 text-[#86c8a7] text-sm font-semibold border border-[#86c8a7]/20 flex items-start gap-3 animate-fade-in">
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
            className="space-y-4"
          >
            {/* NAME FIELD */}
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserIcon className="w-5 h-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#17171a] border border-[#2e2e36] rounded-xl text-slate-100 placeholder:text-slate-500 focus:bg-[#1c1c20] focus:outline-none focus:ring-2 focus:ring-[#d96b43]/30 focus:border-[#d96b43] transition-all font-medium text-sm"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            {/* EMAIL FIELD */}
            {(mode === 'login' || mode === 'register' || mode === 'forgot_password') && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#17171a] border border-[#2e2e36] rounded-xl text-slate-100 placeholder:text-slate-500 focus:bg-[#1c1c20] focus:outline-none focus:ring-2 focus:ring-[#d96b43]/30 focus:border-[#d96b43] transition-all font-medium text-sm"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>
            )}

            {/* OTP FIELD */}
            {mode === 'verify_otp' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">6-Digit OTP</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Key className="w-5 h-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-11 pr-4 py-3 bg-[#17171a] border border-[#2e2e36] rounded-xl text-slate-100 placeholder:text-slate-500 focus:bg-[#1c1c20] focus:outline-none focus:ring-2 focus:ring-[#d96b43]/30 focus:border-[#d96b43] transition-all font-medium tracking-[0.4em] text-center text-lg"
                    placeholder="· · · · · ·"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setMode('forgot_password'); setOtp(''); clearMessages(); }}
                  className="text-xs text-slate-400 hover:text-[#ea9d85] transition-colors mt-1 font-medium"
                >
                  Didn't receive it? Resend OTP
                </button>
              </div>
            )}

            {/* PASSWORD FIELD */}
            {(mode === 'login' || mode === 'register' || mode === 'new_password') && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {mode === 'new_password' ? 'New Password' : 'Password'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot_password'); clearMessages(); }}
                      className="text-xs font-bold text-[#ea9d85] hover:text-[#d96b43] transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#17171a] border border-[#2e2e36] rounded-xl text-slate-100 placeholder:text-slate-500 focus:bg-[#1c1c20] focus:outline-none focus:ring-2 focus:ring-[#d96b43]/30 focus:border-[#d96b43] transition-all font-medium text-sm"
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
              className="w-full group relative flex items-center justify-center gap-2 py-3.5 px-4 bg-[#d96b43] hover:bg-[#c75c36] text-white rounded-xl font-bold transition-all shadow-md shadow-[#d96b43]/25 hover:shadow-[#d96b43]/40 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden mt-3"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4" style={{animation: 'spin 1s linear infinite'}} />
                  <span>Sending OTP…</span>
                </>
              ) : (
                <>
                  <span>
                    {loading ? 'Processing...' :
                     mode === 'login' ? 'Sign in to Workspace' :
                     mode === 'register' ? 'Create Account' :
                     mode === 'forgot_password' ? 'Send Reset OTP' :
                     mode === 'verify_otp' ? 'Continue →' :
                     'Confirm Password Reset'}
                  </span>
                  {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </>
              )}
            </button>
          </form>

          {/* TOGGLE MODES */}
          <div className="mt-6 text-center space-y-3">
            {mode === 'login' && (
              <p className="text-sm font-medium text-slate-400">
                Don't have an account?{' '}
                <button onClick={() => { setMode('register'); clearMessages(); }} className="font-bold text-[#ea9d85] hover:text-[#d96b43] transition-colors">
                  Create one now
                </button>
              </p>
            )}

            {mode === 'register' && (
              <p className="text-sm font-medium text-slate-400">
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); clearMessages(); }} className="font-bold text-[#ea9d85] hover:text-[#d96b43] transition-colors">
                  Sign in
                </button>
              </p>
            )}

            {(mode === 'forgot_password' || mode === 'verify_otp' || mode === 'new_password') && (
              <button
                onClick={() => { setMode('login'); setOtp(''); setPassword(''); clearMessages(); }}
                className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto"
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
            @keyframes spin {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
            @keyframes sendFloat {
              from { transform: translateX(-2px) rotate(-10deg); }
              to   { transform: translateX(2px) rotate(5deg); }
            }
            @keyframes pulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(217,107,67,0.4); }
              50%       { box-shadow: 0 0 0 8px rgba(217,107,67,0); }
            }
          `}</style>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
