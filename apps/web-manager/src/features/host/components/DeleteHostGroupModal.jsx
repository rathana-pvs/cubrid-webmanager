import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeDeleteGroupModal, deleteHostGroup } from '../hostSlice';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Icon } from '../../../components/ds/foundation/Icon';
import { useCM } from '../../../constants/useCM';

export default function DeleteHostGroupModal() {
  const CM = useCM();
  const dispatch = useDispatch();
  const {
    isDeleteGroupModalOpen,
    groupToEditId,
    groupToEditName,
    loading,
    error: apiError,
  } = useSelector((state) => state.host, shallowEqual);

  if (!isDeleteGroupModalOpen) return null;

  const handleDelete = async () => {
    if (groupToEditId) {
      dispatch(deleteHostGroup(groupToEditId));
    }
  };

  const handleClose = () => {
    dispatch(closeDeleteGroupModal());
  };

  return (
    <Modal
      isOpen={isDeleteGroupModalOpen}
      onClose={handleClose}
      title={CM.deleteGroup}
      icon="delete_forever"
      iconVariant="danger"
      loading={loading}
      maxWidth="420px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {CM.cancel}
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={loading} icon="delete_forever">
            {CM.executeDiscard}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {apiError && (
          <div className="flex items-start gap-3 px-4 py-3 bg-rose-500/5 border border-rose-500/15 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
              <Icon name="error" size="xs" weight={300} className="text-rose-500" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <Typography variant="p" className="text-rose-500 font-bold text-[11px] leading-snug">{apiError}</Typography>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-lg shadow-rose-500/5 mb-4">
            <Icon name="warning" size="lg" weight={300} className="text-rose-500" />
          </div>
          <Typography variant="p" className="text-[13px] text-slate-900 dark:text-white font-bold leading-relaxed">
            Delete group <span className="text-rose-500">{groupToEditName || groupToEditId}</span>?
          </Typography>
          <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium mt-1 max-w-[320px] leading-relaxed">
            This will remove the group and all host connections inside it.
          </Typography>
        </div>
      </div>
    </Modal>
  );
}

