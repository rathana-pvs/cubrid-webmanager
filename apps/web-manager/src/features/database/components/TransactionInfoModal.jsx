import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeTransactionInfoModal, openKillTransactionModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';
import KillTransactionModal from './KillTransactionModal';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import ErrorOverlay from '../../../components/common/ErrorOverlay';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function TransactionInfoModal() {
  const dispatch = useDispatch();
  const { isTransactionInfoModalOpen, selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTranIndex, setSelectedTranIndex] = useState(null);

  const fetchTransactionInfo = async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        dbuser: 'dba',
        dbpasswd: ''
      };
      const response = await databaseApi.getTransactionInfo(selectedHostUid, selectedDatabase, payload);
      const tranList = response?.transactioninfo?.[0]?.transaction || [];
      setTransactions(tranList);
    } catch (err) {
      console.error('Failed to fetch transaction info:', err);
      setError(err.response?.data?.note || err.response?.data?.message || 'Failed to fetch transaction information');
    } finally {
      setLoading(false);
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

  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => dispatch(closeTransactionInfoModal())}
      />

      <div className="relative bg-white dark:bg-background-dark w-full max-w-4xl rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-white/8 overflow-hidden transform transition-all flex flex-col max-h-[90vh] text-left animate-in zoom-in-95 duration-200">
        
        {/* Subtle Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500/60"></div>

        <LoadingOverlay 
            isVisible={loading && transactions.length > 0} 
            title="Refreshing data" 
            subtitle="Fetching latest transaction records..." 
        />
        <ErrorOverlay 
          isVisible={!!error} 
          error={error} 
          onRetry={fetchTransactionInfo}
          onClose={() => setError(null)}
        />
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-white/6 bg-slate-50/50 dark:bg-white/2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Icon name="swap_horiz" size="sm" weight={300} className="text-amber-500" />
            </div>
            <Typography variant="h3" className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-none">Transaction Monitor</Typography>
          </div>
          <button 
            disabled={loading}
            onClick={() => dispatch(closeTransactionInfoModal())}
            className="w-7 h-7 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-slate-400 dark:text-slate-500 flex items-center justify-center group"
          >
            <Icon name="close" size="sm" weight={300} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                Database: <span className="text-amber-500">{selectedDatabase}</span>
              </span>
              <div className="flex-1 h-px bg-slate-100 dark:bg-white/6"></div>
            </div>

            <div className="border border-slate-200 dark:border-white/8 rounded-lg overflow-hidden bg-white dark:bg-white/1">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50 dark:bg-white/3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-white/6">
                    <tr>
                      <th className="px-4 py-3">Idx</th>
                      <th className="px-4 py-3">User Session</th>
                      <th className="px-4 py-3">Host Address</th>
                      <th className="px-4 py-3 text-center">PID</th>
                      <th className="px-4 py-3">Program</th>
                      <th className="px-4 py-3 text-right">Exec Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/4">
                  {loading && transactions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-16">
                          <div className="flex flex-col items-center justify-center gap-4">
                            <div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Syncing diagnostics...</span>
                          </div>
                        </td>
                      </tr>
                    ) : transactions.length > 0 ? (
                      transactions.map((tran, idx) => {
                        const tranIndex = tran.tranindex;
                        const isSelected = String(selectedTranIndex) === String(tranIndex);
                        const isActive = String(tranIndex).includes('ACTIVE');
                        
                        return (
                          <tr 
                            key={idx} 
                            className={`cursor-pointer transition-colors group ${isSelected ? 'bg-amber-500/5 dark:bg-amber-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/2'}`}
                            onClick={() => setSelectedTranIndex(tranIndex)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {isActive ? (
                                  <div className="relative">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                                  </div>
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                )}
                                <span className={`font-mono text-[12px] ${isSelected ? 'text-amber-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {tranIndex}
                                </span>
                              </div>
                            </td>
                            <td className={`px-4 py-3 font-sans text-sm font-semibold transition-colors ${isSelected ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                              {tran['@user'] || '-'}
                            </td>
                            <td className="px-4 py-3 font-mono text-[12px] text-slate-500 dark:text-slate-400">
                              {tran.host}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="bg-slate-100 dark:bg-white/6 px-2 py-0.5 rounded-sm text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                                {tran.pid}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[12px] font-medium text-slate-500 dark:text-slate-500 italic max-w-[150px] truncate">
                              {tran.program}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-mono text-[12px] font-bold ${parseFloat(tran.query_time) > 5 ? 'text-rose-500' : 'text-slate-400'}`}>
                                {tran.query_time}s
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-20 text-center">
                          <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                            <Icon name="inventory_2" size="md" weight={100} className="text-4xl" />
                            <span className="text-[11px] font-bold uppercase tracking-widest">No Active Transactions</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-white/3 backdrop-blur-md flex items-center justify-between border-t border-slate-100 dark:border-white/6 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              disabled={!selectedTranIndex || loading}
              onClick={handleOpenKillModal}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-400 active:scale-95 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
            >
              <Icon name="cancel" size="sm" weight={400} />
              Kill Process
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              className="px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/8 rounded-lg hover:bg-white dark:hover:bg-white/4 hover:text-slate-700 dark:hover:text-slate-200 transition-all active:scale-95"
              onClick={() => dispatch(closeTransactionInfoModal())}
            >
              Discard
            </button>
            <button 
              onClick={fetchTransactionInfo}
              disabled={loading}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 min-w-[140px] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Icon name="refresh" size="sm" weight={400} />
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <KillTransactionModal onTransactionKilled={fetchTransactionInfo} />
    </div>
  );
}
