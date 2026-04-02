import { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { editHost, loginToHost, closeEditHostModal, clearHostError } from '../hostSlice';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Icon } from '../../../components/ds/foundation/Icon';

export default function EditHostModal() {
  const dispatch = useDispatch();
  const { isEditHostModalOpen, hostToEditUid, hosts, selectedHostUid, loading, error: apiError } = useSelector((state) => state.host, shallowEqual);

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
    if (!formData.alias.trim()) errs.alias = 'Host name is required';
    if (!formData.address.trim()) errs.address = 'Address is required';
    if (!formData.port.trim()) errs.port = 'Port is required';
    if (!formData.id.trim()) errs.id = 'Username is required';
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

    dispatch(editHost({ hostUid: hostToEditUid, payload }))
      .unwrap()
      .then(() => {
        if (selectedHostUid === hostToEditUid) {
          dispatch(loginToHost(hostToEditUid));
        }
      });
  };

  const handleClose = () => {
    dispatch(closeEditHostModal());
    dispatch(clearHostError());
  };

  const connectionPreview = formData.address
    ? `${formData.address}:${formData.port || '8001'}`
    : null;

  return (
    <Modal
      isOpen={isEditHostModalOpen}
      onClose={handleClose}
      title="Modify Host"
      icon="settings_input_component"
      loading={loading}
      maxWidth="max-w-[500px]"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Discard
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            icon="save_as"
            className="min-w-[130px]"
          >
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-4 p-1">

        {/* API Error Banner */}
        {apiError && (
          <div className="flex items-start gap-3 px-4 py-3 bg-rose-500/5 border border-rose-500/15 rounded-xl">
            <Icon name="error_outline" size="sm" weight={300} className="text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-rose-500 font-medium flex-1 leading-relaxed">{apiError}</p>
            <button
              onClick={() => dispatch(clearHostError())}
              className="text-rose-400 hover:text-rose-600 transition-colors shrink-0"
            >
              <Icon name="close" size="16px" weight={300} />
            </button>
          </div>
        )}

        {/* Section 1: Identity */}
        <div className="rounded-xl border border-slate-200 dark:border-white/8 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/8 flex items-center gap-2">
            <Icon name="badge" size="14px" weight={400} className="text-amber-500" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Identity</span>
          </div>
          <div className="p-4">
            <Input
              label="Friendly Name"
              name="alias"
              value={formData.alias}
              onChange={handleChange}
              error={errors.alias}
              placeholder="e.g. Production Server"
              icon="label"
              disabled={loading}
            />
          </div>
        </div>

        {/* Section 2: Host Connection */}
        <div className="rounded-xl border border-slate-200 dark:border-white/8 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/8 flex items-center gap-2">
            <Icon name="lan" size="14px" weight={400} className="text-amber-500" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Host</span>
            {connectionPreview && (
              <span className="ml-auto text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                {connectionPreview}
              </span>
            )}
          </div>
          <div className="p-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <Input
                  label="IP Address / Domain"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                  placeholder="localhost"
                  icon="dns"
                  disabled={loading}
                />
              </div>
              <div className="col-span-1">
                <Input
                  label="Port"
                  name="port"
                  type="number"
                  value={formData.port}
                  onChange={handleChange}
                  error={errors.port}
                  placeholder="8001"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Credentials */}
        <div className="rounded-xl border border-slate-200 dark:border-white/8 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/8 flex items-center gap-2">
            <Icon name="lock" size="14px" weight={400} className="text-amber-500" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Credentials</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Username"
                name="id"
                value={formData.id}
                onChange={handleChange}
                error={errors.id}
                placeholder="admin"
                icon="person"
                disabled={loading}
              />
              <Input
                label="New Password"
                labelExtra="(optional)"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Leave blank to keep"
                icon="key"
                disabled={loading}
              />
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}
