import React from 'react';
import SelectField from '../../../../components/common/SelectField';
import { Icon } from '../../../../components/ds/foundation/Icon';

export default function ConfigTableEditor({
  sections,
  allPropertyKeys,
  selectedCell,
  setSelectedCell,
  handleKeyChange,
  handleValueChange,
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-bk-main">
      {/* ── Outer Scroll Container ── */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="inline-block min-w-full align-middle">
          
          {/* ── Sticky Header Row ── */}
          <div className="sticky top-0 z-20 flex bg-white dark:bg-bk-side border-b border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-64 shrink-0 flex items-center gap-2 px-4 py-2.5 border-r border-slate-200 dark:border-slate-800">
              <Icon name="settings" size="sm" weight={300} className="text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Property</span>
            </div>
            {sections.map((_, idx) => (
              <div key={idx} className="w-60 shrink-0 px-4 py-2.5 border-r border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <Icon name="hub" size="sm" weight={300} className="text-amber-500 dark:text-bk-yellow shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-bk-yellow whitespace-nowrap">
                  Broker #{idx + 1}
                </span>
              </div>
            ))}
            {/* Filler for remaining header width */}
            <div className="flex-1 bg-white dark:bg-bk-side" />
          </div>

          {/* ── Body Rows ── */}
          <div className="bg-white dark:bg-bk-side">
            {allPropertyKeys.map((key, rowIdx) => {
              const isRowSelected = selectedCell.row === rowIdx;
              const isBrokerName  = key === 'BROKER_NAME';
              return (
                <div
                  key={rowIdx}
                  className={`flex border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group ${
                    isRowSelected ? 'bg-emerald-500/5 dark:bg-emerald-500/5' : ''
                  }`}
                >
                  {/* Property key cell */}
                  <div className={`w-64 shrink-0 flex items-center border-r border-slate-100 dark:border-white/5 ${
                    isBrokerName ? 'bg-slate-50 dark:bg-white/3' : ''
                  }`}>
                    {isBrokerName ? (
                      <div className="flex items-center gap-2 px-4 py-2 text-sky-600 dark:text-sky-400">
                        <Icon name="label_important" size="sm" weight={300} />
                        <span className="text-[12px] font-bold">{key}</span>
                      </div>
                    ) : (
                      <input
                        id={`property-name-${key}`}
                        type="text"
                        value={key}
                        onChange={(e) => handleKeyChange(key, e.target.value)}
                        className="w-full px-4 py-2 bg-transparent outline-none text-slate-700 dark:text-slate-300 text-[12px] font-medium transition-all focus:bg-white dark:focus:bg-white/3 focus:text-amber-600 dark:focus:text-bk-yellow placeholder:text-slate-400"
                        placeholder="Property Name"
                      />
                    )}
                  </div>

                  {/* Value cells */}
                  {sections.map((sec, colIdx) => {
                    const isSelected   = selectedCell.row === rowIdx && selectedCell.col === colIdx;
                    const currentValue = sec.properties[key] || '';
                    const isBoolean    = ['ON', 'OFF'].includes(currentValue.toUpperCase());

                    return (
                      <div
                        key={colIdx}
                        onClick={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                        className={`relative w-60 shrink-0 border-r border-slate-100 dark:border-white/5 cursor-pointer ${
                          isSelected ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''
                        }`}
                      >
                        {isBoolean ? (
                        <div className="flex h-full w-full items-center">
                          <SelectField
                            value={currentValue.toUpperCase()}
                            onChange={(val) => handleValueChange(colIdx, key, val)}
                            isHighlight={isSelected}
                            triggerClassName={`
                              h-[38px]! border-transparent rounded-none! 
                              bg-transparent hover:bg-slate-50 dark:hover:bg-white/3 
                              text-[12px]! px-4! transition-colors
                              ${isSelected ? 'text-amber-600 dark:text-bk-yellow font-bold' : 'text-slate-700 dark:text-slate-400'}
                            `}
                            options={[
                              { value: 'ON',  label: 'ON'  },
                              { value: 'OFF', label: 'OFF' },
                            ]}
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) => handleValueChange(colIdx, key, e.target.value)}
                          className={`w-full px-4 bg-transparent outline-none transition-all text-[12px] h-[38px] ${
                            isSelected
                              ? 'text-amber-600 dark:text-bk-yellow font-bold scale-[1.01] origin-left'
                              : 'text-slate-700 dark:text-slate-400 font-medium'
                          } ${isBrokerName ? 'text-sky-600 dark:text-sky-400 font-bold italic' : ''}`}
                        />
                      )}
                      {/* Active cell indicator - YELLOW */}
                      {isSelected && (
                        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                      )}
                      </div>
                    );
                  })}
                  {/* Filler for row width */}
                  <div className="flex-1" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Footer Stats Bar ── */}
      <div className="shrink-0 px-4 py-2 bg-white dark:bg-bk-side border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
        <span>{allPropertyKeys.length} properties · {sections.length} brokers</span>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Table Editor
        </div>
      </div>
    </div>
  );
}
