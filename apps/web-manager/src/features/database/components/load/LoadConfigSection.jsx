import { Input } from '../../../../components/ds/forms/Input';
import { Typography } from '../../../../components/ds/foundation/Typography';

export default function LoadConfigSection({ formData, handleInputChange }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Typography variant="caption" className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Profile context</Typography>
        <div className="flex-1 h-px bg-slate-100 dark:bg-white/5"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <Input 
          label="Target database"
          value={formData.targetDbName}
          disabled
        />
        <Input 
          label="DB Authority"
          name="dbUsername"
          value={formData.dbUsername}
          onChange={handleInputChange}
          placeholder="dba"
        />
      </div>
    </div>
  );
}
