import { Icon } from '../../../../components/ds/foundation/Icon';
import { Checkbox } from '../../../../components/ds/forms/Checkbox';

const RadioOption = ({ label, checked, onClick }) => (
  <div
    className="flex items-center gap-2.5 cursor-pointer group py-1 pl-0.5"
    onClick={onClick}
  >
    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all shrink-0
      ${checked ? 'border-amber-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-slate-400'}`}
    >
      {checked && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
    </div>
    <span className={`text-[12px] font-medium transition-colors ${checked ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'}`}>
      {label}
    </span>
  </div>
);

const SectionHeader = ({ label }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
    <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
  </div>
);

export default function UnloadContentSection({
  formData,
  handleInputChange,
  handleSchemaChange,
  handleTableToggle,
  dynamicTables,
  isTablesLoading
}) {
  return (
    <div>
      <SectionHeader label="Unload Parameters" />

      {/* Schema + Data option panels */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Schema */}
        <div className="bg-slate-50 dark:bg-white/2 rounded-lg border border-slate-200 dark:border-white/5 p-3.5 space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-sm bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Icon name="terminal" size="sm" weight={300} className="text-amber-500" style={{ fontSize: '11px' }} />
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Schema</span>
          </div>
          {['All', 'Selected tables', 'Not include'].map(opt => (
            <RadioOption
              key={opt}
              label={opt}
              checked={formData.schemaOption === opt}
              onClick={() => handleSchemaChange({ target: { name: 'schemaOption', value: opt } })}
            />
          ))}
        </div>

        {/* Data */}
        <div className="bg-slate-50 dark:bg-white/2 rounded-lg border border-slate-200 dark:border-white/5 p-3.5 space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-sm bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Icon name="dataset" size="sm" weight={300} className="text-amber-500" style={{ fontSize: '11px' }} />
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Data</span>
          </div>
          {['Selected tables', 'Not include'].map(opt => (
            <RadioOption
              key={opt}
              label={opt}
              checked={formData.dataOption === opt}
              onClick={() => handleInputChange({ target: { name: 'dataOption', value: opt } })}
            />
          ))}
        </div>
      </div>

      {/* Class table picker */}
      <div className="border border-slate-200 dark:border-white/5 rounded-lg bg-white dark:bg-white/1 overflow-hidden">
        <div className="px-3.5 py-2 bg-slate-50 dark:bg-white/2 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Available Classes</span>
          <span className="px-1.5 py-0.5 rounded-sm bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400 font-mono">
            {formData.selectedTables.length} selected
          </span>
        </div>
        <div className="max-h-[160px] overflow-y-auto p-3 custom-scrollbar">
          {isTablesLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] text-slate-400">Fetching schema…</span>
            </div>
          ) : dynamicTables.length === 0 ? (
            <div className="py-8 text-center">
              <span className="text-[12px] text-slate-400 italic">No class objects detected.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-y-1 gap-x-4">
              {dynamicTables.map(table => (
                <Checkbox
                  key={table}
                  label={table.toUpperCase()}
                  checked={formData.selectedTables.includes(table)}
                  onChange={() => handleTableToggle(table)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
