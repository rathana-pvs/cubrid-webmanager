import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../authApi';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Input } from '../../../components/ds/forms/Input';
import { InfoBanner } from '../../../components/ds/foundation/InfoBanner';
import { useCM } from '../../../constants/useCM';

export default function RegisterPage() {
  const CM = useCM();
  const containerRef = useRef(null);

  useEffect(() => {
    let frameId;
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const x = e.clientX;
      const y = e.clientY;
      
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.style.setProperty('--mouse-x', `${x}px`);
          containerRef.current.style.setProperty('--mouse-y', `${y}px`);
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, []);
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
    if (!username.trim()) errs.username = CM.usernameRequired;
    else if (username.length < 3) errs.username = CM.minChars3;
    if (!password) errs.password = CM.passwordRequired;
    else if (password.length < 6) errs.password = 'At least 6 characters';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = CM.passwordsDoNotMatch;
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
    <div 
      ref={containerRef}
      className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#070709] font-sans selection:bg-amber-500/20 relative overflow-hidden"
    >
      
      {/* Glow dot matrix background */}
      <div 
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(rgba(0,0,0,0.08)_1.3px,transparent_1.3px)] dark:bg-[radial-gradient(rgba(16,185,129,0.11)_1.3px,transparent_1.3px)] [background-size:20px_20px]" 
        style={{
          maskImage: 'radial-gradient(circle at center, white 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, white 30%, transparent 80%)',
        }}
      />

      {/* Ambient glowing blobs centered behind the register card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/[0.06] dark:bg-amber-500/[0.05] rounded-full blur-[130px] pointer-events-none" />
      
      {/* Interactive mouse-following glow */}
      <div 
        className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/[0.08] dark:bg-emerald-500/[0.07] rounded-full blur-[120px] pointer-events-none transition-transform duration-500 ease-out"
        style={{
          transform: 'translate3d(calc(var(--mouse-x, 50vw) - 50%), calc(var(--mouse-y, 50vh) - 50%), 0)',
        }}
      />

      {/* Centered Register Card */}
      <div className="w-full max-w-[380px] bg-white/90 dark:bg-[#121215]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-[0_24px_60px_-15px_rgba(0,0,0,0.08),0_0_40px_rgba(16,185,129,0.04)] dark:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.6),0_0_50px_rgba(16,185,129,0.08)] relative z-10 overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Top Accent Gradient Border with Subtle Glow */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500/40 via-amber-400 to-emerald-500/40 shadow-[0_1px_8px_rgba(16,185,129,0.25)]" />

        {/* Back navigation */}
        <div className="flex justify-between items-center mb-5">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group text-[10px] font-bold uppercase tracking-wider"
          >
            <Icon name="arrow_back" size="sm" weight={300} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>{CM.backToLogin}</span>
          </Link>
          <span className="font-mono text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">v12.4.0</span>
        </div>

        {/* Brand header */}
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="w-9 h-9 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center shadow-md shrink-0">
            <img src="/cubrid-logo.png" alt="CUBRID" className="w-6 h-6 object-contain dark:brightness-100" />
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white font-extrabold text-base leading-none tracking-tight">CUBRID <span className="text-amber-500 font-light">Manager</span></h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{CM.createAccount}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Username */}
          <Input
            label={CM.username}
            icon="person_pin"
            placeholder={CM.pickUniqueUsername}
            value={username}
            onChange={(e) => { setUsername(e.target.value); clearFieldError('username'); }}
            error={errors.username}
            autoComplete="username"
          />

          {/* Password */}
          <Input
            label={CM.password}
            icon={strength.level >= 3 ? 'verified_user' : 'fingerprint'}
            type={showPassword ? 'text' : 'password'}
            placeholder={CM.createStrongPassword}
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
            error={errors.password}
            autoComplete="new-password"
            suffix={
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 flex items-center justify-center">
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} size="sm" weight={300} />
              </button>
            }
          />

          {/* Strength meter */}
          {password && (
            <div className="mt-[-8px] mb-1.5 animate-in fade-in duration-200">
              <div className="flex gap-1 h-0.5 mb-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : 'bg-slate-200 dark:bg-white/6'}`} />
                ))}
              </div>
              <p className={`text-[9px] font-bold uppercase tracking-widest font-mono ${strength.text}`}>{strength.label}</p>
            </div>
          )}

          {/* Confirm Password */}
          <Input
            label={CM.passwordConfirm}
            icon="verified"
            type={showConfirm ? 'text' : 'password'}
            placeholder={CM.repeatPassword}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
            error={errors.confirmPassword}
            autoComplete="new-password"
            suffix={
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 flex items-center justify-center">
                <Icon name={showConfirm ? 'visibility_off' : 'visibility'} size="sm" weight={300} />
              </button>
            }
          />

          {confirmPassword && password === confirmPassword && !errors.confirmPassword && (
            <p className="mt-[-8px] text-[10px] text-emerald-500 font-medium flex items-center gap-1 ml-0.5 animate-in fade-in">
              <Icon name="check_circle" size="12px" weight={400} />Passwords match
            </p>
          )}

          {/* API error */}
          {apiError && (
            <InfoBanner variant="danger" title={CM.registrationFailedTitle}>
              {apiError}
            </InfoBanner>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 mt-1 bg-slate-900 dark:bg-amber-500 text-white dark:text-black text-[13px] font-bold rounded-xl shadow-md hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:bg-slate-800 dark:hover:bg-amber-400 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 dark:border-black/20 border-t-white dark:border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <span className="tracking-wide">{CM.createAccount}</span>
                <Icon name="person_add" size="sm" weight={300} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Already have account */}
        <p className="mt-5 text-center text-[12px] text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-slate-900 dark:text-amber-500 hover:underline underline-offset-4">{CM.signIn}</Link>
        </p>

        {/* Terms */}
        <p className="mt-4 text-center text-[9px] text-slate-400/60 leading-relaxed max-w-[280px] mx-auto">
          By creating an account, you agree to the CUBRID Open Source{' '}
          <a href="#" className="underline hover:text-amber-500 transition-colors">Project Terms</a> and data policies.
        </p>
      </div>
    </div>
  );
}
