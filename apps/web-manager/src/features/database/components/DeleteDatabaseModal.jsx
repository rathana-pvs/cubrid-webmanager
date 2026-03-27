import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeDeleteDBModal, deleteDatabase, fetchDatabaseStartInfo } from '../databaseSlice';
import { showStatusModal } from '../../layout/layoutSlice';
import { databaseApi } from '../databaseApi';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';

// ── Small flag toggle card (single-purpose)
function DangerToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 cursor-pointer
        ${checked
          ? 'bg-rose-500/8 border-rose-500/30'
          : 'bg-slate-50 dark:bg-white/2 border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/4'}`}
    >
      <div className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-all
        ${checked ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-400'}`}>
        <Icon name="folder_delete" size="sm" weight={300} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11.5px] font-semibold leading-none mb-0.5 transition-colors ${checked ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
          Also delete backup volumes
        </p>
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
          Remove all secondary backup data and snapshots linked to this database.
        </p>
      </div>
      {/* Toggle pill */}
      <div className={`shrink-0 w-9 h-5 rounded-full transition-all duration-200 relative ${checked ? 'bg-rose-500' : 'bg-slate-200 dark:bg-white/10'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${checked ? 'left-[calc(100%-18px)]' : 'left-0.5'}`} />
      </div>
    </button>
  );
}

