import { useDispatch, useSelector } from 'react-redux';
import { closeStatusModal } from '../../features/layout/layoutSlice';

import { Icon } from '../ds/foundation/Icon';

export default function StatusModal() {
  const dispatch = useDispatch();
  const { statusModal } = useSelector((state) => state.layout);
  const { isOpen, type, title, message } = statusModal;

  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';
  
  const icon = isSuccess ? 'verified' : isError ? 'report' : 'info';
  const themeColor = isSuccess ? 'emerald' : isError ? 'rose' : 'bk-yellow';
  
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-500',
      btn: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20',
      accent: 'bg-emerald-500'
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-500',
      btn: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20',
      accent: 'bg-rose-500'
    },
    'bk-yellow': {
      bg: 'bg-bk-yellow/10',
      border: 'border-bk-yellow/20',
      text: 'text-bk-yellow',
      btn: 'bg-bk-yellow hover:bg-[#ffd700] text-bk-side shadow-bk-yellow/20',
      accent: 'bg-bk-yellow'
    }
  };

  const currentTheme = colorMap[themeColor];

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 font-sans text-left">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-bk-main/60 backdrop-blur-md animate-in fade-in duration-200"
        onClick={() => dispatch(closeStatusModal())}
      ></div>
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-bk-side rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] w-full max-w-[380px] border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all z-10 p-7 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        
        {/* Subtle Top Accent */}
        <div className={`absolute top-0 left-0 right-0 h-[2.5px] ${currentTheme.accent}`}></div>

        {/* Close Button Top Right */}
        <button 
          onClick={() => dispatch(closeStatusModal())}
          className="absolute top-4 right-4 w-7 h-7 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-slate-400 dark:text-slate-600 flex items-center justify-center group"
        >
          <Icon name="close" size="sm" weight={300} className="group-hover:rotate-90 transition-transform" />
        </button>

        {/* Icon Container */}
        <div className={`w-16 h-16 ${currentTheme.bg} ${currentTheme.border} border rounded-2xl flex items-center justify-center mb-5 rotate-3 animate-in zoom-in duration-300`}>
          <div className="w-11 h-11 rounded-xl bg-white dark:bg-bk-main shadow-xs flex items-center justify-center border border-white/10">
            <span className={`material-symbols-outlined text-2xl font-medium ${currentTheme.text}`}>
              {icon}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-8">
          <h3 className="text-[12px] font-medium text-slate-900 dark:text-white tracking-wide leading-none">
            {title || (isSuccess ? 'Response valid' : isError ? 'System fault' : 'Notification')}
          </h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium px-2">
            {message}
          </p>
        </div>

        <button 
          className={`w-full py-2.5 rounded-lg text-white text-[12px] font-medium tracking-wide transition-all active:scale-[0.98] shadow-lg ${currentTheme.btn}`}
          onClick={() => dispatch(closeStatusModal())}
        >
          {isSuccess ? 'Proceed' : 'Acknowledge'}
        </button>

        <div className="mt-4 flex items-center gap-1.5 opacity-20 group cursor-default">
          <div className="w-1 h-1 rounded-full bg-slate-400"></div>
          <div className="w-1 h-1 rounded-full bg-slate-400"></div>
          <div className="w-1 h-1 rounded-full bg-slate-400"></div>
        </div>
      </div>
    </div>
  );
}
