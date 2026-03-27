import React from 'react';

const LoadingOverlay = ({
  isVisible,
  title = 'Processing',
  subtitle = 'Please wait while we complete your request...',
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-200 flex flex-col items-center justify-center bg-white/97 dark:bg-bk-side animate-in fade-in duration-200 rounded-xl overflow-hidden">

      {/* Soft ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] bg-bk-yellow/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-10">

        {/* Spinner stack */}
        <div className="relative w-[68px] h-[68px]">
          {/* Outer track */}
          <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
          {/* Main arc */}
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-bk-yellow animate-spin"
            style={{ animationDuration: '0.9s' }}
          />
          {/* Inner reversed arc */}
          <div
            className="absolute inset-[10px] rounded-full border-[1.5px] border-transparent border-b-bk-yellow/35 animate-spin"
            style={{ animationDuration: '1.7s', animationDirection: 'reverse' }}
          />
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-bk-yellow shadow-[0_0_10px_3px_rgba(255,193,7,0.3)] animate-pulse" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <h4 className="text-[14px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
            {title}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[200px]">
            {subtitle}
          </p>
        </div>

        {/* Sliding progress bar */}
        <div className="w-40 h-[2px] bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-bk-yellow rounded-full"
            style={{ animation: 'overlaySlide 1.5s ease-in-out infinite' }}
          />
        </div>

        {/* Status pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-white/4 border border-slate-100 dark:border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            In Progress
          </span>
        </div>

      </div>

      <style>{`
        @keyframes overlaySlide {
          0%   { transform: translateX(-100%); width: 50%; }
          50%  { transform: translateX(100%);  width: 60%; }
          100% { transform: translateX(200%);  width: 50%; }
        }
      `}</style>
    </div>
  );
};

export default LoadingOverlay;