export default function DeleteDatabaseModal() {
  const dispatch = useDispatch();
  const { isDeleteDBModalOpen, selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);

  const [step, setStep] = useState(1); // 1: Review, 2: Auth
  const [deleteBackup, setDeleteBackup] = useState(false);
  const [volumeInfo, setVolumeInfo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dbId, setDbId] = useState('dba');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isDeleteDBModalOpen && selectedDatabase && selectedHostUid) {
      setStep(1);
      setDbId('dba');
      setPassword('');
      setError(null);
      setDeleteBackup(false);
      setLoading(true);
      databaseApi.getVolumeInfo(selectedHostUid, selectedDatabase)
        .then(res => {
          if (res?.spaceinfo) {
            const pageSize = parseInt(res.pagesize || 0);
            setVolumeInfo(
              res.spaceinfo.map(item => ({
                name: item?.name || item?.spacename || '—',
                type: item?.type || '—',
                path: item?.path || item?.location || '—',
                sizeMB: item?.totalpage
                  ? ((parseInt(item.totalpage) * pageSize) / (1024 * 1024)).toFixed(1)
                  : '—',
                free: item?.freepage ?? '—',
              }))
            );
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isDeleteDBModalOpen, selectedDatabase, selectedHostUid]);

  const handleConfirm = async () => {
    if (error) {
      setError(null);
      setPassword('');
      return;
    }
    if (step === 1) { setStep(2); return; }

    setProcessing(true);
    try {
      const loginRes = await databaseApi.loginDatabase(selectedHostUid, selectedDatabase, {
        id: dbId, password,
      });
      if (loginRes.success || loginRes.status === 'success' || (!loginRes.error && !loginRes.code)) {
        await dispatch(deleteDatabase({
          hostUid: selectedHostUid,
          dbname: selectedDatabase,
          payload: { delbackup: deleteBackup ? 'y' : 'n' },
        })).unwrap();
        dispatch(showStatusModal({
          type: 'success',
          title: 'Database deleted',
          message: `"${selectedDatabase}" and its volumes have been permanently removed.`,
        }));
        dispatch(fetchDatabaseStartInfo(selectedHostUid));
        dispatch(closeDeleteDBModal());
      } else {
        throw loginRes;
      }
    } catch (err) {
      setError(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => dispatch(closeDeleteDBModal());

  if (!isDeleteDBModalOpen) return null;

  const typeColors = {
    'Data': 'text-sky-500 bg-sky-500/8 border-sky-500/20',
    'Index': 'text-violet-500 bg-violet-500/8 border-violet-500/20',
    'Temp': 'text-amber-500 bg-amber-500/8 border-amber-500/20',
    'Active_log': 'text-emerald-500 bg-emerald-500/8 border-emerald-500/20',
    'Archive_log': 'text-slate-400 bg-slate-400/8 border-slate-400/20',
  };

  const getTypeStyle = (type) =>
    typeColors[type] || 'text-slate-400 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10';

  return (
    <Modal
      isOpen={isDeleteDBModalOpen}
      onClose={handleClose}
      title={step === 1 ? 'Delete Database' : (error ? 'Authorization Failed' : 'Security Checkpoint')}
      subtitle={step === 1 ? 'Review volumes and confirm permanent removal' : 'Verify credentials to authorize destruction'}
      icon="delete_forever"
      iconVariant="danger"
      maxWidth={step === 1 ? '640px' : '440px'}
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex-1">
            {step === 2 && !error && !processing && (
              <Button variant="ghost" onClick={() => setStep(1)} icon="arrow_back">
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {(step === 1 || error) && (
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            )}
            <Button
              onClick={handleConfirm}
              disabled={processing || loading}
              loading={processing}
              icon={error ? 'refresh' : (step === 1 ? 'arrow_forward' : 'delete_forever')}
              className={!error
                ? (step === 1
                  ? 'bg-rose-500 hover:bg-rose-600! text-white! border-rose-500!'
                  : 'bg-rose-500 hover:bg-rose-600! text-white! border-rose-500!')
                : ''}
            >
              {error ? 'Retry' : step === 1 ? 'Proceed to verify' : 'Delete permanently'}
            </Button>
          </div>
        </div>
      }
    >
      {/* ── STEP 1: Review ── */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">

          {/* DB Name banner */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Icon name="database" size="sm" weight={300} className="text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-rose-500/70 mb-0.5">Target database</p>
              <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">{selectedDatabase}</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-rose-500">Destructive</span>
            </div>
          </div>

          {/* Warning callout */}
          <div className="flex gap-2.5 px-3.5 py-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
            <Icon name="warning" size="sm" weight={300} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10.5px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              This action is <strong className="text-amber-500">permanent</strong>. All database files, volumes, and logs listed below will be erased from disk and cannot be recovered.
            </p>
          </div>

          {/* Volume list */}
          <div className="rounded-xl border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Volumes to be deleted</p>
              {!loading && volumeInfo.length > 0 && (
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{volumeInfo.length} volumes</span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2.5 py-8 text-slate-400">
                <div className="w-4 h-4 border-2 border-slate-200 dark:border-white/10 border-t-amber-500 rounded-full animate-spin" />
                <span className="text-[11px] font-medium">Fetching volume info…</span>
              </div>
            ) : volumeInfo.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <span className="text-[11px] font-medium">No volumes found</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {volumeInfo.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors">
                    <Icon name="hard_drive" size="sm" weight={300} className="text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-none mb-0.5">{v.name}</p>
                      <p className="text-[9.5px] text-slate-400 font-medium truncate">{v.path}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold border ${getTypeStyle(v.type)}`}>
                      {v.type}
                    </span>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-200 leading-none">{v.sizeMB} MB</p>
                      <p className="text-[9px] text-slate-400 font-medium">{v.free} free pg</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete backup toggle */}
          <DangerToggle checked={deleteBackup} onChange={setDeleteBackup} />
        </div>
      )}

      {/* ── STEP 2: Auth ── */}
      {step === 2 && !error && !processing && (
        <div className="space-y-5 py-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-4 p-4 bg-rose-500/5 border border-rose-500/15 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Icon name="lock" size="md" weight={300} className="text-rose-500" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-800 dark:text-white mb-0.5">Authorization required</p>
              <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                Confirm your database credentials to permanently delete{' '}
                <span className="text-rose-500 font-bold">{selectedDatabase}</span>.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label="Username"
              value={dbId}
              onChange={e => setDbId(e.target.value)}
              placeholder="dba"
              icon="person"
              autoFocus
            />
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              placeholder="••••••••"
              icon="key"
            />
          </div>

          <p className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium text-center leading-relaxed px-2">
            This is the final step. After confirmation, all data will be permanently erased.
          </p>
        </div>
      )}

      {/* ── STEP 2: Processing ── */}
      {step === 2 && processing && !error && (
        <div className="flex flex-col items-center justify-center py-14 space-y-5 animate-in fade-in duration-200">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-rose-500/10" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-rose-500 animate-spin" style={{ animationDuration: '0.9s' }} />
            <div className="absolute inset-[10px] rounded-full border-[1.5px] border-transparent border-b-rose-500/30 animate-spin" style={{ animationDuration: '1.7s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_3px_rgba(244,63,94,0.3)] animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-[14px] font-bold text-slate-800 dark:text-white tracking-tight">Deleting database…</p>
            <p className="text-[11px] text-slate-500 font-medium">Removing volumes and erasing all data assets</p>
          </div>
          <div className="w-32 h-[2px] bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ animation: 'overlaySlide 1.5s ease-in-out infinite' }} />
          </div>
          <style>{`
            @keyframes overlaySlide {
              0%   { transform: translateX(-100%); width: 50%; }
              50%  { transform: translateX(100%);  width: 60%; }
              100% { transform: translateX(200%);  width: 50%; }
            }
          `}</style>
        </div>
      )}

      {/* ── Error state ── */}
      {error && (
        <div className="py-4 space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)] relative z-10">
                <Icon name="error" size="md" weight={300} className="text-white" />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[13px] font-bold text-slate-800 dark:text-white">Authentication failed</p>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[260px] mx-auto">
                {typeof error === 'string' ? error : 'Invalid credentials or the operation was rejected by the server.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
