import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../authApi';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Input } from '../../../components/ds/forms/Input';
import { InfoBanner } from '../../../components/ds/foundation/InfoBanner';

export default function RegisterPage() {
  const [username, setUsername]             = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [errors, setErrors]                 = useState({});
  const [apiError, setApiError]             = useState('');
  const [loading, setLoading]               = useState(false);
  const navigate = useNavigate();

  const clearFieldError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!username.trim()) errs.username = 'Username is required';
    else if (username.length < 3) errs.username = 'At least 3 characters';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'At least 6 characters';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      await authApi.register(username, password);
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: '', text: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { level: 1, label: 'Weak',        color: 'bg-rose-500',    text: 'text-rose-500' };
    if (score <= 2) return { level: 2, label: 'Average',     color: 'bg-amber-500',   text: 'text-amber-500' };
    if (score <= 3) return { level: 3, label: 'Good',        color: 'bg-blue-500',    text: 'text-blue-500' };
    return             { level: 4, label: 'Strong',       color: 'bg-emerald-500', text: 'text-emerald-500' };
  };
  const strength = getPasswordStrength();

  const inputBase  = 'w-full h-11 text-[13px] font-medium bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-xl outline-hidden transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-white';
  const inputFocus = 'focus:border-amber-500/50 dark:focus:border-amber-500/40 focus:bg-amber-500/2 dark:focus:bg-amber-500/3';
  const inputErr   = 'border-rose-500/60 dark:border-rose-500/40';
  const inputOk    = 'border-emerald-500/50 dark:border-emerald-500/40';
  const inputNorm  = 'hover:border-slate-300 dark:hover:border-white/20';

  const specs = [
    { icon: 'hub',           label: 'Architecture', val: '3-Tier'      },
    { icon: 'verified_user', label: 'License',      val: 'Open Source' },
    { icon: 'speed',         label: 'Engine',       val: 'MVCC'        },
    { icon: 'security',      label: 'Security',     val: 'Enterprise'  },
  ];

  return (
    <div className="h-screen flex bg-white dark:bg-[#0d0d0f] font-sans selection:bg-amber-500/20 overflow-hidden">


      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col overflow-hidden bg-[#080809]">

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        {/* Glow blobs */}
        <div className="absolute top-[-10%] right-[-5%] w-[480px] h-[480px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%]  w-[380px] h-[380px] bg-amber-500/4   rounded-full blur-[120px] pointer-events-none" />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-amber-500/20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-amber-500/20 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full justify-between p-14">
          <div>
            {/* Back nav */}
            <Link
              to="/login"
              className="inline-flex items-center gap-2 mb-14 group text-slate-600 hover:text-white transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-white/4 border border-white/[0.07] flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Icon name="arrow_back" size="14px" weight={300} className="text-slate-500 group-hover:text-white" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Back to Login</span>
            </Link>

            {/* Brand */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <img src="/cubrid-logo.png" alt="CUBRID" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-none tracking-tight">CUBRID <span className="text-amber-400 font-light">Manager</span></p>
                <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-semibold mt-0.5">Enterprise Database Suite</p>
              </div>
            </div>

            {/* Headline */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-px bg-emerald-500/60" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-500/80 font-mono">New Account</span>
              </div>
              <h1 className="text-5xl font-black text-white leading-[1.08] tracking-tighter mb-5">
                Build your<br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-amber-300 to-white">data foundation.</span>
              </h1>
              <p className="text-[15px] text-slate-500 font-light leading-relaxed max-w-md">
                Join the CUBRID ecosystem. A powerful open-source RDBMS built for modern web application performance and reliability.
              </p>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-2 gap-3">
              {specs.map((s, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/2 border border-white/5 hover:border-amber-500/20 hover:bg-white/4 transition-all group">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name={s.icon} size="sm" weight={300} className="text-amber-500/40 group-hover:text-amber-400 transition-colors" />
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{s.label}</p>
                  </div>
                  <p className="text-[15px] font-bold text-white tracking-tight">{s.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer text */}
          <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.3em] mt-10">
            CUBRID Relational Database Management System
          </p>
        </div>
      </div>

      {/* ── Right panel: Form ── */}
      <div className="w-full lg:w-[48%] flex flex-col items-center justify-center px-8 sm:px-14 md:px-20 bg-white dark:bg-[#0d0d0f] relative overflow-hidden">

        {/* Ambient glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/3 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/3   rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[360px] relative z-10 py-10">

          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
              <img src="/cubrid-logo.png" alt="CUBRID" className="w-5 h-5 object-contain dark:brightness-0" />
            </div>
            <span className="text-slate-900 dark:text-white font-bold text-base">CUBRID <span className="text-amber-500">Manager</span></span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 font-mono">Create Account</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Register</h2>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">Create your administrative account to start managing data.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username */}
            <Input
              label="Username"
              icon="person_pin"
              placeholder="Pick a unique username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); clearFieldError('username'); }}
              error={errors.username}
              autoComplete="username"
            />

            {/* Password */}
            <Input
              label="Password"
              icon={strength.level >= 3 ? 'verified_user' : 'fingerprint'}
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
              error={errors.password}
              autoComplete="new-password"
              suffix={
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1">
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size="sm" weight={300} />
                </button>
              }
            />

            {/* Strength meter */}
            {password && (
              <div className="mt-[-10px] mb-2 animate-in fade-in duration-200">
                <div className="flex gap-1 h-0.5 mb-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : 'bg-slate-200 dark:bg-white/6'}`} />
                  ))}
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-widest font-mono ${strength.text}`}>{strength.label}</p>
              </div>
            )}

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              icon="verified"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
              error={errors.confirmPassword}
              autoComplete="new-password"
              suffix={
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1">
                  <Icon name={showConfirm ? 'visibility_off' : 'visibility'} size="sm" weight={300} />
                </button>
              }
            />

            {confirmPassword && password === confirmPassword && !errors.confirmPassword && (
              <p className="mt-[-10px] text-[11px] text-emerald-500 font-medium flex items-center gap-1 ml-0.5 animate-in fade-in">
                <Icon name="check_circle" size="12px" weight={400} />Passwords match
              </p>
            )}

            {/* API error */}
            {apiError && (
              <InfoBanner variant="danger" title="Registration Failed">
                {apiError}
              </InfoBanner>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 bg-slate-900 dark:bg-amber-500 text-white dark:text-black text-[13px] font-bold rounded-xl shadow-md hover:shadow-lg hover:bg-slate-800 dark:hover:bg-amber-400 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 dark:border-black/20 border-t-white dark:border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span className="tracking-wide">Create Account</span>
                  <Icon name="person_add" size="sm" weight={300} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Already have account */}
          <p className="mt-7 text-center text-[12px] text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-slate-900 dark:text-amber-500 hover:underline underline-offset-4">Sign In</Link>
          </p>

          {/* Terms */}
          <p className="mt-6 text-center text-[10px] text-slate-400/50 leading-relaxed max-w-[300px] mx-auto">
            By creating an account, you agree to the CUBRID Open Source{' '}
            <a href="#" className="underline hover:text-amber-500 transition-colors">Project Terms</a> and data processing policies.
          </p>
        </div>
      </div>
    </div>
  );
}
