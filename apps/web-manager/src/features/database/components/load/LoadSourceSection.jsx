import { Select } from '../../../../components/ds/forms/Select';
import { Toggle } from '../../../../components/ds/forms/Toggle';
import { Input } from '../../../../components/ds/forms/Input';
import { Table } from '../../../../components/ds/layout/Table';
import { Typography } from '../../../../components/ds/foundation/Typography';
import { Icon } from '../../../../components/ds/foundation/Icon';

const SectionHeader = ({ label }) => (
  <div className="flex items-center gap-3 mb-5">
    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">{label}</span>
    <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
  </div>
);

export default function LoadSourceSection({ 
  radio, 
  setRadio, 
  selectedUnload, 
  handleUnloadSelectChange, 
  unloadList, 
  dataSource, 
  handleTableCheckboxChange,
  formData,
  handleCheckBoxChange,
  handleUnloadPathChange
}) {
  const columns = [
    {
      header: 'Selection',
      accessorKey: 'checked',
      width: 'w-14',
      cell: (info) => (
        <div className="flex justify-center">
          <Toggle 
            checked={info.getValue()} 
            onChange={(v) => handleTableCheckboxChange(v, info.row.original.key)}
            size="sm"
          />
        </div>
      )
    },
    {
      header: 'Type',
      accessorKey: 'loadType',
      width: 'w-24',
      cell: (info) => (
        <div className="flex items-center gap-2">
           <Icon name={
             info.getValue() === 'schema' ? 'code' : 
             info.getValue() === 'object' ? 'dataset' : 
             info.getValue() === 'index' ? 'layers' : 'bolt'
           } size="12px" weight={400} className="text-bk-yellow/70" />
           <Typography variant="caption" className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">
             {info.getValue()}
           </Typography>
        </div>
      )
    },
    {
      header: 'Volume path',
      accessorKey: 'path',
      cell: (info) => (
        <Typography variant="caption" className="font-mono text-slate-500 dark:text-slate-400 truncate max-w-[300px]">
          {info.getValue()}
        </Typography>
      )
    },
    {
      header: 'Timestamp',
      accessorKey: 'date',
      width: 'w-32',
      cell: (info) => (
        <Typography variant="caption" className="font-mono text-slate-400 text-right tabular-nums">
          {info.getValue()}
        </Typography>
      )
    }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SectionHeader label="Source Inventory" />

      <div className="space-y-8">
        {/* Option 1: Pre-defined source */}
        <div className={`space-y-4 px-1 transition-all duration-300 ${radio !== 0 ? 'opacity-30 grayscale pointer-events-none scale-[0.99] origin-top' : ''}`}>
          <div className="flex items-center gap-4 cursor-pointer group w-fit" onClick={() => setRadio(0)}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${radio === 0 ? 'border-bk-yellow shadow-[0_0_12px_rgba(255,193,7,0.2)]' : 'border-slate-300 dark:border-white/10'}`}>
              {radio === 0 && <div className="w-2.5 h-2.5 rounded-full bg-bk-yellow shadow-xs" />}
            </div>
            <div className="min-w-0">
              <Typography variant="p" className={`text-[13px] font-black tracking-tight transition-colors ${radio === 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>System Registry Volumes</Typography>
              <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium block">Select from existing backup catalog</Typography>
            </div>
          </div>

          <div className="space-y-4 pl-9">
            <div className="max-w-[320px]">
              <Select
                value={selectedUnload}
                onChange={(e) => handleUnloadSelectChange(e.target.value)}
                disabled={radio !== 0}
                placeholder="Select database source"
                options={unloadList.map(db => ({ value: db.dbname, label: db.dbname }))}
                icon="inventory_2"
              />
            </div>

            <div className="rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden shadow-xs bg-white/50 dark:bg-white/1 backdrop-blur-xs">
              <Table 
                data={dataSource} 
                columns={columns} 
                compact 
                noHover={radio !== 0}
              />
            </div>
          </div>
        </div>

        {/* Option 2: Custom path */}
        <div className={`space-y-4 px-1 pt-8 border-t border-slate-100 dark:border-white/5 transition-all duration-300 ${radio !== 1 ? 'opacity-30 grayscale pointer-events-none scale-[0.99] origin-top' : ''}`}>
          <div className="flex items-center gap-4 cursor-pointer group w-fit" onClick={() => setRadio(1)}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${radio === 1 ? 'border-bk-yellow shadow-[0_0_12px_rgba(255,193,7,0.2)]' : 'border-slate-300 dark:border-white/10'}`}>
              {radio === 1 && <div className="w-2.5 h-2.5 rounded-full bg-bk-yellow shadow-xs" />}
            </div>
            <div className="min-w-0">
              <Typography variant="p" className={`text-[13px] font-black tracking-tight transition-colors ${radio === 1 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Manual Payload Paths</Typography>
              <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium block">Specify direct absolute paths to source files</Typography>
            </div>
          </div>

          <div className="space-y-4 pl-9">
            {['schema', 'object', 'index', 'trigger'].map(type => (
              <div key={type} className="flex items-center gap-4 bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-3 px-4 transition-all hover:border-slate-200 dark:hover:border-white/10 shadow-xs">
                <div className="flex-1 flex items-center gap-3">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Toggle 
                      checked={formData.checkBoxes[type]}
                      onChange={(v) => handleCheckBoxChange(type, v)}
                      size="sm"
                    />
                  </div>
                  <div className="min-w-0">
                    <Typography variant="p" className={`text-[11px] font-black uppercase tracking-widest leading-none mb-1 transition-colors ${formData.checkBoxes[type] ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                      {type} Payload
                    </Typography>
                    <Typography variant="caption" className="text-slate-400 text-[9px] font-medium leading-none block">Absolute file reference</Typography>
                  </div>
                </div>
                <div className="flex-1 max-w-[340px]">
                  <Input 
                    value={formData.unloadFiles[type]}
                    onChange={(e) => handleUnloadPathChange(type, e.target.value)}
                    disabled={!formData.checkBoxes[type]}
                    placeholder="/absolute/path/to/file"
                    size="sm"
                    icon={type === 'schema' ? 'code' : type === 'object' ? 'dataset' : type === 'index' ? 'layers' : 'bolt'}
                    className="font-mono! text-[10px]!"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
