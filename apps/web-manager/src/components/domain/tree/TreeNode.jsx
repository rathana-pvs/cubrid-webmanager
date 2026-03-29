import React from 'react';
import { Icon } from '../../ds/foundation/Icon';
import { Typography } from '../../ds/foundation/Typography';
import { Skeleton } from '../../ds/layout/Skeleton';
import { StatusIndicator } from '../atoms/StatusIndicator';
import { theme } from '../../../styles/theme';

export const TreeNode = React.memo(({
  id,
  label,
  icon = 'folder',
  level = 1,
  isActive = false,
  isLoading = false,
  hasChildren = false,
  status,
  onToggle,
  onSelect,
  onContextMenu,
  onDoubleClick,
  children,
  open: controlledOpen,
}) => {
  const [isOpen, setIsOpen] = React.useState(controlledOpen || false);
  const indentClass = level === 1 ? theme.tree.levelOneIndent : theme.tree.levelDeepIndent;

  const handleToggle = (e) => {
    // Prevent toggle events from bubbling to parent TreeNode components
    e.stopPropagation();
    
    // Only proceed if this specific node was the one toggled
    if (e.target === e.currentTarget) {
      setIsOpen(e.target.open);
      if (e.target.open && onToggle) {
        onToggle();
      }
    }
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    if (onSelect) onSelect();
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e);
    }
  };

  const handleDoubleClick = (e) => {
    if (onDoubleClick) {
      e.stopPropagation();
      onDoubleClick(e);
    }
  };

  const summaryClasses = `
    flex items-center gap-1.5 px-2 py-[5px] w-full text-left transition-all duration-150
    cursor-pointer list-none rounded select-none group/node relative border border-transparent
    ${isActive
      ? 'bg-amber-500/6 dark:bg-amber-500/10 border-transparent text-amber-600 dark:text-amber-500'
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/4 hover:text-slate-900 dark:hover:text-slate-200'
    }
  `;

  // Active left indicator bar
  const ActiveBar = () => (
    <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-amber-500 rounded-full" />
  );

  // Leaf node (no children)
  if (!hasChildren && !children && !isLoading) {
    return (
      <button
        className={summaryClasses}
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
      >
        {isActive && <ActiveBar />}

        {/* Spacer for chevron alignment */}
        <span className="w-3 shrink-0" />

        <Icon
          name={icon}
          size="16px"
          weight={300}
          className={`shrink-0 transition-colors ${
            isActive
              ? 'text-amber-500'
              : 'text-slate-400 dark:text-slate-500 group-hover/node:text-slate-600 dark:group-hover/node:text-slate-300'
          }`}
        />

        <Typography
          variant="span"
          className={`text-[13px] font-mono truncate flex-1 ${
            isActive ? 'font-semibold' : 'font-medium'
          }`}
        >
          {label}
        </Typography>

        {status && <StatusIndicator status={status} animate={status === 'on'} />}
      </button>
    );
  }

  // Parent node (with children / expandable)
  return (
    <details
      className="group/details block"
      onToggle={handleToggle}
      open={controlledOpen}
    >
      <summary
        className={summaryClasses}
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
      >
        {isActive && <ActiveBar />}

        {/* Chevron */}
        <Icon
          name="chevron_right"
          size="14px"
          weight={400}
          className={`shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-90' : ''} ${
            isActive ? 'text-amber-500' : 'text-slate-400 dark:text-slate-600'
          }`}
        />

        {/* Node icon */}
        <Icon
          name={icon}
          size="16px"
          weight={300}
          className={`shrink-0 transition-colors ${
            isActive
              ? 'text-amber-500'
              : 'text-slate-400 dark:text-slate-500 group-hover/node:text-slate-600 dark:group-hover/node:text-slate-300'
          }`}
        />

        <Typography
          variant="span"
          className={`text-[13px] font-mono truncate flex-1 ${
            isActive ? 'font-semibold' : 'font-medium'
          }`}
        >
          {label}
        </Typography>

        {status && <StatusIndicator status={status} animate={status === 'on'} />}
      </summary>

      {/* Children container with guide line */}
      <div className={`${indentClass} border-l border-slate-200 dark:border-white/6 space-y-px mt-0.5 ml-[13px]`}>
        {isLoading ? (
          <div className="px-3 py-2 flex items-center gap-2 opacity-60">
            <Skeleton variant="text" width="100px" height="13px" />
          </div>
        ) : (
          children
        )}
      </div>
    </details>
  );
});
