import { Input } from '../../../../components/ds/forms/Input';
import { SectionHeader } from '../../../../components/ds/foundation/SectionHeader';

export default function UnloadConfigSection({ formData, handleInputChange }) {
  return (
    <div>
      <SectionHeader title="Target Configuration" icon="folder_zip" />
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
