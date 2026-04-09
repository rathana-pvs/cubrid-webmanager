import { Select } from '../../../../components/ds/forms/Select';
import { Checkbox } from '../../../../components/ds/forms/Checkbox';
import { Input } from '../../../../components/ds/forms/Input';
import { Table } from '../../../../components/ds/layout/Table';
import { Tabs } from '../../../../components/ds/layout/Tabs';
import { Typography } from '../../../../components/ds/foundation/Typography';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { SectionHeader } from '../../../../components/ds/foundation/SectionHeader';

const typeIcon = { schema: 'code', object: 'dataset', index: 'layers', trigger: 'bolt' };

const TypeBadge = ({ value }) => (
  <div className="flex items-center gap-2">
    <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
      <Icon name={typeIcon[value] || 'description'} size="11px" weight={500} className="text-amber-500" />
    </div>
    <Typography variant="caption" className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px]">
      {value}
    </Typography>
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
      header: '',
      accessor: 'checked',
      width: '48px',
      render: (value, row) => (
        <div className="flex justify-center">
          <Checkbox
            checked={value}
            onChange={(e) => handleTableCheckboxChange(e.target.checked, row.key)}
          />
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'loadType',
      width: '120px',
      render: (value) => <TypeBadge value={value} />
    },
    {
      header: 'Volume Path',
      accessor: 'path',
      render: (value) => (
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate block max-w-[260px]" title={value}>
          {value}
        </span>
      )
    },
    {
      header: 'Timestamp',
      accessor: 'date',
      width: '175px',
      align: 'right',
      render: (value) => (
        <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 tabular-nums whitespace-nowrap">
          {value}
        </span>
      )
    }
  ];

  const tabs = [
    {
      id: 0,
      label: 'System Registry',
      icon: 'inventory_2',
      content: (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
          {/* DB selector */}
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-[300px]">
              <Select
                value={selectedUnload}
                onChange={(e) => handleUnloadSelectChange(e.target.value)}
                placeholder="Select source database"
                options={unloadList.map(db => ({ value: db.dbname, label: db.dbname }))}
                icon="database"
              />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <Icon name="info" size="12px" weight={300} className="text-slate-300 dark:text-white/20" />
              <span className="hidden sm:inline">Select files to include</span>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-200/70 dark:border-white/[0.07] overflow-hidden bg-white dark:bg-white/[0.02]">
            <Table
              data={dataSource}
              columns={columns}
              bordered
              emptyMessage="No backup volumes found for this database"
            />
          </div>

          {/* Selection hint */}
          {dataSource.length > 0 && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5">
              <Icon name="check_box_outline_blank" size="11px" className="text-amber-500/60" />
              {dataSource.filter(d => d.checked).length} of {dataSource.length} volumes selected
            </p>
          )}
        </div>
      )
    },
    {
      id: 1,
      label: 'Manual Paths',
      icon: 'edit_document',
      content: (
        <div className="space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
          {['schema', 'object', 'index', 'trigger'].map(type => {
            const isEnabled = formData.checkBoxes[type];
            return (
              <div
                key={type}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 border transition-all duration-150 ${
                  isEnabled
                    ? 'bg-amber-500/[0.03] border-amber-500/20 dark:border-amber-500/15'
                    : 'bg-slate-50/40 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/[0.05] hover:border-slate-300/60 dark:hover:border-white/10'
                }`}
              >
                {/* Checkbox + Label */}
                <div className="flex items-center gap-2 w-[110px] shrink-0">
                  <Checkbox
                    checked={isEnabled}
                    onChange={(e) => handleCheckBoxChange(type, e.target.checked)}
                  />
                  <div className="flex items-center gap-1.5">
                    <Icon name={typeIcon[type]} size="11px" weight={500} className={isEnabled ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'} />
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isEnabled ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                      {type}
                    </span>
                  </div>
                </div>

                {/* Input */}
                <div className="flex-1">
                  <Input
                    value={formData.unloadFiles[type]}
                    onChange={(e) => handleUnloadPathChange(type, e.target.value)}
                    disabled={!isEnabled}
                    placeholder="/absolute/path/to/file"
                    icon={typeIcon[type]}
                    className="font-mono!"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-300">
      <SectionHeader title="Source Method" icon="upload_file" />
      <Tabs
        tabs={tabs}
        activeTab={radio}
        onChange={setRadio}
        variant="pills"
      />
    </div>
  );
}
