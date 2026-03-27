import React from 'react';
import SelectField from '../../../../components/common/SelectField';
import { Typography } from '../../../../components/ds/foundation/Typography';
import { Icon } from '../../../../components/ds/foundation/Icon';

export default function ConfigTableEditor({ 
  sections, 
  allPropertyKeys, 
  selectedCell, 
  setSelectedCell, 
  handleKeyChange, 
  handleValueChange 
}) {
  return (
    <div className="flex-1 overflow-auto p-4 custom-scrollbar">
      <div className="inline-block min-w-full align-middle font-sans">
        <div className="border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#1a1c1e] shadow-2xl overflow-hidden ring-1 ring-black/5">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5">
                <th className="px-4 py-3 text-left border border-slate-200 dark:border-white/5 w-72 bg-slate-100/50 dark:bg-black/40">
                  <Typography variant="overline" className="text-slate-500 dark:text-slate-400">Property name</Typography>
                </th>
                {sections.map((sec, idx) => (
                  <th key={idx} className="px-4 py-3 text-left border border-slate-200 dark:border-white/5 min-w-[200px] bg-slate-100/50 dark:bg-black/40">
                    <Typography variant="overline" className="text-bk-yellow opacity-80">Broker#{idx}</Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1a1c1e]">
              {allPropertyKeys.map((key, rowIdx) => (
                <tr 
                  key={rowIdx} 
                  className={`group transition-colors ${
                    (selectedCell.row === rowIdx) ? 'bg-emerald-500/3' : 'odd:bg-white dark:odd:bg-[#1a1c1e] even:bg-slate-50/10 dark:even:bg-white/1'
                  }`}
                >
                  <td className={`p-0 border border-slate-200 dark:border-white/5 font-medium ${
                    key === 'BROKER_NAME' ? 'bg-slate-50/50 dark:bg-black/20' : ''
                  }`}>
                    {key === 'BROKER_NAME' ? (
                      <div className="px-4 py-2 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                         <Icon name="label_important" size="14px"  weight={300} />
                         <Typography variant="span" className="text-[13px] font-bold">{key}</Typography>
                      </div>
                    ) : (
                      <input 
                        id={`property-name-${key}`}
                        type="text"
                        value={key}
                        onChange={(e) => handleKeyChange(key, e.target.value)}
                        className="w-full px-4 py-2 bg-transparent outline-hidden text-slate-700 dark:text-slate-300 text-[13px] font-medium transition-all focus:bg-white dark:focus:bg-white/5"
                        placeholder="Property Name"
                      />
                    )}
                  </td>
                  {sections.map((sec, colIdx) => {
                    const isSelected = selectedCell.row === rowIdx && selectedCell.col === colIdx;
                    const currentValue = sec.properties[key] || '';
                    const isBoolean = ['ON', 'OFF'].includes(currentValue.toUpperCase());
                    
                    return (
                      <td 
                        key={colIdx} 
                        onClick={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                        className={`p-0 border border-slate-200 dark:border-white/5 relative ${
                            isSelected ? 'bg-emerald-500/8' : ''
                        }`}
                      >
                        {isBoolean ? (
                          <SelectField 
                            value={currentValue.toUpperCase()}
                            onChange={(val) => handleValueChange(colIdx, key, val)}
                            isHighlight={true}
                            triggerClassName="h-9! border-0! bg-transparent text-[13px]!"
                            options={[
                              { value: 'ON', label: 'ON' },
                              { value: 'OFF', label: 'OFF' }
                            ]}
                          />
                        ) : (
                          <input 
                            type="text"
                            value={currentValue}
                            onChange={(e) => handleValueChange(colIdx, key, e.target.value)}
                            className={`w-full px-4 py-2 bg-transparent outline-hidden transition-all text-[13px] ${
                                isSelected ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-800 dark:text-slate-400'
                            } ${key === 'BROKER_NAME' ? 'text-blue-600 dark:text-blue-400 font-bold italic' : ''}`}
                          />
                        )}
                        {isSelected && (
                            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
