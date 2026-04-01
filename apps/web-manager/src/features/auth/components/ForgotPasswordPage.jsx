import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Input } from '../../../components/ds/forms/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setSubmitted(true); setLoading(false); }, 1500);
  };

  const inputBase  = 'w-full h-11 text-[13px] font-medium bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-xl outline-hidden transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-white';
  const inputFocus = 'focus:border-amber-500/50 dark:focus:border-amber-500/40 focus:bg-amber-500/2 dark:focus:bg-amber-500/3';
  const inputNorm  = 'hover:border-slate-300 dark:hover:border-white/20';

  return (
    <div className="h-screen flex bg-white dark:bg-[#0d0d0f] font-sans selection:bg-amber-500/20 overflow-hidden">


      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col overflow-hidden bg-[#080809]">

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        {/* Glow blobs — rose-tinted for recovery context */}
        <div className="absolute top-[-5%] right-[-5%]   w-[460px] h-[460px] bg-rose-500/6   rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[380px] h-[380px] bg-amber-500/4 rounded-full blur-[120px] pointer-events-none" />

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
                <div className="w-6 h-px bg-rose-500/60" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-rose-500/80 font-mono">Account Recovery</span>
              </div>
              <h1 className="text-5xl font-black text-white leading-[1.08] tracking-tighter mb-5">
                Reset your<br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-400 via-orange-300 to-amber-300">access credentials.</span>
              </h1>
              <p className="text-[15px] text-slate-500 font-light leading-relaxed max-w-md">
                Account recovery is handled with the same enterprise-grade security as our database clustering. We'll help you regain access.
              </p>
            </div>

            {/* Security protocol info card */}
            <div className="p-5 rounded-xl bg-white/2 border border-white/6 max-w-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Icon name="shield_lock" size="sm" weight={300} className="text-amber-400" />
                </div>
                <p className="text-[11px] font-bold text-white uppercase tracking-widest">Security Protocol</p>
              </div>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                You will receive a one-time cryptographic link to authorize a new master password creation. The link expires in <span className="text-amber-400 font-semibold">15 minutes</span>.
              </p>

              {/* 3 step flow */}
              <div className="mt-4 space-y-2">
                {[
                  { step: '01', label: 'Submit your registered email' },
                  { step: '02', label: 'Check inbox for recovery link' },
                  { step: '03', label: 'Set a new secure password' },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-amber-500/60 w-5 shrink-0">{s.step}</span>
                    <div className="h-px w-3 bg-white/10" />
                    <span className="text-[11px] text-slate-600">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.3em] mt-10">
            CUBRID Manager Security Infrastructure
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-full lg:w-[48%] flex flex-col items-center justify-center px-8 sm:px-14 md:px-20 bg-white dark:bg-[#0d0d0f] relative overflow-hidden">

        {/* Ambient glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/3   rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/3 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[360px] relative z-10">

          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
              <img src="/cubrid-logo.png" alt="CUBRID" className="w-5 h-5 object-contain dark:brightness-0" />
            </div>
            <span className="text-slate-900 dark:text-white font-bold text-base">CUBRID <span className="text-amber-500">Manager</span></span>
          </div>

          {!submitted ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-5 bg-rose-500 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 font-mono">Recovery</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Forgot Password</h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Enter your registered email address to begin the account recovery process.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  required
                  icon="alternate_email"
                  placeholder="admin@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-2 bg-slate-900 dark:bg-amber-500 text-white dark:text-black text-[13px] font-bold rounded-xl shadow-md hover:shadow-lg hover:bg-slate-800 dark:hover:bg-amber-400 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 dark:border-black/20 border-t-white dark:border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="tracking-wide">Send Recovery Link</span>
                      <Icon name="send" size="sm" weight={300} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Back to login */}
              <p className="mt-7 text-center text-[12px] text-slate-500 dark:text-slate-400">
                Remember your password?{' '}
                <Link to="/login" className="font-bold text-slate-900 dark:text-amber-500 hover:underline underline-offset-4">Sign In</Link>
              </p>
            </>
          ) : (
            /* ── Success state ── */
            <div className="text-center animate-in zoom-in-95 fade-in duration-300">
              {/* Icon */}
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <Icon name="mark_email_read" size="sm" weight={300} className="text-2xl text-emerald-500" />
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 font-mono">Link Sent</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Check your inbox</h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Recovery instructions have been sent to{' '}
                  <span className="text-slate-900 dark:text-white font-bold">{email}</span>.
                </p>
              </div>

              {/* Expiry warning */}
              <div className="my-6 px-4 py-3 bg-amber-500/5 dark:bg-amber-500/6 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-left">
                <Icon name="timer" size="sm" weight={300} className="text-amber-500 shrink-0" />
                <p className="text-[12px] text-slate-600 dark:text-slate-400">
                  The link expires in <span className="text-amber-500 font-bold">15 minutes</span>. Check your spam folder if it doesn't arrive.
                </p>
              </div>

              <button
                onClick={() => { setSubmitted(false); setEmail(''); }}
                className="w-full h-10 text-[12px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/4 border border-slate-200 dark:border-white/8 rounded-xl hover:border-slate-300 dark:hover:border-white/15 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
              >
                Resend recovery email
              </button>

              <Link
                to="/login"
                className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-900 dark:text-amber-500 hover:underline underline-offset-4"
              >
                <Icon name="arrow_back" size="14px" weight={300} />
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
