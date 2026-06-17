import { useState, useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import {
  addCmsUser,
  updateCmsUser,
  setHostPassword,
  fetchCmsUsers,
  closeEditCmsUserModal
} from '../hostSlice';

import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
import { SectionHeader } from '../../../components/ds/foundation/SectionHeader';
import { InfoBanner } from '../../../components/ds/foundation/InfoBanner';
import { useActionState } from '../../../infrastructure/hooks/useActionState';
import {
  ModalStatusLoading,
  ModalStatusSuccess,
  ModalStatusError
} from '../../../components/ds/feedback/ActionStatus';
import { useCM } from '../../../constants/useCM';

export default function EditCMSUserModal() {
  const CM = useCM();
  const AUTH_OPTIONS = [
    { value: 'none', label: CM.noAccess },
    { value: 'monitor', label: CM.monitorOnly },
    { value: 'admin', label: CM.fullControl },
  ];
  const DB_CREATE_OPTIONS = [
    { value: 'none', label: CM.noAccess },
    { value: 'admin', label: CM.fullControl },
  ];
  const dispatch = useDispatch();
  const {
    isEditCmsUserModalOpen,
    selectedHostUid,
    cmsUserToEdit,
  } = useSelector((state) => state.host, shallowEqual);

  const isOpen = isEditCmsUserModalOpen;
  const isEditMode = !!cmsUserToEdit?.user;
  const editUser = cmsUserToEdit?.user;
  const username = isEditMode ? (editUser?.id || editUser?.name || editUser['@id'] || editUser.targetid || '') : '';
  const isAdmin = isEditMode && username === 'admin';

  const {
    error: actionError,
    startAction,
    endSuccess,
    endError,
    resetAction,
    isLoading,
    isSuccess,
    isError
  } = useActionState();

  const [formData, setFormData] = useState({
    targetid: '',
    password: '',
    confirmPassword: '',
    casauth: 'none',
    dbcreate: 'none',
    statusmonitorauth: 'none',
  });

  useEffect(() => {
    if (isOpen) {
      resetAction();
      if (isEditMode && editUser) {
        const id = editUser.id || editUser.name || editUser['@id'] || editUser.targetid || '';
        const cas = editUser.casauth || editUser['@casauth'] || 'none';
        const dbc = editUser.dbcreate || editUser['@dbcreate'] || 'none';
        const sm = editUser.statusmonitorauth || editUser['@statusmonitorauth'] || 'none';

        setFormData({
          targetid: id,
          password: '',
          confirmPassword: '',
          casauth: cas,
          dbcreate: dbc,
          statusmonitorauth: sm,
        });
      } else {
        setFormData({
          targetid: '',
          password: '',
          confirmPassword: '',
          casauth: 'none',
          dbcreate: 'none',
          statusmonitorauth: 'none',
        });
      }
    }
  }, [isOpen, isEditMode, editUser, resetAction]);

  const passwordMismatch = formData.password !== formData.confirmPassword;
  const canSave = formData.targetid && (!isEditMode ? !!formData.password : true) && !passwordMismatch;

  const handleSave = async () => {
    if (!canSave) return;
    startAction();
    try {
      if (isEditMode) {
        if (formData.password) {
          await dispatch(setHostPassword({
            hostUid: selectedHostUid,
            payload: { targetid: formData.targetid, newpassword: formData.password }
          })).unwrap();
        }
        if (!isAdmin) {
          await dispatch(updateCmsUser({
            hostUid: selectedHostUid,
            payload: {
              targetid: formData.targetid,
              casauth: formData.casauth,
              dbcreate: formData.dbcreate,
              statusmonitorauth: formData.statusmonitorauth,
              dbauth: editUser.dbauth || [],
            }
          })).unwrap();
        }
        endSuccess(`User @${formData.targetid} successfully updated.`);
      } else {
        await dispatch(addCmsUser({
          hostUid: selectedHostUid,
          payload: {
            targetid: formData.targetid,
            password: formData.password,
            casauth: formData.casauth,
            dbcreate: formData.dbcreate,
            statusmonitorauth: formData.statusmonitorauth,
          }
        })).unwrap();
        endSuccess(`User @${formData.targetid} successfully created.`);
      }
      dispatch(fetchCmsUsers(selectedHostUid));
    } catch (err) {
      endError(err?.message || 'Synchronization failed.');
    }
  };

  const handleClose = () => dispatch(closeEditCmsUserModal());

  if (!isOpen) return null;

  if (isLoading) return (
    <Modal isOpen title={isEditMode ? 'Saving Changes' : 'Creating User'} icon="person" onClose={resetAction} maxWidth="500px" showCloseButton={false}>
      <ModalStatusLoading title={isEditMode ? 'Updating...' : 'Creating...'} />
    </Modal>
  );

  if (isSuccess) return (
    <Modal isOpen title={CM.success} icon="check_circle" iconVariant="success" onClose={handleClose} maxWidth="500px">
      <ModalStatusSuccess title="Synchronized" onConfirm={handleClose} />
    </Modal>
  );

  if (isError) return (
    <Modal isOpen title={CM.error} icon="error" iconVariant="danger" onClose={resetAction} maxWidth="500px">
      <ModalStatusError title={CM.failure} error={actionError} onRetry={handleSave} onCancel={resetAction} />
    </Modal>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? CM.editUser : CM.addUser}
      subtitle={isEditMode ? `Editing @${username}` : 'Create a new management account'}
      icon={isEditMode ? 'manage_accounts' : 'person_add'}
      maxWidth="540px"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isEditMode ? 'Save Changes' : 'Add User'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {isAdmin && (
          <div className="px-1">
            <InfoBanner title="Administrator Account">
              This is the primary system administrator account. System level permissions are fixed and cannot be modified.
            </InfoBanner>
          </div>
        )}

        {/* Account Info */}
        <section>
          <SectionHeader title="Account Information" icon="person" />
          <div className="space-y-4 px-1">
            <Input
              label="Login ID"
              value={formData.targetid}
              onChange={(e) => setFormData(p => ({ ...p, targetid: e.target.value }))}
              disabled={isEditMode}
              icon="badge"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                placeholder={isEditMode ? 'Leave blank to keep' : 'Enter password'}
                icon="lock"
                required={!isEditMode}
                error={passwordMismatch && formData.confirmPassword ? "Passwords do not match" : null}
              />
              <Input
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Confirm password"
                icon="lock_clock"
                required={!!formData.password}
                error={passwordMismatch && formData.confirmPassword ? "Passwords do not match" : null}
              />
            </div>
          </div>
        </section>

        {/* Permissions */}
        {!isAdmin && (
          <section>
            <SectionHeader title={CM.permissions} icon="shield" />
            <div className="px-1">
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/2 p-4">
                <div className="grid grid-cols-1 gap-4">
                  <Select
                    label={CM.dbCreatePermission}
                    options={DB_CREATE_OPTIONS}
                    value={formData.dbcreate}
                    onChange={(e) => setFormData(p => ({ ...p, dbcreate: e.target.value }))}
                    icon="storage"
                  />
                  <Select
                    label={CM.brokerPermission}
                    options={AUTH_OPTIONS}
                    value={formData.casauth}
                    onChange={(e) => setFormData(p => ({ ...p, casauth: e.target.value }))}
                    icon="hub"
                  />
                  <Select
                    label={CM.monitoringPermission}
                    options={DB_CREATE_OPTIONS}
                    value={formData.statusmonitorauth}
                    onChange={(e) => setFormData(p => ({ ...p, statusmonitorauth: e.target.value }))}
                    icon="monitor_heart"
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
