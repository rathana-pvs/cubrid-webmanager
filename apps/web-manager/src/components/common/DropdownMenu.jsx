import { useState, useRef, useCallback, useLayoutEffect } from 'react';

/**
 * Reusable submenu component with hover delay.
 * Aligned with the "Technical Compact" design system.
 */
export function SubMenu({ icon, iconColor = '', label, children, width = 'w-56', gap = 'ml-1' }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 'right', y: 'bottom' });
  const [isPositioned, setIsPositioned] = useState(false);
  const timerRef = useRef(null);
  const menuRef = useRef(null);
  const containerRef = useRef(null);

  const handleEnter = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  }, []);

  const handleLeave = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setOpen(false);
      setIsPositioned(false);
    }, 120);
  }, []);

  useLayoutEffect(() => {
    if (open && menuRef.current && containerRef.current && !isPositioned) {
      const parentRect = containerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newX = 'right';
      let newY = 'bottom';

      if (parentRect.right + menuRect.width > viewportWidth) {
        newX = 'left';
      }
      
      if (parentRect.top + menuRect.height > viewportHeight) {
        newY = 'top';
      }

      setPosition({ x: newX, y: newY });
      setIsPositioned(true);
    }
  }, [open, isPositioned]);

  return (
    <div ref={containerRef} className="relative px-1" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button className={`w-full text-left px-2.5 py-2 text-[12px] font-medium tracking-wide transition-all rounded-md flex items-center justify-between group
        ${open ? 'bg-bk-yellow/10 text-bk-yellow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-bk-yellow'}`}>
        <span className="flex items-center gap-2.5">
          {icon && (
            <span className={`material-symbols-outlined text-[18px] transition-colors 
              ${open ? 'text-bk-yellow' : (iconColor || 'text-slate-400 dark:text-slate-500 group-hover:text-bk-yellow')}`}>
              {icon}
            </span>
          )}
          <span>{label}</span>
        </span>
        <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 
          ${open ? 'text-bk-yellow scale-110' : 'text-slate-400 dark:text-slate-600'}`}>
          {position.x === 'right' ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      {open && (
        <div 
          ref={menuRef}
          className={`absolute ${position.y === 'bottom' ? 'top-0' : 'bottom-0'} 
            ${position.x === 'right' ? 'left-full ml-1' : 'right-full mr-1'} 
            ${width} bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-xl 
            shadow-[0_4px_20px_rgba(0,0,0,0.15)] p-1.5 z-1000 animate-in fade-in transition-all duration-200
            ${isPositioned ? 'opacity-100 scale-100' : 'opacity-0 scale-95 origin-left'}`}
        >
          {/* Subtle Decorative Side Bar */}
          <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-bk-yellow/20 rounded-full"></div>
          <div className="space-y-0.5">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reusable top-level dropdown menu with hover delay.
 * Adheres to the "Technical Compact" design language.
 */
export function DropdownMenu({ label, children, width = 'w-52' }) {
  const [open, setOpen] = useState(false);
  const [align, setAlign] = useState('left');
  const [isPositioned, setIsPositioned] = useState(false);
  const timerRef = useRef(null);
  const menuRef = useRef(null);

  const handleEnter = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  }, []);

  const handleLeave = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setOpen(false);
      setIsPositioned(false);
    }, 120);
  }, []);

  useLayoutEffect(() => {
    if (open && menuRef.current && !isPositioned) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      let newAlign = 'left';
      if (rect.right > viewportWidth) {
        newAlign = 'right';
      } else if (rect.left < 0) {
        newAlign = 'left';
      }

      setAlign(newAlign);
      setIsPositioned(true);
    }
  }, [open, isPositioned]);

  return (
    <div className="relative font-sans" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium tracking-wide transition-all duration-200
        ${open ? 'text-bk-yellow bg-bk-yellow/5' : 'text-slate-600 dark:text-slate-400 hover:text-bk-yellow'}`}>
        <span>{label}</span>
        <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${open ? 'rotate-180 text-bk-yellow' : 'text-slate-400'}`}>
          expand_more
        </span>
      </button>

      {open && (
        <div 
          ref={menuRef}
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full mt-2
            ${width} bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-xl 
            shadow-[0_4px_25px_rgba(0,0,0,0.2)] p-1.5 z-1000 animate-in fade-in transition-all duration-200
            ${isPositioned ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'}`}
        >
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-4 right-4 h-[2px] bg-linear-to-r from-transparent via-bk-yellow/30 to-transparent"></div>
          
          <div className="space-y-0.5">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Enhanced menu item for the professional ecosystem.
 */
export function MenuItem({ icon, iconColor = '', label, onClick, href, disabled = false }) {
  const baseClasses = `flex items-center gap-3 px-3 py-2 text-[12px] font-medium tracking-wide transition-all w-full text-left rounded-lg font-sans relative group overflow-hidden`;
  const stateClasses = disabled 
    ? 'opacity-30 cursor-not-allowed text-slate-400' 
    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-bk-yellow active:scale-[0.98]';

  const content = (
    <>
      {icon && (
        <span className={`material-symbols-outlined text-[18px] transition-all 
          ${disabled ? 'text-slate-300' : (iconColor || 'text-slate-400 dark:text-slate-500 group-hover:text-bk-yellow group-hover:scale-110')}`}>
          {icon}
        </span>
      )}
      <span className="flex-1 truncate">{label}</span>
      
      {/* Decorative hover indicator */}
      {!disabled && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-4 bg-bk-yellow transition-all duration-200 group-hover:w-[2px] rounded-r"></div>
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <a className={`${baseClasses} ${stateClasses}`} href={href}>
        {content}
      </a>
    );
  }

  return (
    <button className={`${baseClasses} ${stateClasses}`} onClick={disabled ? undefined : onClick} disabled={disabled}>
      {content}
    </button>
  );
}

export function MenuDivider() {
  return (
    <div className="px-3 py-1.5 flex items-center gap-2 opacity-50">
      <div className="h-px flex-1 bg-linear-to-r from-slate-100 dark:from-slate-800 to-transparent"></div>
      <div className="flex gap-1">
        <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800"></div>
        <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800"></div>
      </div>
    </div>
  );
}
