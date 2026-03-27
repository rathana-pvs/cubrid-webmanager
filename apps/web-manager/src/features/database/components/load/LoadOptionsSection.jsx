import { Checkbox } from '../../../../components/ds/forms/Checkbox';
import { Input } from '../../../../components/ds/forms/Input';
import { Typography } from '../../../../components/ds/foundation/Typography';

export default function LoadOptionsSection({ formData, handleCheckBoxChange, handleValueChange }) {
  const switches = [
    { id: 'checkoption', label: 'Verify syntax before load' },
    { id: 'nolog', label: "Suppress log generation" },
    { id: 'oiduse', label: "Ignore object identifiers (OID)" },
    { id: 'statisticsuse', label: "Skip statistics update" },
  ];

  const inputs = [
    { id: 'estimated', label: 'Ext. instance count', type: 'number', placeholder: '0' },
    { id: 'period', label: 'Periodic commit threshold', type: 'number', placeholder: '1000' },
    { id: 'errorcontrolfile', label: 'Error control definition', type: 'text' },
    { id: 'ignoreclassfile', label: 'Excluded table definition', type: 'text' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Typography variant="caption" className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Load behaviors</Typography>
        <div className="flex-1 h-px bg-slate-100 dark:bg-white/5"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-1">
        {switches.map(opt => (
          <Checkbox 
            key={opt.id}
            label={opt.label}
            checked={formData.checkBoxes[opt.id]}
            onChange={(e) => handleCheckBoxChange(opt.id, e.target.checked)}
          />
        ))}
      </div>

      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
        {inputs.map(item => (
          <div key={item.id} className="flex items-center gap-4">
            <div className="w-52 shrink-0">
              <Checkbox 
                label={item.label}
                checked={formData.checkBoxes[item.id]}
                onChange={(e) => handleCheckBoxChange(item.id, e.target.checked)}
              />
            </div>
            <Input 
              type={item.type}
              value={formData.values[item.id]}
              onChange={(e) => handleValueChange(item.id, e.target.value)}
              disabled={!formData.checkBoxes[item.id]}
              placeholder={item.placeholder || ""}
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
