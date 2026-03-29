import { useDispatch, useSelector } from 'react-redux';
import { closeUnloadResultModal } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';

export default function UnloadResultModal() {
  const dispatch = useDispatch();
  const { isUnloadResultModalOpen, unloadResultData } = useSelector((state) => state.databaseUI);

  if (!isUnloadResultModalOpen) return null;

  const resultData = unloadResultData?.[0] || {};
  const rows = Object.entries(resultData).map(([tableName, stats]) => ({
    tableName,
    stats
  }));

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-bk-main/40 backdrop-blur-xs animate-in fade-in duration-200 font-sans text-left">
      <div className="bg-white dark:bg-bk-side w-full max-w-[500px] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] relative text-left">

        {/* Subtle Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-bk-yellow/60"></div>

        {/* Header - Compact */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-bk-main/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bk-yellow/10 flex items-center justify-center border border-bk-yellow/20">
              <Icon name="analytics" size="sm" weight={300} className="text-bk-yellow text-xl" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-white leading-none">Unload job summary</h3>
            </div>
          </div>
          <button
            onClick={() => dispatch(closeUnloadResultModal())}
            className="w-7 h-7 rounded-md hover:bg-slate-200 dark:hover:bg-white/5 transition-all text-slate-400 dark:text-slate-500 flex items-center justify-center group"
          >
            <Icon name="close" size="sm" weight={300} className="text-lg group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500">Class results</span>
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800/50"></div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/20 dark:bg-bk-main/30">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-slate-50/80 dark:bg-bk-main/50 text-[10px] font-medium text-slate-400 tracking-wide border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Class identifier</th>
                  <th className="px-4 py-3 text-right">Records / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[11px]">
                {rows.length > 0 ? rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                    <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">{row.tableName}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-bk-yellow font-bold px-2 py-0.5 rounded-sm bg-bk-yellow/5 border border-bk-yellow/10">
                        {row.stats}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="2" className="px-4 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-30 grayscale items-center">
                        <Icon name="inventory_2" size="sm" weight={300} className="text-4xl" />
                        <p className="text-[10px] font-medium tracking-wide">No results metadata found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-bk-main/80 backdrop-blur-xs flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={() => dispatch(closeUnloadResultModal())}
            className="px-8 py-1.5 bg-bk-yellow hover:bg-[#ffd700] active:scale-[0.98] text-bk-side text-[11px] font-medium tracking-wide rounded-sm border border-bk-yellow/50 shadow-xs transition-all flex items-center justify-center min-w-[120px]"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
