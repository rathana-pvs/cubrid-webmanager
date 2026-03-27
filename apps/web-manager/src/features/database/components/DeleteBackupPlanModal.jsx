import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeDeleteBackupPlanModal, deleteBackupSchedule, fetchBackupSchedule } from '../databaseSlice';
import { showStatusModal } from '../../layout/layoutSlice';

import { Icon } from '../../../components/ds/foundation/Icon';

export default function DeleteBackupPlanModal() {
  const dispatch = useDispatch();
  const { isDeleteBackupPlanModalOpen, selectedDatabase, selectedBackupId, actionLoading } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isDeleteBackupPlanModalOpen) return null;

  const handleDelete = async () => {
    if (!selectedHostUid || !selectedDatabase || !selectedBackupId) return;
    
    setIsDeleting(true);
    try {
      await dispatch(deleteBackupSchedule({ 
        hostUid: selectedHostUid, 
        dbname: selectedDatabase, 
        payload: { backupid: selectedBackupId } 
      })).unwrap();
      
      dispatch(closeDeleteBackupPlanModal());
      dispatch(showStatusModal({
        type: 'success',
        title: 'Deletion Success',
        message: `Backup plan "${selectedBackupId}" for database "${selectedDatabase}" has been removed.`
      }));
      
      // Refresh the list
      dispatch(fetchBackupSchedule({ hostUid: selectedHostUid, dbname: selectedDatabase }));
    } catch (err) {
      console.error('Delete backup plan failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-bk-main/40 backdrop-blur-xs animate-in fade-in duration-200 font-sans text-left">
      <div className="bg-white dark:bg-bk-side w-full max-w-[400px] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col relative text-left">
        
        {/* Subtle Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-rose-500/60"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-bk-main/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <Icon name="delete_forever" size="sm" weight={300} className="text-rose-500 text-xl" />
            </div>
            <div>
              <h3 className="text-[12px] font-medium text-slate-900 dark:text-white leading-none tracking-wide text-left">Confirm Deletion</h3>
            </div>
          </div>
          <button 
            disabled={isDeleting}
            onClick={() => dispatch(closeDeleteBackupPlanModal())}
            className="w-7 h-7 rounded-md hover:bg-slate-200 dark:hover:bg-white/5 transition-all text-slate-400 dark:text-slate-500 flex items-center justify-center group"
          >
            <Icon name="close" size="sm" weight={300} className="text-lg group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1 text-left overflow-visible">
          <div className="flex flex-col items-center justify-center space-y-4 py-2">
            <div className="w-16 h-16 bg-rose-500/5 rounded-full flex items-center justify-center border border-rose-500/10 shadow-inner">
               <Icon name="warning" size="sm" weight={300} className="text-3xl text-rose-500 animate-pulse" />
            </div>
            
            <div className="text-center space-y-2">
              <h4 className="text-[14px] font-medium text-slate-800 dark:text-white">Delete Backup Plan?</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                You are about to permanently remove the backup plan <span className="text-rose-500 font-bold uppercase tracking-tight">"{selectedBackupId}"</span> for database <span className="font-bold text-slate-700 dark:text-slate-200">"{selectedDatabase}"</span>. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-bk-main/30 border border-slate-100 dark:border-white/5 rounded-lg">
             <div className="flex items-start gap-3">
                <Icon name="info" size="sm" weight={300} className="text-amber-500 mt-0.5" />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                  Note: This only removes the schedule. Existing backup files on the disk will remain untouched.
                </p>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-bk-main/80 backdrop-blur-xs flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button 
            disabled={isDeleting}
            className="px-5 py-1.5 text-[11px] font-medium tracking-wide text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 rounded-sm hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-left"
            onClick={() => dispatch(closeDeleteBackupPlanModal())}
          >
            Cancel
          </button>
          <button 
            disabled={isDeleting}
            className={`px-6 py-1.5 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white text-[11px] font-medium tracking-wide rounded-sm shadow-xs shadow-rose-500/20 transition-all flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-50 text-left`}
            onClick={handleDelete}
          >
            {isDeleting ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Icon name="delete" size="sm" weight={300} />
                <span>Delete Plan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
