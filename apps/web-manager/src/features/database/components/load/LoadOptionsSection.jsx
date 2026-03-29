import { Toggle } from '../../../../components/ds/forms/Toggle';
import { Input } from '../../../../components/ds/forms/Input';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { Typography } from '../../../../components/ds/foundation/Typography';

const SectionHeader = ({ label }) => (
  <div className="flex items-center gap-3 mb-5">
    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">{label}</span>
    <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
  </div>
);

function OptionToggle({ label, checked, onChange, icon }) {
  return (
    <div 
      className={`flex items-center justify-between p-3.5 border rounded-2xl transition-all duration-200 cursor-pointer select-none
        ${checked ? 'bg-bk-yellow/4 border-bk-yellow/20 shadow-xs' : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'}`}
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-center gap-3">
        {icon && <Icon name={icon} size="xs" weight={300} className={checked ? 'text-bk-yellow' : 'text-slate-400'} />}
        <Typography variant="p" className={`text-[11.5px] font-bold transition-colors ${checked ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
          {label}
        </Typography>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <Toggle 
          checked={checked}
          onChange={onChange}
          size="sm"
        />
      </div>
    </div>
  );
}

export default function LoadOptionsSection({ formData, handleCheckBoxChange, handleValueChange }) {
  const switches = [
    { id: 'checkoption', label: 'Verify Syntax Integrity', icon: 'spellcheck' },
    { id: 'nolog', label: "Omit Transaction Logging", icon: 'history_toggle_off' },
    { id: 'oiduse', label: "Override Object IDs (OID)", icon: 'id_card' },
    { id: 'statisticsuse', label: "Deferred Statistics", icon: 'analytics' },
  ];

  const inputs = [
    { id: 'estimated', label: 'Object Count Projection', type: 'number', placeholder: '0', icon: 'groups' },
    { id: 'period', label: 'Periodic Commit Frequency', type: 'number', placeholder: '1000', icon: 'timer' },
    { id: 'errorcontrolfile', label: 'Error Policy Manifest', type: 'text', icon: 'rule' },
    { id: 'ignoreclassfile', label: 'Class Exclusion Manifest', type: 'text', icon: 'block' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SectionHeader label="Execution Strategy" />
      
      {/* Behavior Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {switches.map(opt => (
          <OptionToggle 
            key={opt.id}
            label={opt.label}
            icon={opt.icon}
            checked={formData.checkBoxes[opt.id]}
            onChange={(v) => handleCheckBoxChange(opt.id, v)}
          />
        ))}
      </div>

      {/* Threshold Overrides */}
      <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/5">
        <Typography variant="caption" className="font-black uppercase tracking-widest text-slate-400 ml-1 block mb-2">Threshold Overrides</Typography>
        <div className="grid grid-cols-1 gap-4">
          {inputs.map(item => (
            <div key={item.id} className="flex items-center gap-4 bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-3 px-4 transition-all hover:border-slate-200 dark:hover:border-white/10">
              <div className="flex-1 flex items-center gap-3">
                <div onClick={(e) => e.stopPropagation()}>
                  <Toggle
                    checked={formData.checkBoxes[item.id]}
                    onChange={(v) => handleCheckBoxChange(item.id, v)}
                    size="sm"
                  />
                </div>
                <div className="min-w-0">
                  <Typography variant="p" className={`text-[11px] font-bold leading-none mb-1 transition-colors ${formData.checkBoxes[item.id] ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" className="text-slate-400 text-[9px] font-medium leading-none block">Override system default</Typography>
                </div>
              </div>
              <div className="flex-1 max-w-[240px]">
                <Input 
                  type={item.type}
                  value={formData.values[item.id]}
                  onChange={(e) => handleValueChange(item.id, e.target.value)}
                  disabled={!formData.checkBoxes[item.id]}
                  placeholder={item.placeholder || ""}
                  size="sm"
                  icon={item.icon}
                  className="font-mono! text-[10px]!"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
