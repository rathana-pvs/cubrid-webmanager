import { useDispatch } from 'react-redux';
import { setSelectedHost } from '../../../host/hostSlice';
import { setActiveMainTab } from '../../layoutSlice';
import { Icon } from '../../../../components/ds/foundation/Icon';

const HA_ROLE_CONFIG = {
  master: {
    icon: 'star',
    label: 'Master',
    className: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
  },
  slave: {
    icon: 'settings_backup_restore',
    label: 'Slave',
    className: 'bg-slate-500/10 border-slate-400/20 text-slate-500 dark:text-slate-400',
  },
  replica: {
    icon: 'copy_all',
    label: 'Replica',
    className: 'bg-blue-500/10 border-blue-400/20 text-blue-600 dark:text-blue-400',
  },
};

export default function ServerListItem({
  host,
  isSelected,
  isAuthorized,
  haInfo,
  onContextMenu,
  compact = false,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
}) {
  const dispatch = useDispatch();

  const getInferredHaInfo = () => {
    if (haInfo?.isHA) return haInfo;
    const alias = (host.alias || '').toLowerCase();
    if (alias.includes('(master)')) return { isHA: true, currentNodeType: 'master' };
    if (alias.includes('(slave)')) return { isHA: true, currentNodeType: 'slave' };
    if (alias.includes('(replica)')) return { isHA: true, currentNodeType: 'replica' };
    return null;
  };

  const activeHaInfo = getInferredHaInfo();
  const haRole = activeHaInfo?.currentNodeType;
  const roleConfig = haRole ? HA_ROLE_CONFIG[haRole] : null;

  // Strip HA role tags from display name for cleanliness
  const displayName = (host.alias || host.id)
    .replace(/\s*\(master\)/i, '')
    .replace(/\s*\(slave\)/i, '')
    .replace(/\s*\(replica\)/i, '')
    .trim();

  return (
    <div
      title={`${host.address}:${host.port}`}
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      className={`relative flex items-center gap-2.5 py-1.5 select-none transition-all duration-150 group
        ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        ${isDragging ? 'opacity-40' : ''}
        ${compact ? 'pl-6 pr-2' : 'pl-3 pr-2'}
        ${isSelected
          ? 'bg-amber-500/8 dark:bg-amber-500/10'
          : 'hover:bg-slate-100/80 dark:hover:bg-white/[0.04]'
        }`}
      onClick={() => {
        dispatch(setSelectedHost(host.uid));
      }}
      onDoubleClick={() => {
        if (isAuthorized) dispatch(setActiveMainTab('host:' + host.uid));
      }}
      onContextMenu={(e) => {
        // Prevent bubbling to group TreeNode context menu
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e, host.alias || host.id, host.uid, host.alias || host.id);
      }}
    >
      {/* Selected accent bar */}
      <div
        className={`absolute left-0 top-0.5 bottom-0.5 w-[3px] rounded-r-full transition-all duration-200 ${
          isSelected ? 'bg-amber-500 opacity-100' : 'opacity-0'
        }`}
      />

      {/* Status dot */}
      <div className="shrink-0 flex items-center justify-center w-4">
        {isAuthorized ? (
          <span className="relative flex w-1.5 h-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
            <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" />
          </span>
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full flex-none transition-colors ${
            isSelected
              ? 'bg-amber-400/60'
              : 'bg-slate-300 dark:bg-white/[0.12] group-hover:bg-slate-400 dark:group-hover:bg-white/20'
          }`} />
        )}
      </div>

      {/* Server name */}
      <span className={`flex-1 min-w-0 text-[12.5px] leading-none truncate font-medium transition-colors ${
        isSelected
          ? 'text-amber-700 dark:text-amber-400 font-semibold'
          : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
      }`}>
        {displayName}
      </span>

      {/* Right side: HA role badge */}
      {roleConfig && (
        <span className={`shrink-0 inline-flex items-center justify-center w-[56px] h-4 rounded border text-[8.5px] font-black leading-none transition-all ${roleConfig.className}`}>
          {roleConfig.label}
        </span>
      )}
    </div>
  );
}
