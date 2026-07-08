import { useSelector, shallowEqual } from 'react-redux';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Icon } from '../../../components/ds/foundation/Icon';
import { useCM } from '../../../constants/useCM';

export default function Footer() {
  const CM = useCM();
  const { selectedHostUid, hosts, authorizedHosts, hostEnvs } = useSelector((state) => state.host, shallowEqual);
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
                {CM.connectedTo(`${currentHost?.address || CM.unknownFallback}:${currentHost?.port || '1523'}`)}
              </Typography>
            </>
          ) : (
            <Typography variant="caption" className="text-slate-400 italic">{CM.noHostSelected}</Typography>
          )}
        </div>
        {selectedHostUid && (
          <Typography variant="caption" className="text-slate-400 opacity-60">{CM.version} {version}</Typography>
        )}
      </div>

      <div />
    </footer>
  );
}
