import { useState, useRef, useEffect } from 'react';

import { Icon } from '../ds/foundation/Icon';

/**
 * Premium Select Field Component
 * 
 * @param {Object} props
 * @param {string} props.value - Current selected value
 * @param {Function} props.onChange - Selection change handler
 * @param {Array<{value: string, label: string}>} props.options - List of options
 * @param {string} props.className - Additional class names for the container
 * @param {string} props.triggerClassName - Additional class names for the trigger button
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.isHighlight - Whether the field should be highlighted (active state)
 */
export default function SelectField({ 
  value, 
  onChange, 
  options = [], 
  className = '', 
  triggerClassName = '',
  disabled = false,
  placeholder = 'Select option',
  isHighlight = true
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full h-9 rounded-lg px-3 py-1.5 text-xs font-medium outline-hidden transition-all flex items-center justify-between border
          ${!isHighlight 
            ? 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/8' 
            : 'bg-bk-side border-white/10 text-slate-100 hover:border-bk-yellow/50 focus:border-bk-yellow focus:ring-4 focus:ring-bk-yellow/10'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen && isHighlight ? 'ring-4 ring-bk-yellow/10 border-bk-yellow/50' : ''}
          ${triggerClassName}
        `}
      >
        <span className="truncate">{displayLabel}</span>
        <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 z-100 bg-bk-side border border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-[10px] text-slate-500 italic text-center">No options available</div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    w-full px-4 py-2.5 text-left text-xs font-medium transition-all flex items-center justify-between group
                    ${value === opt.value 
                      ? 'bg-bk-yellow text-bk-side' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && (
                    <Icon name="check" size="sm" weight={300} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
