import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCMSLogs } from '../brokerSlice';

import { Icon } from '../../../components/ds/foundation/Icon';

function CMSLogViewer({ hostUid, type }) {
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const cmsLogs = useSelector((state) => state.broker.cmsLogsByHost[hostUid]);
  const loading = useSelector((state) => state.broker.cmsLogsLoading);

  const logs = type === 'access' ? cmsLogs?.accesslog : cmsLogs?.errorlog;
  const title = type === 'access' ? 'Manager Access Log' : 'Manager Error Log';
  const icon = type === 'access' ? 'login' : 'report';

  const totalEntries = logs?.length || 0;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = logs?.slice(startIndex, startIndex + pageSize) || [];

  const handleRefresh = () => {
    dispatch(fetchCMSLogs(hostUid));
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (loading && !cmsLogs) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-bk-main">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-bk-yellow/20 border-t-bk-yellow rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading manager logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-bk-main overflow-hidden font-mono">
      {/* Header with Pagination */}
      <div className="shrink-0 px-4 py-2.5 bg-white dark:bg-bk-side border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type === 'access' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
            <span className={`material-symbols-outlined text-[18px] ${type === 'access' ? 'text-amber-600 dark:text-bk-yellow' : 'text-rose-500'}`}>{icon}</span>
          </div>
          <div>
            <h2 className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">{title}</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Manager System Activity</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 dark:bg-white/5 rounded-lg p-0.5">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1 || loading}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/10 hover:text-amber-600 dark:hover:text-bk-yellow rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Icon name="chevron_left" size="sm" weight={300} />
            </button>
            <div className="px-3 text-[11px] font-medium text-slate-600 dark:text-slate-300 min-w-[80px] text-center">
              Page {currentPage} / {totalPages}
            </div>
            <button 
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || loading}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/10 hover:text-amber-600 dark:hover:text-bk-yellow rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Icon name="chevron_right" size="sm" weight={300} />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>

          <button 
             onClick={handleRefresh}
             disabled={loading}
             className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="shrink-0 flex items-center gap-4 px-4 py-2 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
        <div className="w-36 shrink-0">Time</div>
        <div className="w-24 shrink-0">User</div>
        <div className="w-40 shrink-0">Task</div>
        <div className="flex-1">Detail / Note</div>
      </div>

      {/* Log List - One line format */}
      <div className="flex-1 overflow-auto bg-white dark:bg-bk-side">
        {!paginatedLogs || paginatedLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Icon name="inbox" size="sm" weight={300} className="text-slate-400 dark:text-slate-500 text-3xl" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">No log entries found for this category.</p>
          </div>
        ) : (
          <div className="min-w-full inline-block">
            {paginatedLogs.map((log, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-4 px-4 py-2 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group text-[12px] leading-relaxed"
              >
                <div className="w-36 shrink-0 text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                  {log.time}
                </div>
                <div className="w-24 shrink-0 flex items-center gap-2">
                  <Icon name="person" size="sm" weight={300} className="text-slate-400 dark:text-slate-600" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{log['@user'] || 'System'}</span>
                </div>
                <div className="w-40 shrink-0">
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-sm border border-indigo-500/20 text-[10px] font-bold uppercase tracking-tighter">
                    {log.taskname}
                  </span>
                </div>
                <div className="flex-1 min-w-0 truncate">
                  {type === 'error' ? (
                    <div className="flex gap-2 items-center">
                      <span className="text-rose-500 dark:text-rose-400 font-bold text-[10px] bg-rose-400/10 px-1 rounded-sm shrink-0">ERR</span>
                      <span className="text-slate-600 dark:text-slate-300 truncate" title={log.errornote?.replace('<end>', '')}>
                        {log.errornote?.replace('<end>', '')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] bg-emerald-400/10 px-1 rounded-sm shrink-0">SUCCESS</span>
                      <span className="text-slate-500 dark:text-slate-400 italic">Operation: {log.taskname} completed</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="shrink-0 px-4 py-2 bg-white dark:bg-bk-side border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
        <div className="flex items-center gap-4">
          <span>Total Entries: {totalEntries.toLocaleString()}</span>
          <span>Showing: {startIndex + 1} - {Math.min(startIndex + pageSize, totalEntries)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Connected
        </div>
      </div>
    </div>
  );
}

export default CMSLogViewer;
