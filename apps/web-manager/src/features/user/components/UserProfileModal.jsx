import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateAccount, fetchUser } from '../../auth/authSlice';
import { authApi } from '../../auth/authApi';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function UserProfileModal({ isOpen, onClose }) {
  const { user } = useSelector((state) => state.auth);
  const [editMode, setEditMode] = useState(null); // 'profile' | 'password' | null
  
  const [profile, setProfile] = useState({
    id: user?.id || '',
    department: user?.department || '',
  });

  const [editProfile, setEditProfile] = useState({ ...profile });
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      const newProfile = {
        id: user.id || '',
        department: user.department || ''
      };
      setProfile(newProfile);
      if (!editMode) {
        setEditProfile(newProfile);
      }
    }
  }, [user, editMode]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const globalLoading = useSelector(state => state.auth.loading);
  const globalError = useSelector(state => state.auth.error);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError(null);
    try {
      if (editMode === 'password') {
        if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
          setError("Please fill in all password fields.");
          return;
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
          setError("New passwords do not match.");
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
          await dispatch(fetchUser()); // Refresh data from server
          setEditMode(null);
        } else {
          setError(resultAction.payload || "Failed to update profile");
        }
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "An unexpected error occurred");
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
      <Button 
        variant="ghost" 
        onClick={handleCancel}
        disabled={loading || globalLoading}
      >
        Discard
      </Button>
      <Button 
        onClick={handleSave}
        loading={loading || globalLoading}
        icon="check_circle"
        className="min-w-[120px]"
      >
        {editMode === 'password' ? 'Update' : 'Save'}
      </Button>
    </>
  ) : (
    <div className="flex gap-3 w-full">
      <Button 
        variant="ghost"
        className="flex-1"
        icon="edit_square"
        onClick={() => setEditMode('profile')}
      >
        Modify
      </Button>
      <Button 
        variant="ghost"
        className="flex-1"
        icon="lock_reset"
        onClick={() => setEditMode('password')}
      >
        Security
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editMode === 'password' ? 'Change password' : 'Account info'}
      subtitle={editMode === 'password' ? 'Update your security credentials' : 'Manage your profile details'}
      icon={editMode === 'password' ? 'key' : 'account_circle'}
      maxWidth="max-w-[400px]"
      footer={footer}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Typography variant="caption" className="text-slate-500 font-medium ml-1">User ID</Typography>
          <div className="h-9 px-3 flex items-center bg-slate-50/50 dark:bg-bk-main/20 border border-slate-100 dark:border-white/5 rounded-xl text-[11px] font-bold text-slate-400 dark:text-slate-600 cursor-not-allowed">
            {profile.id}
          </div>
        </div>

        {editMode === 'profile' ? (
          <Input 
            label="Department"
            value={editProfile.department}
            onChange={(e) => setEditProfile(prev => ({ ...prev, department: e.target.value }))}
            placeholder="Enter department name"
            className="animate-in slide-in-from-top-1"
          />
        ) : editMode === 'password' ? (
          <div className="space-y-4 animate-in slide-in-from-top-1">
            <Input 
              type="password"
              label="Old password"
              value={passwords.oldPassword}
              onChange={(e) => setPasswords(prev => ({ ...prev, oldPassword: e.target.value }))}
            />
            <Input 
              type="password"
              label="New password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
            />
            <Input 
              type="password"
              label="Confirm password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Typography variant="caption" className="text-slate-500 font-medium ml-1">Department</Typography>
            <div className="h-9 px-3 flex items-center bg-slate-50/50 dark:bg-bk-main/20 border border-slate-100 dark:border-white/5 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {profile.department || 'Not assigned'}
            </div>
          </div>
        )}

        {(error || globalError) && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-500 animate-in slide-in-from-top-1 duration-200">
            <Icon name="error" size="sm" />
            <Typography variant="p" className="text-[11px] font-medium">{error || globalError}</Typography>
          </div>
        )}
      </div>
    </Modal>
  );
}
