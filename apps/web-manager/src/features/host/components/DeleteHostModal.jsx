import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeDeleteHostModal, deleteHost } from '../hostSlice';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Icon } from '../../../components/ds/foundation/Icon';
import { useCM } from '../../../constants/useCM';

export default function DeleteHostModal() {
  const CM = useCM();
  const dispatch = useDispatch();
  const { isDeleteHostModalOpen, hostToDeleteUid, hostToDeleteAlias, loading, error: apiError } = useSelector((state) => state.host, shallowEqual);

  if (!isDeleteHostModalOpen) return null;

  const handleDelete = async () => {
    if (hostToDeleteUid) {
      dispatch(deleteHost(hostToDeleteUid));
    }
  };

  const handleClose = () => {
    dispatch(closeDeleteHostModal());
  };

  const consequences = [
    { icon: 'link_off', label: CM.activeConnectionsTerminated },
    { icon: 'key_off', label: 'Saved credentials and authentication tokens removed' },
    { icon: 'settings_backup_restore', label: 'Associated configuration profiles will be purged' },
  ];

  return (
    <Modal
      isOpen={isDeleteHostModalOpen}
      onClose={handleClose}
      title={CM.removeHostConnection}
      icon="delete_forever"
      iconVariant="danger"
      loading={loading}
      maxWidth="420px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button 
            variant="secondary" 
            onClick={handleClose}
            disabled={loading}
          >
            {CM.keepHost}
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            loading={loading}
            icon="delete_forever"
          >
            {CM.confirmRemoval}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Error Banner */}
        {apiError && (
          <div className="flex items-start gap-3 px-4 py-3 bg-rose-500/5 border border-rose-500/15 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
              <Icon name="error" size="xs" weight={300} className="text-rose-500" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <Typography variant="p" className="text-rose-500 font-bold text-[11px] leading-snug">{apiError}</Typography>
            </div>
          </div>
        )}

        {/* Danger Hero */}
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-lg shadow-rose-500/5 mb-4">
            <Icon name="warning" size="lg" weight={300} className="text-rose-500" />
          </div>
          <Typography variant="p" className="text-[13px] text-slate-900 dark:text-white font-bold leading-relaxed">
            Permanently remove <span className="text-rose-500">{hostToDeleteAlias || hostToDeleteUid}</span>?
          </Typography>
          <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium mt-1 max-w-[300px] leading-relaxed">
            This action is irreversible and cannot be undone.
          </Typography>
        </div>

        {/* Consequences */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">{CM.impactSummary}</Typography>
          </div>

          <div className="bg-slate-50/50 dark:bg-bk-main/30 border border-slate-100 dark:border-white/5 rounded-2xl p-3 space-y-0">
            {consequences.map((item, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/5 border border-rose-500/10 flex items-center justify-center text-rose-400 group-hover:bg-rose-500/10 transition-colors">
                    <Icon name={item.icon} size="xs" weight={300} />
                  </div>
                  {i < consequences.length - 1 && (
                    <div className="w-px h-3 bg-linear-to-b from-rose-500/20 to-transparent my-0.5"></div>
                  )}
                </div>
                <div className={`flex-1 ${i < consequences.length - 1 ? 'pb-2' : ''} pt-1`}>
                  <Typography variant="caption" className="text-slate-500 dark:text-slate-400 font-medium leading-snug">{item.label}</Typography>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

