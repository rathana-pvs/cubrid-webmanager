import { useDispatch } from 'react-redux';
import { setSelectedHost } from '../../../host/hostSlice';
import { setActiveMainTab } from '../../layoutSlice';
import { Typography } from '../../../../components/ds/foundation/Typography';
import { Icon } from '../../../../components/ds/foundation/Icon';

export default function ServerListItem({ host, isSelected, isAuthorized, onContextMenu }) {
  const dispatch = useDispatch();

  return (
    <div
      title={`${host.address}:${host.port}`}
      className={`flex flex-col px-3 py-1.5 cursor-pointer transition-all select-none rounded group relative mb-0.5 border
        ${isSelected
          ? 'bg-amber-50/60 dark:bg-white/6 border-amber-200 dark:border-amber-500/30 shadow-xs'
          : 'bg-white dark:bg-white/2 border-slate-200 dark:border-white/[0.07] hover:bg-slate-50 dark:hover:bg-white/4 hover:border-slate-300 dark:hover:border-white/12'
        }`}
      onClick={() => {
        dispatch(setSelectedHost(host.uid));
      }}
      onDoubleClick={() => {
        if (isAuthorized) {
          dispatch(setActiveMainTab('host:' + host.uid));
        }
      }}
      onContextMenu={(e) => onContextMenu(e, host.alias || host.id, host.uid, host.alias || host.id)}
    >
      <div className="flex items-center gap-2.5 relative z-10">
        <div className={`shrink-0 w-7 h-7 rounded flex items-center justify-center transition-all
          ${isSelected 
            ? 'bg-amber-500 shadow-md shadow-amber-500/20' 
            : 'bg-slate-100 dark:bg-white/5 text-slate-400 border border-slate-200 dark:border-white/10'}`}>
          <Icon 
            name={isSelected ? 'dns' : 'storage'} 
            size="14px" 
            className={isSelected ? 'text-white' : 'text-slate-400 group-hover:text-amber-500'} 
            weight={isSelected ? 400 : 300}
          />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <Typography 
              variant="span" 
              className={`text-[12px] truncate tracking-tight transition-colors 
                ${isSelected ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-500 font-medium group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}

            >
              {host.alias || host.id}
            </Typography>
            {isAuthorized && (
              <div className="relative group/status">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              </div>
            )}
          </div>
        </div>
      </div>
      {isSelected && (
        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-r-full"></div>
      )}
    </div>

  );
}
