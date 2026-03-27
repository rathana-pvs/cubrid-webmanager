import { Input } from '../../../../components/ds/forms/Input';
import { Icon } from '../../../../components/ds/foundation/Icon';

const SectionHeader = ({ label }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
    <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
  </div>
);

export default function UnloadConfigSection({ formData, handleInputChange }) {
  return (
    <div>
      <SectionHeader label="Target Configuration" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Database name" value={formData.targetDbName} disabled />
        <Input
          label="Target directory"
          name="targetDirectory"
          value={formData.targetDirectory}
          onChange={handleInputChange}
          placeholder="/home/cubrid/backup"
          icon="folder"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-white/4">
        <Input
          label="DB Username"
          name="dbUsername"
          value={formData.dbUsername}
          onChange={handleInputChange}
          placeholder="dba"
          icon="person"
        />
        <Input
          label="DB Password"
          type="password"
          name="dbPassword"
          value={formData.dbPassword}
          onChange={handleInputChange}
          placeholder="••••••••••••"
        />
      </div>
    </div>
  );
}
