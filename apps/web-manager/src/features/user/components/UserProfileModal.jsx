import { useState, useEffect } from 'react';
import { useSelector, useDispatch , shallowEqual } from 'react-redux';
import { updateAccount, fetchUser } from '../../auth/authSlice';
import { authApi } from '../../auth/authApi';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { SectionHeader } from '../../../components/ds/foundation/SectionHeader';

export default function UserProfileModal({ isOpen, onClose }) {
  const { user } = useSelector((state) => state.auth, shallowEqual);
  const [editMode, setEditMode] = useState(null); // 'profile' | 'password' | null

  const [profile, setProfile] = useState({
    id: user?.id || '',
    department: user?.department || '',
  });
  const [editProfile, setEditProfile] = useState({ ...profile });
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (isOpen) {
      const newProfile = { id: user?.id || '', department: user?.department || '' };
      setProfile(newProfile);
      setEditProfile(newProfile);
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setEditMode(null);
      setError(null);
    }
  }, [isOpen, user]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const globalLoading = useSelector((state) => state.auth.loading);
  const globalError = useSelector((state) => state.auth.error);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError(null);
    try {
      if (editMode === 'password') {
        if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
          setError('Please fill in all password fields.');
          return;
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
          setError('New passwords do not match.');
          return;
        }
        setLoading(true);
        await authApi.updatePassword(passwords.oldPassword, passwords.newPassword);
        setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setEditMode(null);
        setLoading(false);
      } else if (editMode === 'profile') {
        setLoading(true);
        const resultAction = await dispatch(updateAccount({ department: editProfile.department }));
        if (updateAccount.fulfilled.match(resultAction)) {
          await dispatch(fetchUser());
          setEditMode(null);
        } else {
          setError(resultAction.payload || 'Failed to update profile');
        }
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditProfile({ ...profile });
    setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setEditMode(null);
    setError(null);
  };

  const footer = editMode ? (
    <>
      <Button variant="ghost" onClick={handleCancel} disabled={loading || globalLoading}>
        Discard
      </Button>
      <Button
        onClick={handleSave}
        loading={loading || globalLoading}
        icon="check_circle"
        className="min-w-[120px]"
      >
        {editMode === 'password' ? 'Update Password' : 'Save Changes'}
      </Button>
    </>
  ) : (
    <div className="flex gap-2 w-full">
      <Button variant="ghost" className="flex-1" onClick={() => setEditMode('profile')}>
        Edit Profile
      </Button>
      <Button variant="ghost" className="flex-1" onClick={() => setEditMode('password')}>
        Change Password
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editMode === 'password' ? 'Change Password' : 'Account Profile'}
      icon={editMode === 'password' ? 'lock_reset' : 'account_circle'}
      maxWidth="max-w-[420px]"
      footer={footer}
    >
      <div className="space-y-4 p-1">

        {/* Error Banner */}
        {(error || globalError) && (
          <div className="flex items-start gap-3 px-4 py-3 bg-rose-500/5 border border-rose-500/15 rounded-xl">
            <Icon name="error_outline" size="sm" weight={300} className="text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-rose-500 font-medium flex-1 leading-relaxed">{error || globalError}</p>
          </div>
        )}

        {/* View Mode */}
        {!editMode && (
          <>
            {/* Avatar / Identity Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
                <Icon name="person" size="24px" weight={400} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight truncate">
                  {profile.id || '—'}
                </p>
                <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest mt-0.5">
                  Administrator
                </p>
              </div>
            </div>

            {/* Info Card */}
            <div>
              <SectionHeader title="Account Details" icon="info" />
              <div className="rounded-xl border border-slate-200 dark:border-white/8 overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                <div className="flex items-center px-4 py-3 gap-3">
                  <Icon name="badge" size="16px" weight={300} className="text-slate-400 shrink-0" />
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 w-24 shrink-0">User ID</span>
                  <span className="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 truncate">{profile.id || '—'}</span>
                </div>
                <div className="flex items-center px-4 py-3 gap-3">
                  <Icon name="corporate_fare" size="16px" weight={300} className="text-slate-400 shrink-0" />
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 w-24 shrink-0">Department</span>
                  <span className="text-[11.5px] font-medium text-slate-700 dark:text-slate-300 truncate">{profile.department || 'Not assigned'}</span>
                </div>
              </div>
              </div>
            </div>
          </>
        )}

        {/* Edit Profile Mode */}
        {editMode === 'profile' && (
          <div>
            <SectionHeader title="Update Profile" icon="edit_square" />
            <div className="rounded-xl border border-slate-200 dark:border-white/8 overflow-hidden">
            <div className="p-4 space-y-3">
              {/* Read-only User ID */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">User ID</label>
                <div className="h-10 px-3.5 flex items-center gap-2 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/8 rounded-xl">
                  <Icon name="badge" size="14px" weight={300} className="text-slate-400" />
                  <span className="text-[12px] font-bold text-slate-400 dark:text-slate-600">{profile.id}</span>
                  <span className="ml-auto text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">locked</span>
                </div>
              </div>
              <Input
                label="Department"
                value={editProfile.department}
                onChange={(e) => setEditProfile((prev) => ({ ...prev, department: e.target.value }))}
                placeholder="e.g. Engineering"
                icon="corporate_fare"
                disabled={loading || globalLoading}
              />
            </div>
          </div>
        </div>
      )}

        {/* Change Password Mode */}
        {editMode === 'password' && (
          <div>
            <SectionHeader title="Security Settings" icon="lock" />
            <div className="rounded-xl border border-slate-200 dark:border-white/8 overflow-hidden">
            <div className="p-4 space-y-3">
              <Input
                type="password"
                label="Current Password"
                icon="lock"
                value={passwords.oldPassword}
                onChange={(e) => setPasswords((prev) => ({ ...prev, oldPassword: e.target.value }))}
                disabled={loading || globalLoading}
                placeholder="••••••••"
              />
              <Input
                type="password"
                label="New Password"
                icon="key"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((prev) => ({ ...prev, newPassword: e.target.value }))}
                disabled={loading || globalLoading}
                placeholder="••••••••"
              />
              <Input
                type="password"
                label="Confirm New Password"
                icon="key_vertical"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                disabled={loading || globalLoading}
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>
      )}

      </div>
    </Modal>
  );
}
