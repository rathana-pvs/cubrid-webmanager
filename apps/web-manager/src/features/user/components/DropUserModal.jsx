import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeDropUserModal, dropDatabaseUser } from '../userSlice';

import { Icon } from '../../../components/ds/foundation/Icon';

export default function DropUserModal() {
  const dispatch = useDispatch();
  const { isDropUserModalOpen, dropUserData, actionLoading } = useSelector((state) => state.user, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);

  if (!isDropUserModalOpen || !dropUserData) return null;

  const handleDrop = () => {
    dispatch(dropDatabaseUser({ 
      hostUid: selectedHostUid, 
      dbname: dropUserData.dbname, 
      userName: dropUserData.userName 
    }));
  };

  return (
    <div className="fixed inset-0 z-250 flex items-center justify-center p-4 bg-bk-main/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-bk-side w-full max-w-[400px] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-200 text-left">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
            <Icon name="person_remove" size="sm" weight={300} className="text-rose-500 text-2xl" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Drop Database User</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Are you sure you want to drop user <span className="font-bold text-slate-900 dark:text-white">"{dropUserData.userName}"</span> from database <span className="font-bold text-slate-900 dark:text-white">"{dropUserData.dbname}"</span>? This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button 
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              onClick={() => dispatch(closeDropUserModal())}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button 
              className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              onClick={handleDrop}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Drop User'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
