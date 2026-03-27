import { Select } from '../../../../components/ds/forms/Select';
import { Checkbox } from '../../../../components/ds/forms/Checkbox';
import { Input } from '../../../../components/ds/forms/Input';
import { Table } from '../../../../components/ds/layout/Table';
import { Typography } from '../../../../components/ds/foundation/Typography';
import { Icon } from '../../../../components/ds/foundation/Icon';

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
      width: 'w-12',
      cell: (info) => (
        <Checkbox 
          checked={info.getValue()} 
          onChange={(e) => handleTableCheckboxChange(e.target.checked, info.row.original.key)}
        />
      )
    },
    {
      header: 'Type',
      accessorKey: 'loadType',
      width: 'w-24',
      cell: (info) => (
        <Typography variant="caption" className="font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
          {info.getValue()}
        </Typography>
      )
    },
    {
      header: 'Volume path',
      accessorKey: 'path',
      cell: (info) => (
        <Typography variant="caption" className="font-mono text-slate-500 truncate max-w-[300px]">
          {info.getValue()}
        </Typography>
      )
    },
    {
      header: 'Timestamp',
      accessorKey: 'date',
      width: 'w-32',
      cell: (info) => (
        <Typography variant="caption" className="font-mono text-slate-400 text-right">
          {info.getValue()}
        </Typography>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Typography variant="caption" className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Source parameters</Typography>
        <div className="flex-1 h-px bg-slate-100 dark:bg-white/5"></div>
      </div>

      <div className="space-y-6">
        {/* Option 1: Pre-defined source */}
        <div className={`space-y-4 transition-all ${radio !== 0 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
          <div className="flex items-center gap-3 cursor-pointer group w-fit" onClick={() => setRadio(0)}>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${radio === 0 ? 'border-bk-yellow' : 'border-slate-300 dark:border-slate-600'}`}>
              {radio === 0 && <div className="w-2 h-2 rounded-full bg-bk-yellow shadow-[0_0_8px_rgba(255,215,0,0.6)]"></div>}
            </div>
            <Typography variant="p" className={`font-bold transition-colors ${radio === 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Pre-defined backup volumes</Typography>
          </div>

          <div className="space-y-4 pl-7">
            <Select
              value={selectedUnload}
              onChange={(e) => handleUnloadSelectChange(e.target.value)}
              disabled={radio !== 0}
              placeholder="Select database source"
              options={unloadList.map(db => ({ value: db.dbname, label: db.dbname }))}
              icon="inventory_2"
            />

            <div className="rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-xs bg-white dark:bg-bk-side/50">
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
        <div className={`space-y-4 pt-6 border-t border-slate-100 dark:border-white/5 transition-all ${radio !== 1 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
          <div className="flex items-center gap-3 cursor-pointer group w-fit" onClick={() => setRadio(1)}>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${radio === 1 ? 'border-bk-yellow' : 'border-slate-300 dark:border-slate-600'}`}>
              {radio === 1 && <div className="w-2 h-2 rounded-full bg-bk-yellow shadow-[0_0_8px_rgba(255,215,0,0.6)]"></div>}
            </div>
            <Typography variant="p" className={`font-bold transition-colors ${radio === 1 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Manual volume paths</Typography>
          </div>

          <div className="space-y-3 pl-7">
            {['schema', 'object', 'index', 'trigger'].map(type => (
              <div key={type} className="flex items-center gap-4">
                <div className="w-36 shrink-0">
                  <Checkbox 
                    label={`Load ${type}`}
                    checked={formData.checkBoxes[type]}
                    onChange={(e) => handleCheckBoxChange(type, e.target.checked)}
                  />
                </div>
                <Input 
                  value={formData.unloadFiles[type]}
                  onChange={(e) => handleUnloadPathChange(type, e.target.value)}
                  disabled={!formData.checkBoxes[type]}
                  placeholder="/absolute/path/to/file"
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
