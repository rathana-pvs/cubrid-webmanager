import { Input } from '../../../../components/ds/forms/Input';
import { SectionHeader } from '../../../../components/ds/foundation/SectionHeader';

export default function LoadConfigSection({ formData, handleInputChange }) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Profile context" icon="account_circle" />
      
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
