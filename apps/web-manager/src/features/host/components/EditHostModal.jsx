import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { editHost, closeEditHostModal, clearHostError } from '../hostSlice';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Divider } from '../../../components/ds/layout/Divider';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Icon } from '../../../components/ds/foundation/Icon';

export default function EditHostModal() {
  const dispatch = useDispatch();
  const { isEditHostModalOpen, hostToEditUid, hosts, loading, error: apiError } = useSelector((state) => state.host);

  const [formData, setFormData] = useState({
    id: '',
    address: '',
    port: '8001',
    password: '',
    alias: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditHostModalOpen && hostToEditUid) {
      const hostToEdit = hosts.find((h) => h.uid === hostToEditUid);
      if (hostToEdit) {
        setFormData({
          id: hostToEdit.id || '',
          address: hostToEdit.address || '',
          port: hostToEdit.port ? String(hostToEdit.port) : '8001',
          password: '',
          alias: hostToEdit.alias || '',
        });
      }
      setErrors({});
    }
  }, [isEditHostModalOpen, hostToEditUid, hosts]);

  if (!isEditHostModalOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) dispatch(clearHostError());
  };

  const validate = () => {
    const errs = {};
    if (!formData.alias.trim()) errs.alias = 'Host Name is required';
    if (!formData.address.trim()) errs.address = 'Address is required';
    if (!formData.port.trim()) errs.port = 'Port is required';
    if (!formData.id.trim()) errs.id = 'User is required';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    
    const payload = {
      id: formData.id,
      address: formData.address,
      port: Number(formData.port),
      alias: formData.alias,
    };
    
    if (formData.password) {
      payload.password = formData.password;
    }
    
    dispatch(editHost({ hostUid: hostToEditUid, payload }));
  };
  
  const handleClose = () => {
    dispatch(closeEditHostModal());
    dispatch(clearHostError());
  };

  return (
    <Modal
      isOpen={isEditHostModalOpen}
      onClose={handleClose}
      title="Modify host"
      icon="settings_input_component"
      loading={loading}
      maxWidth="max-w-[520px]"
      footer={
        <>
          <Button 
            variant="secondary" 
            onClick={handleClose}
            disabled={loading}
          >
            Discard
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            loading={loading}
            icon="save_as"
            className="min-w-[120px]"
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {apiError && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-500/5 border border-rose-500/10 rounded-lg animate-in fade-in slide-in-from-top-1">
            <Icon name="error" size="sm" className="text-rose-500" weight={300} />
            <Typography variant="caption" className="text-rose-500 font-medium">{apiError}</Typography>
            <button onClick={() => dispatch(clearHostError())} className="ml-auto text-rose-500/50 hover:text-rose-500 transition-colors">
               <Icon name="close" size="sm" weight={300} />
            </button>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-3">
            <Divider label="Credentials" />
            <Input
              label="Host friendly name"
              name="alias"
              value={formData.alias}
              onChange={handleChange}
              error={errors.alias}
              placeholder="My server"
              disabled={loading}
            />
          </div>

          <div className="space-y-3">
            <Divider label="Host identity" />
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <Input
                  label="IP address / domain"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                  placeholder="localhost"
                  disabled={loading}
                />
              </div>
              <div className="col-span-1">
                <Input
                  label="Port"
                  name="port"
                  value={formData.port}
                  onChange={handleChange}
                  error={errors.port}
                  placeholder="8001"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Divider label="Manager access" />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Admin username"
                name="id"
                value={formData.id}
                onChange={handleChange}
                error={errors.id}
                placeholder="admin"
                disabled={loading}
              />
              <Input
                label="Passcode"
                labelExtra="(optional)"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
