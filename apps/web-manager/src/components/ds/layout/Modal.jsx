import React, { useEffect, useRef } from 'react';
import { Icon } from '../foundation/Icon';
import { Typography } from '../foundation/Typography';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  iconVariant = 'primary',
  footer,
  maxWidth = 'max-w-md',
  children,
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const iconStyles = {
    primary: 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };

  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-bk-main/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidth.startsWith('max-w-') ? maxWidth : ''} bg-white dark:bg-bk-side rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-800 transform transition-all flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden text-left`}
        style={!maxWidth.startsWith('max-w-') ? { maxWidth } : {}}
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-amber-500"></div>

        <button
          type="button"
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 w-7 h-7 rounded-md transition-all flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 z-10"
          onClick={onClose}
        >
          <span className="sr-only">Close</span>
          <Icon name="close" size="md"  weight={300} />
        </button>

        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-bk-main/50 flex gap-3 items-center">
          {icon && (
            <div className={`shrink-0 flex items-center justify-center h-8 w-8 rounded-lg border ${iconStyles[iconVariant] || iconStyles.primary}`}>
              <Icon name={icon} size="md"  weight={300} />
            </div>
          )}
          <div className="flex-1">
            <Typography variant="h4" className="text-[12px] font-medium text-slate-900 dark:text-white leading-none tracking-wide">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="p" className="text-[10px] mt-1 text-slate-500 font-medium">
                {subtitle}
              </Typography>
            )}
          </div>
        </div>

        <div className="px-5 py-5 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>

        {footer && (
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-bk-main/80 backdrop-blur-xs rounded-b-xl border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
