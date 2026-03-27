import { useRef, useState, useLayoutEffect } from 'react';

/**
 * A reusable context menu wrapper that positions itself within the viewport.
 */
export default function ContextMenuWrapper({ x, y, children, onClose, width = "w-60" }) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: y, left: x });
  const [isPositioned, setIsPositioned] = useState(false);

  useLayoutEffect(() => {
    if (menuRef.current && !isPositioned) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newLeft = x;
      let newTop = y;

      // Check right edge
      if (x + rect.width > viewportWidth) {
        newLeft = x - rect.width;
      }

      // Check bottom edge
      if (y + rect.height > viewportHeight) {
        newTop = y - rect.height;
      }

      // Keep within bounds
      newLeft = Math.max(5, newLeft);
      newTop = Math.max(5, newTop);

      setPosition({ top: newTop, left: newLeft });
      setIsPositioned(true);
    }
  }, [x, y, isPositioned]);

  return (
    <div
      ref={menuRef}
      className={`fixed z-1000 ${width} bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.2)] py-1.5 animate-in fade-in zoom-in-95 duration-200 context-menu-container ${isPositioned ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute top-0 left-4 right-4 h-px bg-linear-to-r from-transparent via-bk-yellow/20 to-transparent"></div>
      {children}
    </div>
  );
}
