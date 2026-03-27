import { useSelector } from 'react-redux';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Icon } from '../../../components/ds/foundation/Icon';

export default function Footer() {
  const { selectedHostUid, hosts, authorizedHosts, hostEnvs } = useSelector((state) => state.host);
  const currentHost = hosts.find(h => h.uid === selectedHostUid);
  const isConnected = selectedHostUid && authorizedHosts.includes(selectedHostUid);
  const version = hostEnvs[selectedHostUid]?.CUBRIDVER || '11.2.0.4501';

  return (
    <footer className="bg-white dark:bg-bk-side border-t border-slate-200 dark:border-white/10 px-6 h-8 flex items-center justify-between font-sans">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          {selectedHostUid ? (
            <>
              <div className={`size-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-400 opacity-50'}`}></div>
              <Typography variant="caption" className="text-slate-600 dark:text-slate-400 font-medium">
                Connected to {currentHost?.address || 'unknown'}:{currentHost?.port || '1523'}
              </Typography>
            </>
          ) : (
            <Typography variant="caption" className="text-slate-400 italic">No host selected</Typography>
          )}
        </div>
        {selectedHostUid && (
          <Typography variant="caption" className="text-slate-400 opacity-60">Version {version}</Typography>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-400">
          <Icon name="text_snippet" size="xs"  weight={300} />
          <Typography variant="caption" className="font-medium">UTF-8</Typography>
        </div>
        <div className="flex items-center gap-2">
           <Typography 
             variant="caption" 
             className={`font-bold tracking-wider uppercase text-[9px] ${isConnected ? 'text-emerald-500' : 'text-slate-500 opacity-50'}`}
           >
            {isConnected ? 'Active Connection' : 'Disconnected'}
          </Typography>
        </div>
      </div>
    </footer>
  );
}
