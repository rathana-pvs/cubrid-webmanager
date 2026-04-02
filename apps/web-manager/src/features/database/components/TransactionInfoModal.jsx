import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeTransactionInfoModal, openKillTransactionModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';
import KillTransactionModal from './KillTransactionModal';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Typography } from '../../../components/ds/foundation/Typography';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

export default function TransactionInfoModal() {
  const dispatch = useDispatch();
  const { isTransactionInfoModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  
  const [view, setView] = useState(VIEW_LOADING);
  const [transactions, setTransactions] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedTranIndex, setSelectedTranIndex] = useState(null);

  const fetchTransactionInfo = async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    
    setView(VIEW_LOADING);
    setErrorMsg('');

    try {
      const payload = {
        dbuser: 'dba',
        dbpasswd: ''
      };
      const response = await databaseApi.getTransactionInfo(selectedHostUid, selectedDatabase, payload);
      const tranList = response?.transactioninfo?.[0]?.transaction || [];
      setTransactions(tranList);
      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(err.response?.data?.note || err.response?.data?.message || 'The diagnostic sequence was interrupted while fetching transaction handles.');
      setView(VIEW_ERROR);
    }
  };

  useEffect(() => {
    if (isTransactionInfoModalOpen) {
      fetchTransactionInfo();
      setSelectedTranIndex(null);
    }
  }, [isTransactionInfoModalOpen, selectedHostUid, selectedDatabase]);

  if (!isTransactionInfoModalOpen) return null;

  const handleOpenKillModal = () => {
    const selectedTran = transactions.find(t => String(t.tranindex) === String(selectedTranIndex));
    if (selectedTran) {
      dispatch(openKillTransactionModal(selectedTran));
    }
  };

  const handleClose = () => dispatch(closeTransactionInfoModal());

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Transaction Monitor" icon="swap_horiz" onClose={handleClose} maxWidth="540px">
        <div className="flex flex-col items-center justify-center py-14 space-y-6 animate-in fade-in duration-200">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 animate-spin" style={{ animationDuration: '0.9s' }} />
            <div className="absolute inset-0 flex items-center justify-center text-amber-500">
              <Icon name="swap_horiz" size="md" weight={400} className="animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1.5 px-8">
            <Typography variant="h4" className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight text-amber-500">Syncing Diagnostics</Typography>
            <Typography variant="p" className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
              Scanning active OID handles and isolation levels for <span className="font-black text-slate-900 dark:text-white font-mono">{selectedDatabase}</span>.
            </Typography>
          </div>
          <div className="w-32 h-[2px] bg-slate-100 dark:bg-white/4 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ animation: 'modalSlideX 1.5s ease-in-out infinite' }} />
          </div>
          <style>{`
            @keyframes modalSlideX {
              0%   { transform: translateX(-100%); width: 50%; }
              50%  { transform: translateX(100%);  width: 60%; }
              100% { transform: translateX(200%);  width: 50%; }
            }
          `}</style>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Sync Failed" icon="swap_horiz" iconVariant="danger" onClose={handleClose} maxWidth="540px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <Icon name="error" size="md" weight={300} className="text-white" />
          </div>
          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight text-rose-500">Action Interrupted</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed">
              System could not synchronize with the transaction controller for <span className="font-black text-slate-900 dark:text-white font-mono">{selectedDatabase}</span>.
            </Typography>
          </div>
          <div className="w-full max-w-[340px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="terminal" size="xs" weight={300} className="text-rose-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Diagnostic Trace</span>
            </div>
            <Typography variant="caption" className="text-rose-400/80 font-mono leading-relaxed break-words">
              {errorMsg}
            </Typography>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>Dismiss</Button>
            <Button variant="primary" icon="refresh" onClick={fetchTransactionInfo}>Retry Sync</Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  return (
    <Modal
      isOpen={isTransactionInfoModalOpen}
      onClose={handleClose}
      title="Transaction Monitor"
      subtitle={selectedDatabase ? `Monitoring active handles for: ${selectedDatabase}` : 'Global Diagnostics'}
      icon="swap_horiz"
      maxWidth="1100px"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Button 
              variant="danger"
              disabled={!selectedTranIndex}
              onClick={handleOpenKillModal}
              icon="cancel"
              className="min-w-[140px] shadow-lg shadow-rose-500/20!"
            >
              Kill Process
            </Button>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" onClick={handleClose}>Acknowledge</Button>
            <Button 
              onClick={fetchTransactionInfo}
              icon="refresh"
              className="min-w-[140px]"
            >
              Sync Latest
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-[540px] animate-in fade-in slide-in-from-bottom-4 duration-400">
        <div className="mb-4 flex items-center justify-between bg-slate-50/80 dark:bg-black/20 border border-slate-200 dark:border-white/8 rounded-xl px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <Icon name="sensors" size="sm" weight={300} />
            </div>
            <div className="min-w-0">
              <Typography variant="label" className="text-slate-400 uppercase tracking-widest font-bold text-[10px] block leading-none">Status: <span className="text-emerald-500 ml-1">Live Telemetry</span></Typography>
              <Typography variant="caption" className="text-slate-500 dark:text-slate-400 font-medium mt-1 leading-none">{transactions.length} active process handles identified</Typography>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Typography variant="span" className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/8 text-[9px] font-black uppercase tracking-tighter text-slate-500">
              Isolation: Read Committed
            </Typography>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative rounded-xl border border-slate-200 dark:border-white/8 bg-white dark:bg-transparent overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 dark:bg-white/3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 dark:border-white/5 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3">Handle Idx</th>
                  <th className="px-6 py-3">User Session</th>
                  <th className="px-6 py-3">Network Anchor</th>
                  <th className="px-6 py-3 text-center">Process PID</th>
                  <th className="px-6 py-3">Binary Identity</th>
                  <th className="px-6 py-3 text-right">Latent State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/4">
                {transactions.length > 0 ? (
                  transactions.map((tran, idx) => {
                    const tranIndex = tran.tranindex;
                    const isSelected = String(selectedTranIndex) === String(tranIndex);
                    const isActive = String(tranIndex).includes('ACTIVE');
                    
                    return (
                      <tr 
                        key={idx} 
                        className={`group cursor-pointer transition-all duration-200 ${isSelected ? 'bg-amber-500/8 dark:bg-amber-500/12' : 'hover:bg-slate-50/50 dark:hover:bg-white/2'}`}
                        onClick={() => setSelectedTranIndex(tranIndex)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                              {isActive && <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75"></div>}
                            </div>
                            <span className={`font-mono text-[11px] font-bold ${isSelected ? 'text-amber-500' : 'text-slate-600 dark:text-slate-400'}`}>
                              {tranIndex}
                            </span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-[13px] font-bold transition-colors ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {tran['@user'] || '-'}
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {tran.host}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/6 text-[10px] font-black font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 group-hover:border-slate-300 dark:group-hover:border-white/20 transition-colors">
                            {tran.pid}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[11.5px] font-medium text-slate-500 dark:text-slate-500 italic max-w-[200px] truncate">
                          {tran.program}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-mono text-[12px] font-black tracking-tight ${parseFloat(tran.query_time) > 10 ? 'text-rose-500' : parseFloat(tran.query_time) > 2 ? 'text-amber-500' : 'text-slate-400'}`}>
                            {tran.query_time}s
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                        <Icon name="inventory_2" size="lg" weight={100} className="text-slate-400" />
                        <Typography variant="caption" className="font-black uppercase tracking-widest text-slate-400">Zero Process Context</Typography>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <KillTransactionModal onTransactionKilled={fetchTransactionInfo} />
    </Modal>
  );
}
