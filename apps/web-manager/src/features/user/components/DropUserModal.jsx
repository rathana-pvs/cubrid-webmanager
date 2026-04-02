import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeDropUserModal, dropDatabaseUser, fetchDatabaseUsers } from '../userSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { 
  ModalStatusLoading, 
  ModalStatusSuccess, 
  ModalStatusError 
} from '../../../components/ds/feedback/ActionStatus';

export default function DropUserModal() {
  const dispatch = useDispatch();
  const { isDropUserModalOpen, dropUserData } = useSelector((state) => state.user, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);

  const { 
    state, 
    error: actionError, 
    startAction, 
    endSuccess, 
    endError, 
    resetAction,
    isLoading,
    isSuccess,
    isError
  } = useActionState();

  if (!isDropUserModalOpen || !dropUserData) return null;

  const handleDrop = async () => {
    startAction();
    try {
      await dispatch(dropDatabaseUser({ 
        hostUid: selectedHostUid, 
        dbname: dropUserData.dbname, 
        userName: dropUserData.userName 
      })).unwrap();
      endSuccess(`Identity @${dropUserData.userName} has been successfully purged from ${dropUserData.dbname}.`);
      dispatch(fetchDatabaseUsers({ hostUid: selectedHostUid, dbname: dropUserData.dbname }));
    } catch (err) {
      endError(typeof err === 'string' ? err : (err.message || 'Purge request rejected by foreign host boundary.'));
    }
  };

  const handleClose = () => {
    resetAction();
    dispatch(closeDropUserModal());
  };

  if (isLoading) {
    return (
      <Modal isOpen title="Purging Identity" icon="person_remove" onClose={handleClose} maxWidth="400px">
        <ModalStatusLoading 
          title="Executing Purge" 
          subtitle={`Synchronizing recursive deletion for @${dropUserData.userName} with target namespace.`}
        />
      </Modal>
    );
  }

  if (isSuccess) {
    return (
      <Modal isOpen title="Purge Successful" icon="check_circle" iconVariant="success" onClose={handleClose} maxWidth="400px">
        <ModalStatusSuccess 
          title="Identity Purged"
          message={`The account @${dropUserData.userName} has been completely removed from the registry.`}
          onConfirm={handleClose}
          confirmText="Acknowledge"
        />
      </Modal>
    );
  }

  if (isError) {
    return (
      <Modal isOpen title="Execution Error" icon="error" iconVariant="danger" onClose={resetAction} maxWidth="400px">
        <ModalStatusError 
          title="Operation Halted"
          error={actionError}
          onRetry={handleDrop}
          onCancel={resetAction}
          retryText="Retry Purge"
          cancelText="Dismiss"
        />
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isDropUserModalOpen}
      onClose={handleClose}
      title="Drop Database User"
      icon="person_remove"
      maxWidth="400px"
      footer={
        <div className="flex gap-3 w-full">
          <Button variant="ghost" onClick={handleClose} className="flex-1">Discard</Button>
          <Button variant="danger" onClick={handleDrop} className="flex-1">Drop User</Button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center p-2">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
          <Icon name="person_remove" size="lg" weight={300} className="text-rose-500" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Purge Confirmation</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
          Are you sure you want to drop user <span className="font-black text-slate-900 dark:text-white">"@{dropUserData.userName}"</span>?
        </p>
        <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 inline-flex items-center gap-2 mb-4">
           <Icon name="database" size="xs" className="text-slate-400" />
           <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{dropUserData.dbname}</span>
        </div>
        <p className="text-[11px] text-rose-500 font-bold uppercase tracking-widest bg-rose-500/5 px-4 py-2 rounded-xl border border-rose-500/10">
          Warning: This action is permanent.
        </p>
      </div>
    </Modal>
  );
}
