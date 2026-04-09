import { Toggle } from '../../../../components/ds/forms/Toggle';
import { Input } from '../../../../components/ds/forms/Input';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { Typography } from '../../../../components/ds/foundation/Typography';
import { SectionHeader } from '../../../../components/ds/foundation/SectionHeader';

function OptionCard({ label, checked, onChange, disabled, icon }) {
  return (
    <div 
      className={`flex items-center justify-between p-3.5 border rounded-2xl transition-all duration-200 
        ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer select-none'}
        ${checked && !disabled ? 'bg-amber-500/4 border-amber-500/20 shadow-xs' : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div className="flex items-center gap-3">
        {icon && <Icon name={icon} size="xs" weight={300} className={checked ? 'text-amber-500' : 'text-slate-400'} />}
        <Typography variant="p" className={`text-[11.5px] font-bold transition-colors ${checked && !disabled ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
          {label}
        </Typography>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <Toggle 
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          size="sm"
        />
      </div>
    </div>
  );
}

export default function UnloadAdvancedOptions({ formData, handleInputChange }) {
  const checkboxes = [
    { label: 'As Administrator (DBA)', name: 'asDba', icon: 'shield_person' },
    { label: 'Deconstruct Schema Files', name: 'splitSchema', icon: 'splitscreen' },
    { label: 'Class Manifest Only', name: 'classOnly', icon: 'list_alt' },
    { label: 'Skip Indexing Payload', name: 'skipIndex', icon: 'layers_clear' },
    { label: 'Delimited Identifiers', name: 'useDelimitedIdentifier', icon: 'format_quote' },
    { label: 'Recursive Dependencies', name: 'includeReferencedTables', icon: 'account_tree', disabled: formData.schemaOption === 'Not include' },
  ];

  const inputFields = [
    { label: 'Prefix for output files', name: 'prefixOutputFile',    useName: 'usePrefixOutputFile',    type: 'text',   placeholder: 'prefix_', icon: 'title' },
    { label: 'File for hash',          name: 'fileForHash',          useName: 'useFileForHash',          type: 'text',   placeholder: '/path/to/hash', icon: 'fingerprint' },
    { label: 'Number of cached pages',  name: 'cachedPages',          useName: 'useCachedPages',          type: 'number', placeholder: '0', icon: 'memory' },
    { label: 'Estimated number of instances', name: 'estimateInstances',    useName: 'useEstimateInstances',    type: 'number', placeholder: '1000', icon: 'calculate' },
    { label: 'Lo file count per a directory', name: 'loFileDirectory',      useName: 'useLoFileDirectory',      type: 'text',   placeholder: '/path/to/lo', icon: 'folder_zip' },
  ];

  const triggerInputChange = (name, value) => {
    handleInputChange({ target: { name, value, type: 'toggle' } });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SectionHeader title="Advanced Heuristics" icon="psychology" />

      {/* Toggle grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {checkboxes.map(opt => (
          <OptionCard
            key={opt.name}
            label={opt.label}
            icon={opt.icon}
            checked={formData[opt.name]}
            onChange={(v) => triggerInputChange(opt.name, v)}
            disabled={opt.disabled}
          />
        ))}
      </div>

      {/* Parameter Overrides */}
      <div className="space-y-4">
        <SectionHeader title="Parameter Overrides" icon="tune" showLine={true} className="mt-10" />
        <div className="grid grid-cols-1 gap-4">
          {inputFields.map(field => (
            <div key={field.name} className="flex items-center gap-4 bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-3 px-4 transition-all hover:border-slate-200 dark:hover:border-white/10">
              <div className="flex-1 flex items-center gap-3">
                <div onClick={(e) => e.stopPropagation()}>
                  <Toggle
                    checked={formData[field.useName]}
                    onChange={(v) => triggerInputChange(field.useName, v)}
                    size="sm"
                  />
                </div>
                <div className="min-w-0">
                  <Typography variant="p" className={`text-[11px] font-bold leading-none transition-colors ${formData[field.useName] ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {field.label}
                  </Typography>
                </div>
              </div>
              <div className="flex-[1.4] max-w-[420px]">
                <Input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleInputChange}
                  placeholder={field.placeholder || ''}
                  disabled={!formData[field.useName]}
                  size="sm"
                  icon={field.icon}
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
