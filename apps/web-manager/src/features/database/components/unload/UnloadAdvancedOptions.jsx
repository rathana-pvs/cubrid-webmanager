import { Checkbox } from '../../../../components/ds/forms/Checkbox';
import { Input } from '../../../../components/ds/forms/Input';

const SectionHeader = ({ label }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
    <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
  </div>
);

export default function UnloadAdvancedOptions({ formData, handleInputChange }) {
  const checkboxes = [
    { label: 'As DBA', name: 'asDba' },
    { label: 'Split schema files', name: 'splitSchema' },
    { label: 'Class only', name: 'classOnly' },
    { label: 'Skip index detail', name: 'skipIndex' },
    { label: 'Use delimited identifier', name: 'useDelimitedIdentifier' },
    { label: 'Include referenced tables', name: 'includeReferencedTables', disabled: formData.schemaOption === 'Not include' },
  ];

  const inputFields = [
    { label: 'Output file prefix', name: 'prefixOutputFile',    useName: 'usePrefixOutputFile',    type: 'text',   placeholder: 'prefix_' },
    { label: 'Hash file path',     name: 'fileForHash',          useName: 'useFileForHash',          type: 'text',   placeholder: '' },
    { label: 'Cached pages limit', name: 'cachedPages',          useName: 'useCachedPages',          type: 'number', placeholder: '0' },
    { label: 'Instances estimate', name: 'estimateInstances',    useName: 'useEstimateInstances',    type: 'number', placeholder: '1000' },
    { label: 'LO file directory',  name: 'loFileDirectory',      useName: 'useLoFileDirectory',      type: 'text',   placeholder: '' },
  ];

  return (
    <div>
      <SectionHeader label="Advanced Options" />

      {/* Checkbox grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 px-1 mb-5">
        {checkboxes.map(opt => (
          <Checkbox
            key={opt.name}
            label={opt.label}
            name={opt.name}
            checked={formData[opt.name]}
            onChange={handleInputChange}
            disabled={opt.disabled}
          />
        ))}
      </div>

      {/* Conditional input fields */}
      <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-white/4">
        {inputFields.map(field => (
          <div key={field.name} className="flex items-center gap-3">
            <div className="w-48 shrink-0">
              <Checkbox
                label={field.label}
                name={field.useName}
                checked={formData[field.useName]}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex-1">
              <Input
                type={field.type}
                name={field.name}
                value={formData[field.name]}
                onChange={handleInputChange}
                placeholder={field.placeholder || ''}
                disabled={!formData[field.useName]}
                size="sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
