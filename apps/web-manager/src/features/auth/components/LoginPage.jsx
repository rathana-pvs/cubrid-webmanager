import { useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from '../authSlice';
import { authApi } from '../authApi';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Input } from '../../../components/ds/forms/Input';
import { InfoBanner } from '../../../components/ds/foundation/InfoBanner';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [remember, setRemember] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth, shallowEqual);

  const validate = () => {
    const errs = {};
    if (!username.trim()) errs.username = 'Username is required';
    if (!password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setApiError('');
    dispatch(loginStart());
    try {
      const response = await authApi.login(username, password);
      const token = response?.token;
      dispatch(loginSuccess({ token, user: { id: username } }));
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Login failed. Please check your credentials.';
      dispatch(loginFailure(msg));
      setApiError(msg);
    }
  };

  const features = [
    { icon: 'bolt',           title: 'High Performance',   desc: 'OLTP-optimized engine handling thousands of transactions per second.' },
    { icon: 'shield',         title: 'Enterprise Security', desc: 'Role-based access control, encrypted connections  and audit trails.' },
    { icon: 'device_hub',     title: '3-Tier Architecture', desc: 'Separate app, broker, and DB server layers for total scalability.' },
  ];

  const stats = [
    { label: 'Uptime',   value: '99.9%' },
    { label: 'Latency',  value: '< 1ms' },
    { label: 'Clients',  value: '12.4K' },
  ];

  const inputBase = 'w-full h-11 text-[13px] font-medium bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-xl outline-hidden transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-white';
  const inputFocus = 'focus:border-amber-500/50 dark:focus:border-amber-500/40 focus:bg-amber-500/2 dark:focus:bg-amber-500/3';
  const inputError = 'border-rose-500/60 dark:border-rose-500/40';
  const inputNormal = 'hover:border-slate-300 dark:hover:border-white/20';

  return (
    <div className="h-screen flex bg-white dark:bg-[#0d0d0f] font-sans selection:bg-amber-500/20 overflow-hidden">


      {/* ── Left Panel: Brand ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col overflow-hidden bg-[#080809]">

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        {/* Glow blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/6 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-sky-500/4 rounded-full blur-[120px] pointer-events-none" />

        {/* Corner accent lines */}
        <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-amber-500/20 rounded-none pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-amber-500/20 rounded-none pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full justify-between p-14">

          {/* Brand header */}
          <div>
            <div className="flex items-center gap-3 mb-14">
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
                <div className="w-6 h-px bg-amber-500/60" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-500/80 font-mono">System Gateway</span>
              </div>
              <h1 className="text-5xl font-black text-white leading-[1.08] tracking-tighter mb-5">
                Total control<br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-amber-300 to-white">of your data.</span>
              </h1>
              <p className="text-[15px] text-slate-500 font-light leading-relaxed max-w-md">
                Monitor, administer, and optimize your CUBRID database infrastructure from a single, unified interface.
              </p>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-0 mb-10 bg-white/2.5 border border-white/6 rounded-2xl overflow-hidden divide-x divide-white/6">
              {stats.map((s) => (
                <div key={s.label} className="flex-1 px-5 py-4 text-center">
                  <p className="text-xl font-black text-white font-mono tracking-tight">{s.value}</p>
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Feature list */}
            <div className="space-y-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3.5 p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all group">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:border-transparent transition-all">
                    <Icon name={f.icon} size="sm" weight={300} className="text-amber-400 group-hover:text-black transition-colors" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-[13px] leading-none mb-1">{f.title}</p>
                    <p className="text-slate-500 text-[12px] leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer links */}
          <div className="flex items-center justify-between text-[10px] text-slate-700 font-semibold tracking-widest uppercase mt-10">
            <div className="flex gap-6">
              <a href="https://www.cubrid.org" target="_blank" rel="noreferrer" className="hover:text-amber-500 transition-colors">Website</a>
              <a href="https://github.com/CUBRID" target="_blank" rel="noreferrer" className="hover:text-amber-500 transition-colors">GitHub</a>
              <a href="https://www.cubrid.org/documentation" target="_blank" rel="noreferrer" className="hover:text-amber-500 transition-colors">Docs</a>
            </div>
            <span className="font-mono text-slate-700">v12.4.0</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="w-full lg:w-[48%] flex flex-col items-center justify-center px-8 sm:px-14 md:px-20 bg-white dark:bg-[#0d0d0f] relative overflow-hidden">

        {/* Subtle ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/4 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/3 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[360px] relative z-10">

          {/* Mobile logo (shown only on small screens) */}
          <div className="flex lg:hidden items-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
              <img src="/cubrid-logo.png" alt="CUBRID" className="w-5 h-5 object-contain dark:brightness-0" />
            </div>
            <span className="text-slate-900 dark:text-white font-bold text-base">CUBRID <span className="text-amber-500">Manager</span></span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-5 bg-amber-500 rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 font-mono">Authentication</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Sign In</h2>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">Access your database management console.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <Input
              label="Username"
              icon="account_circle"
              placeholder="Enter username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); if (errors.username) setErrors({ ...errors, username: '' }); }}
              error={errors.username}
              autoComplete="username"
            />

            <Input
              label="Password"
              labelExtra={<Link to="/forgot-password" title="Recover your password" className="text-amber-500 hover:text-amber-400 transition-colors">Forgot?</Link>}
              icon="lock"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
              error={errors.password}
              autoComplete="current-password"
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1"
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size="sm" weight={300} />
                </button>
              }
            />

            {/* Remember me */}
            <Toggle
              label="Remember this device"
              checked={remember}
              onChange={setRemember}
              className="py-1"
            />

            {/* API error */}
            {apiError && (
              <InfoBanner variant="danger" title="Authentication Failed">
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
                  <span className="tracking-wide">Authorize Access</span>
                  <Icon name="arrow_forward" size="sm" weight={300} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Create account link */}
          <p className="mt-7 text-center text-[12px] text-slate-500 dark:text-slate-400">
            New to CUBRID?{' '}
            <Link to="/register" className="font-bold text-slate-900 dark:text-amber-500 hover:underline underline-offset-4">Create Account</Link>
          </p>

          {/* Legal footer */}
          <div className="mt-12 flex items-center justify-center gap-1 opacity-30 hover:opacity-60 transition-opacity">
            <img src="/cubrid-logo.png" alt="CUBRID" className="h-4 object-contain dark:invert" />
            <div className="flex gap-4 ml-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <a href="#" className="hover:text-amber-500 transition-colors">Terms</a>
              <a href="#" className="hover:text-amber-500 transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
