import { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { editHost, loginToHost, closeEditHostModal, clearHostError, setSelectedHost, fetchHostEnv } from '../hostSlice';
import { fetchDatabaseStartInfo } from '../../database/databaseSlice';
import { fetchBrokerList } from '../../broker/brokerSlice';
import { setActiveMainTab } from '../../layout/layoutSlice';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Icon } from '../../../components/ds/foundation/Icon';
import { SectionHeader } from '../../../components/ds/foundation/SectionHeader';

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

    // 1. Capture current target UID
    const targetUid = hostToEditUid;

    // 2. Perform Edit
    dispatch(editHost({ hostUid: targetUid, payload }))
      .unwrap()
      .then(() => {
        // 3. Success on saving changes -> Close modal immediately
        dispatch(closeEditHostModal());
        dispatch(clearHostError());

        // 4. Perform Login as follow-up
        dispatch(loginToHost(targetUid))
          .unwrap()
          .then(() => {
            // 5. Success -> refetch data, show server content
            dispatch(setSelectedHost(targetUid));
            dispatch(setActiveMainTab(`host:${targetUid}`));
            dispatch(fetchDatabaseStartInfo(targetUid));
            dispatch(fetchBrokerList(targetUid));
            dispatch(fetchHostEnv(targetUid));
          })
          .catch(() => {
            // Login failed: "just do nothing" (modal is already closed)
          });
      })
      .catch(() => {
        // Edit failed: just do nothing (modal stays open, error shown by slice)
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
        <SectionHeader title="Identity" icon="badge" />
        <div className="px-1">
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

        {/* Section 2: Host Connection */}
        <SectionHeader 
          title="Host" 
          icon="lan" 
          className="mt-8"
        />
        <div className="px-1">
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

        {/* Section 3: Credentials */}
        <SectionHeader title="Credentials" icon="lock" className="mt-8" />
        <div className="px-1">
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
    </Modal>
  );
}
