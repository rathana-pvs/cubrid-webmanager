import { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { addHost, clearHostError, openDiscoveryModal } from '../hostSlice';
import { Modal } from '../../../components/ds/layout/Modal';
import { Input } from '../../../components/ds/forms/Input';
import { Button } from '../../../components/ds/foundation/Button';
import { Icon } from '../../../components/ds/foundation/Icon';
import { SectionHeader } from '../../../components/ds/foundation/SectionHeader';
import { useCM } from '../../../constants/useCM';

export default function AddHostModal({ isOpen, onClose }) {
  const CM = useCM();
  const [formData, setFormData] = useState({
    id: '',
    address: '',
    port: '8001',
    password: '',
    alias: '',
  });
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const { loading, error: apiError, initialHostData } = useSelector((state) => state.host, shallowEqual);

  useEffect(() => {
    if (isOpen) {
      if (initialHostData) {
        setFormData({
          id: initialHostData.id || '',
          address: initialHostData.address || '',
          port: String(initialHostData.port || '8001'),
          password: initialHostData.password || '',
          alias: initialHostData.alias || '',
        });
      } else {
        setFormData({ id: '', address: '', port: '8001', password: '', alias: '' });
      }
      setErrors({});
    }
  }, [isOpen, initialHostData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) dispatch(clearHostError());
  };

  const validate = () => {
    const errs = {};
    if (!formData.alias.trim()) errs.alias = CM.hostNameRequired;
    if (!formData.address.trim()) errs.address = CM.addressRequired;
    if (!formData.port.trim()) errs.port = CM.portRequired;
    if (!formData.id.trim()) errs.id = CM.usernameRequired;
    if (!formData.password) errs.password = CM.passwordRequired;
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const payload = {
      ...formData,
      port: Number(formData.port),
      ...(initialHostData?.groupId ? { groupId: initialHostData.groupId } : {}),
    };
    try {
      await dispatch(addHost(payload)).unwrap();
      if (initialHostData) {
        dispatch(openDiscoveryModal());
      }
    } catch (e) {
      // Error handled by slice
    }
  };

  const handleClose = () => {
    onClose();
    dispatch(clearHostError());
    if (initialHostData) {
      dispatch(openDiscoveryModal());
    }
  };

  const connectionPreview = formData.address
    ? `${formData.address}:${formData.port || '8001'}`
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={CM.newConnection}
      icon="add_link"
      maxWidth="max-w-[500px]"
      loading={loading}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {CM.discard}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            icon="bolt"
            className="min-w-[140px]"
          >
            {CM.connect}
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
        <SectionHeader title={CM.identity} icon="badge" />
        <div className="px-1">
          <Input
            label={CM.friendlyName}
            name="alias"
            value={formData.alias}
            onChange={handleChange}
            error={errors.alias}
            placeholder={CM.friendlyNamePlaceholder}
            icon="label"
            disabled={loading}
          />
        </div>

        {/* Section 2: Host Connection */}
        <SectionHeader 
          title={CM.host} 
          icon="lan" 
          className="mt-8"
        />
        <div className="px-1">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <Input
                label={CM.ipAddressDomain}
                name="address"
                value={formData.address}
                onChange={handleChange}
                error={errors.address}
                placeholder={CM.hostAddressPlaceholder}
                icon="dns"
                disabled={loading}
              />
            </div>
            <div className="col-span-1">
              <Input
                label={CM.port}
                name="port"
                type="number"
                value={formData.port}
                onChange={handleChange}
                error={errors.port}
                placeholder={CM.hostPortPlaceholder}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Credentials */}
        <SectionHeader title={CM.credentials} icon="lock" className="mt-8" />
        <div className="px-1">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={CM.username}
              name="id"
              value={formData.id}
              onChange={handleChange}
              error={errors.id}
              placeholder={CM.hostUsernamePlaceholder}
              icon="person"
              disabled={loading}
            />
            <Input
              label={CM.password}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="••••••••"
              icon="key"
              disabled={loading}
            />
          </div>
        </div>

      </div>
    </Modal>
  );
}
