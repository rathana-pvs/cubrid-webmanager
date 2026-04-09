import { useState, useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { createDatabaseUser, updateDatabaseUser, fetchDatabaseUsers } from '../userSlice';
import { fetchDatabaseClasses } from '../../database/databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { SearchInput } from '../../../components/ds/forms/SearchInput';
import { Typography } from '../../../components/ds/foundation/Typography';
import { TabGroup } from '../../../components/ds/layout/TabGroup';
import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { 
  ModalStatusLoading, 
  ModalStatusSuccess, 
  ModalStatusError 
} from '../../../components/ds/feedback/ActionStatus';

const PERM_MAPPING = {
  'Select': 1,
  'Insert': 2,
  'Update': 4,
  'Delete': 8,
  'Alter': 16,
  'Index': 32,
  'Execute': 64,
  'G.Select': 2048,
  'G.Insert': 4096,
  'G.Update': 8192,
  'G.Delete': 16384,
  'G.Alter': 32768,
  'G.Index': 65536,
  'G.Execute': 131072,
};

const decodeCUBRIDAuth = (maskStr) => {
  const mask = parseInt(maskStr || '0', 10);
  const result = {};
  Object.keys(PERM_MAPPING).forEach(key => {
    result[key] = !!(mask & PERM_MAPPING[key]);
  });
  return result;
};

const encodeCUBRIDAuth = (authObj) => {
  let mask = 0;
  Object.keys(PERM_MAPPING).forEach(key => {
    if (authObj[key]) mask |= PERM_MAPPING[key];
  });
  return String(mask);
};

const TABS = [
  { id: 'general', label: 'Identity', icon: 'person' },
  { id: 'auth', label: 'Permissions', icon: 'shield_lock' },
];

export default function CreateUserModal({ isOpen, onClose, dbname, editingUser }) {
  const dispatch = useDispatch();
  const isEditMode = !!editingUser;
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  const { databaseUsers: allUsers, databaseUsersLoading } = useSelector((state) => state.user, shallowEqual);
  const databaseUsers = allUsers[dbname] || [];
  const { databaseClasses, databaseClassesLoading } = useSelector((state) => state.databaseConfiguration, shallowEqual);
  const { activeDatabases } = useSelector((state) => state.database, shallowEqual);
  const currentDbClasses = databaseClasses[dbname];
  const isClassesLoading = databaseClassesLoading[dbname];

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

  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    memo: '',
    groups: [],
    members: [],
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAvailable, setSelectedAvailable] = useState(null);
  const [selectedInTarget, setSelectedInTarget] = useState(null);
  
  const [selectedObjectId, setSelectedObjectId] = useState('');
  const [objectSearchTerm, setObjectSearchTerm] = useState('');
  const [objectAuths, setObjectAuths] = useState({});

  useEffect(() => {
    if (isOpen && dbname && selectedHostUid) {
      resetAction();
      dispatch(fetchDatabaseUsers({ hostUid: selectedHostUid, dbname }));
      const dbstatus = activeDatabases.includes(dbname) ? 'on' : 'off';
      dispatch(fetchDatabaseClasses({ hostUid: selectedHostUid, dbname, dbstatus }));
    }
    
    if (isOpen && databaseUsers.length > 0) {
      const publicGroup = databaseUsers.find(u => u.name === 'PUBLIC');
      if (publicGroup && !formData.groups.some(g => g.name === 'PUBLIC')) {
        setFormData(prev => ({
          ...prev,
          groups: [...prev.groups, publicGroup]
        }));
      }
    }

    if (isOpen && isEditMode && databaseUsers.length > 0) {
      const userToEdit = databaseUsers.find(u => (u.name || u) === editingUser);
      if (userToEdit) {
        const mappedGroups = (userToEdit.groups || []).map(g => 
          typeof g === 'string' ? { name: g } : { ...g, name: g.name || g['@name'] }
        );
        const mappedMembers = (userToEdit.members || []).map(m => 
          typeof m === 'string' ? { name: m } : { ...m, name: m.name || m['@name'] }
        );

        setFormData({
          name: userToEdit.name || userToEdit,
          password: '',
          confirmPassword: '',
          memo: userToEdit.comment || '',
          groups: mappedGroups,
          members: mappedMembers,
        });
        
        if (userToEdit.authorization && userToEdit.authorization[0]) {
          const authData = userToEdit.authorization[0];
          const newObjectAuths = {};
          Object.keys(authData).forEach(className => {
            if (className !== 'id' && className !== 'name') {
              newObjectAuths[className] = decodeCUBRIDAuth(authData[className]);
            }
          });
          setObjectAuths(newObjectAuths);
        }
      }
    } else if (isOpen && !isEditMode) {
      setFormData({ name: '', password: '', confirmPassword: '', memo: '', groups: [], members: [] });
      setActiveTab('general');
    }
  }, [isOpen, dbname, selectedHostUid, databaseUsers.length, isEditMode, editingUser, resetAction]);

  useEffect(() => {
    if (currentDbClasses && !selectedObjectId) {
      const firstUserClass = currentDbClasses.userclass?.[0]?.class?.[0]?.classname;
      const firstSysClass = currentDbClasses.systemclass?.[0]?.class?.[0]?.classname;
      const firstClass = firstUserClass || firstSysClass;
      if (firstClass) setSelectedObjectId(firstClass);
    }
  }, [currentDbClasses, selectedObjectId]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePermission = (objId, perm) => {
    setObjectAuths(prev => ({
      ...prev,
      [objId]: {
        ...(prev[objId] || {}),
        [perm]: !(prev[objId]?.[perm] || false)
      }
    }));
  };

  const handleDragStart = (e, item, source) => {
    setDraggedItem({ item, source });
    e.dataTransfer.setData('text/plain', item.name);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleMove = (item, source, target) => {
    if (!item || source === target) return;
    if (target === 'groups') {
      if (!formData.groups.some(g => g.name === item.name)) {
        setFormData(prev => ({ ...prev, groups: [...prev.groups, item], members: prev.members.filter(m => m.name !== item.name) }));
      }
    } else if (target === 'members') {
      if (!formData.members.some(m => m.name === item.name)) {
        setFormData(prev => ({ ...prev, members: [...prev.members, item], groups: prev.groups.filter(g => g.name !== item.name) }));
      }
    } else if (target === 'available') {
      setFormData(prev => ({ ...prev, groups: prev.groups.filter(g => g.name !== item.name), members: prev.members.filter(m => m.name !== item.name) }));
    }
    setSelectedAvailable(null);
    setSelectedInTarget(null);
  };

  const handleDrop = (e, target) => {
    e.preventDefault();
    if (!draggedItem) return;
    handleMove(draggedItem.item, draggedItem.source, target);
    setDraggedItem(null);
  };

  const removeItem = (name, type) => {
    setFormData(prev => ({ ...prev, [type]: prev[type].filter(i => i.name !== name) }));
  };

  const handleSelectAll = (objId) => {
    const allTrue = { Select: true, Insert: true, Update: true, Delete: true, Alter: true, Index: true, Execute: true, 'G.Select': true, 'G.Insert': true, 'G.Update': true, 'G.Delete': true, 'G.Alter': true, 'G.Index': true, 'G.Execute': true };
    setObjectAuths(prev => ({ ...prev, [objId]: allTrue }));
  };

  const handleClearAll = (objId) => {
    const allFalse = { Select: false, Insert: false, Update: false, Delete: false, Alter: false, Index: false, Execute: false, 'G.Select': false, 'G.Insert': false, 'G.Update': false, 'G.Delete': false, 'G.Alter': false, 'G.Index': false, 'G.Execute': false };
    setObjectAuths(prev => ({ ...prev, [objId]: allFalse }));
  };

  const handleSave = async () => {
    if (!formData.name) return;
    startAction();
    const authList = Object.keys(objectAuths).map(objId => ({ classname: objId, auth: encodeCUBRIDAuth(objectAuths[objId]) }));
    try {
      if (isEditMode) {
        await dispatch(updateDatabaseUser({ hostUid: selectedHostUid, dbname, userName: editingUser, payload: { userpass: formData.password, groups: { group: formData.groups.map(g => g.name || g) }, authorization: authList } })).unwrap();
        endSuccess(`Account @${editingUser} has been successfully updated.`);
      } else {
        await dispatch(createDatabaseUser({ hostUid: selectedHostUid, dbname, payload: { username: formData.name, userpass: formData.password, groups: { group: formData.groups.map(g => g.name || g) }, authorization: authList } })).unwrap();
        endSuccess(`Identity @${formData.name} has been successfully registered.`);
      }
      dispatch(fetchDatabaseUsers({ hostUid: selectedHostUid, dbname }));
    } catch (err) {
      endError(typeof err === 'string' ? err : (err.message || 'Identity synchronization failed. Please check host availability.'));
    }
  };

  const availableUsers = databaseUsers
    .filter(u => !formData.groups.some(g => g.name === u.name) && !formData.members.some(m => m.name === u.name))
    .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // ─── Lifecycle states ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Modal isOpen title={isEditMode ? 'Updating User' : 'Creating User'} icon="person_add" onClose={onClose} maxWidth="max-w-[860px]">
        <ModalStatusLoading title={isEditMode ? 'Updating Registry' : 'Committing Identity'} subtitle={`Propagating changes for @${formData.name || editingUser} to ${dbname}.`} />
      </Modal>
    );
  }

  if (isSuccess) {
    return (
      <Modal isOpen title="Success" icon="check_circle" iconVariant="success" onClose={onClose} maxWidth="max-w-[860px]">
        <ModalStatusSuccess
          title={isEditMode ? 'User Updated' : 'User Created'}
          message={isEditMode ? `Credentials and permissions for @${editingUser} are now synchronized.` : `@${formData.name} is now active and ready for use.`}
          onConfirm={onClose}
          confirmText="Acknowledge"
        />
      </Modal>
    );
  }

  if (isError) {
    return (
      <Modal isOpen title="Error" icon="error" iconVariant="danger" onClose={resetAction} maxWidth="max-w-[860px]">
        <ModalStatusError title="Operation Failed" error={actionError} onRetry={handleSave} onCancel={resetAction} retryText="Retry" cancelText="Dismiss" />
      </Modal>
    );
  }

  // ─── Available tabs ──────────────────────────────────────────────────────── 
  const visibleTabs = TABS.filter(t => t.id !== 'auth' || editingUser !== 'DBA');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit User' : 'Create User'}
      subtitle={dbname}
      icon={isEditMode ? 'manage_accounts' : 'person_add'}
      maxWidth="max-w-[860px]"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <Icon name="database" size="xs" className="opacity-40" />
            <span className="opacity-60 font-mono">{dbname}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Discard</Button>
            <Button onClick={handleSave} icon={isEditMode ? 'save' : 'person_add'} disabled={!formData.name} className="min-w-[140px]">
              {isEditMode ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-[560px]">

        {/* ── Tab bar ─────────────────────────────────────────────────────── */}
        <div className="mb-5 shrink-0">
          <TabGroup tabs={visibleTabs} active={activeTab} onChange={setActiveTab} />
        </div>

        {/* ── Tab content ──────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* ════ GENERAL TAB ════════════════════════════════════════════════ */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-1 duration-200 pb-4">

              {/* Identity hero card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/8 to-transparent border border-amber-500/15">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                  <Icon name={isEditMode ? 'manage_accounts' : 'person_add'} size="md" className="text-amber-500" />
                </div>
                <div>
                  <p className="text-[13px] font-black text-slate-800 dark:text-white">
                    {isEditMode ? `Editing @${editingUser}` : 'New Database User'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isEditMode
                      ? 'Update credentials and group memberships below.'
                      : 'Define identity, credentials, and role membership.'}
                  </p>
                </div>
              </div>

              {/* ── Account details ─────────────────────────────────────────── */}
              <section className="space-y-3">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="w-1 h-3.5 rounded-full bg-amber-500 shrink-0" />
                  <Typography variant="caption" className="font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest text-[10px]">
                    Account
                  </Typography>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Username"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. sys_auditor"
                    disabled={isEditMode}
                    required
                  />
                  <Input
                    label="Description"
                    name="memo"
                    value={formData.memo}
                    onChange={handleInputChange}
                    placeholder="Role or purpose"
                  />
                </div>
              </section>

              {/* ── Security credentials ─────────────────────────────────────── */}
              <section className="space-y-3">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="w-1 h-3.5 rounded-full bg-slate-400 shrink-0" />
                  <Typography variant="caption" className="font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest text-[10px]">
                    Password
                  </Typography>
                  {isEditMode && (
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                      leave blank to keep current
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="New Password" type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" />
                  <Input label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="••••••••" />
                </div>
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <div className="flex items-center gap-2 text-[11px] text-rose-500 font-bold px-1">
                    <Icon name="error" size="xs" />
                    Passwords do not match
                  </div>
                )}
              </section>

              {/* ── Role & group matrix ──────────────────────────────────────── */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-1 h-3.5 rounded-full bg-sky-400 shrink-0" />
                    <Typography variant="caption" className="font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest text-[10px]">
                      Groups &amp; Members
                    </Typography>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Drag or double-click to assign
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-0 h-[260px] border border-slate-200 dark:border-white/8 rounded-2xl overflow-hidden shadow-sm">

                  {/* Available identities */}
                  <div
                    className="col-span-5 flex flex-col border-r border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-background-dark/40"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'available')}
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 bg-white/60 dark:bg-white/3 shrink-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</p>
                    </div>
                    <div className="p-2 border-b border-slate-100 dark:border-white/5 shrink-0">
                      <SearchInput placeholder="Search..." value={searchTerm} onChange={setSearchTerm} onClear={() => setSearchTerm('')} size="sm" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar space-y-0.5">
                      {databaseUsersLoading[dbname] ? (
                        <div className="h-full flex items-center justify-center opacity-30">
                          <Icon name="refresh" size="sm" className="animate-spin text-amber-500" />
                        </div>
                      ) : availableUsers.length > 0 ? availableUsers.map(user => (
                        <div
                          key={user.name}
                          draggable
                          onDragStart={(e) => handleDragStart(e, user, 'available')}
                          onClick={() => { setSelectedAvailable(user); setSelectedInTarget(null); }}
                          onDoubleClick={() => handleMove(user, 'available', 'groups')}
                          className={`px-3 py-2 text-[11px] font-semibold rounded-xl cursor-grab active:cursor-grabbing transition-all flex items-center gap-2.5 select-none ${
                            draggedItem?.item?.name === user.name ? 'opacity-30' : ''
                          } ${
                            selectedAvailable?.name === user.name
                              ? 'bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5 hover:shadow-sm'
                          }`}
                        >
                          <Icon
                            name={user.name === 'PUBLIC' || user.members ? 'groups' : 'person'}
                            size="sm"
                            className={selectedAvailable?.name === user.name ? 'text-slate-900' : 'text-slate-300 dark:text-slate-500'}
                          />
                          <span className="truncate">{user.name}</span>
                          {(user.name === 'PUBLIC' || user.members) && (
                            <span className={`ml-auto text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${selectedAvailable?.name === user.name ? 'bg-black/10 text-slate-900' : 'bg-slate-200 dark:bg-white/10 text-slate-400'}`}>
                              GROUP
                            </span>
                          )}
                        </div>
                      )) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 py-4">
                          <Icon name="person_off" size="md" className="mb-1" />
                          <p className="text-[10px] font-bold">No identities</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow controls */}
                  <div className="col-span-1 flex flex-col items-center justify-center gap-2 bg-slate-50/40 dark:bg-white/2 border-r border-slate-100 dark:border-white/5">
                    <button
                      onClick={() => handleMove(selectedAvailable, 'available', 'groups')}
                      disabled={!selectedAvailable}
                      title="Move to Groups"
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                        selectedAvailable
                          ? 'text-amber-500 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-900 shadow-sm'
                          : 'text-slate-300 dark:text-slate-600 opacity-30 cursor-not-allowed'
                      }`}
                    >
                      <Icon name="chevron_right" size="sm" />
                    </button>
                    <button
                      onClick={() => handleMove(selectedInTarget?.item, selectedInTarget?.target, 'available')}
                      disabled={!selectedInTarget}
                      title="Remove from assigned"
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                        selectedInTarget
                          ? 'text-amber-500 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-900 shadow-sm'
                          : 'text-slate-300 dark:text-slate-600 opacity-30 cursor-not-allowed'
                      }`}
                    >
                      <Icon name="chevron_left" size="sm" />
                    </button>
                  </div>

                  {/* Assigned groups + members */}
                  <div className="col-span-6 flex flex-col bg-white dark:bg-background-dark/20">

                    {/* Groups drop zone */}
                    <div
                      className={`flex-1 flex flex-col border-b border-slate-100 dark:border-white/5 transition-colors duration-150 ${draggedItem?.source === 'available' ? 'bg-sky-500/5' : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'groups')}
                    >
                      <div className="px-3 py-2 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 shrink-0 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Groups</p>
                        <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">{formData.groups.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {formData.groups.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {formData.groups.map(group => (
                              <div
                                key={group.name}
                                draggable
                                onDragStart={(e) => handleDragStart(e, group, 'groups')}
                                onClick={() => { setSelectedInTarget({ item: group, target: 'groups' }); setSelectedAvailable(null); }}
                                onDoubleClick={() => handleMove(group, 'groups', 'available')}
                                className={`flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-grab active:cursor-grabbing ${
                                  selectedInTarget?.item?.name === group.name
                                    ? 'bg-sky-500 text-white border-sky-400 shadow-md'
                                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-sky-400/50 hover:bg-sky-50 dark:hover:bg-sky-500/10'
                                }`}
                              >
                                <Icon name="groups" size="xs" className={selectedInTarget?.item?.name === group.name ? 'text-white' : 'text-sky-400'} />
                                <span>{group.name}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeItem(group.name, 'groups'); }}
                                  className="w-4 h-4 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors"
                                >
                                  <Icon name="close" size="xs" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center opacity-10 pointer-events-none">
                            <Icon name="drag_indicator" size="sm" className="mb-1" />
                            <p className="text-[9px] font-black uppercase tracking-widest">Drop groups here</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Members drop zone */}
                    <div
                      className={`flex-1 flex flex-col transition-colors duration-150 ${draggedItem?.source === 'available' ? 'bg-amber-500/5' : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'members')}
                    >
                      <div className="px-3 py-2 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 shrink-0 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Members</p>
                        <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">{formData.members.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {formData.members.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {formData.members.map(member => (
                              <div
                                key={member.name}
                                draggable
                                onDragStart={(e) => handleDragStart(e, member, 'members')}
                                onClick={() => { setSelectedInTarget({ item: member, target: 'members' }); setSelectedAvailable(null); }}
                                onDoubleClick={() => handleMove(member, 'members', 'available')}
                                className={`flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-grab active:cursor-grabbing ${
                                  selectedInTarget?.item?.name === member.name
                                    ? 'bg-amber-500 text-slate-900 border-amber-400 shadow-md'
                                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-amber-400/50 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                                }`}
                              >
                                <Icon name="person" size="xs" className={selectedInTarget?.item?.name === member.name ? 'text-slate-900' : 'text-amber-400'} />
                                <span>{member.name}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeItem(member.name, 'members'); }}
                                  className="w-4 h-4 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors"
                                >
                                  <Icon name="close" size="xs" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center opacity-10 pointer-events-none">
                            <Icon name="drag_indicator" size="sm" className="mb-1" />
                            <p className="text-[9px] font-black uppercase tracking-widest">Drop members here</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ════ AUTH TAB ═══════════════════════════════════════════════════ */}
          {activeTab === 'auth' && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200 h-full flex flex-col pb-4">
              <div className="flex bg-white dark:bg-background-dark/40 border border-slate-200 dark:border-white/8 rounded-2xl overflow-hidden flex-1 shadow-sm">

                {/* Object list sidebar */}
                <div className="w-[220px] border-r border-slate-100 dark:border-white/5 flex flex-col shrink-0">
                  <div className="p-2.5 border-b border-slate-100 dark:border-white/5 shrink-0">
                    <SearchInput placeholder="Filter objects..." value={objectSearchTerm} onChange={setObjectSearchTerm} onClear={() => setObjectSearchTerm('')} size="sm" />
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                    {isClassesLoading ? (
                      <div className="py-10 text-center opacity-20">
                        <Icon name="refresh" size="sm" className="animate-spin mx-auto mb-2" />
                        <p className="text-[10px] font-bold uppercase">Loading...</p>
                      </div>
                    ) : (() => {
                      const systemClasses = currentDbClasses?.systemclass?.[0]?.class?.map(c => ({ name: c.classname, type: 'system' })) || [];
                      const userClasses = currentDbClasses?.userclass?.[0]?.class?.map(c => ({ name: c.classname, type: 'user' })) || [];
                      const allObjects = [...userClasses, ...systemClasses].filter(o => o.name.toLowerCase().includes(objectSearchTerm.toLowerCase()));
                      if (allObjects.length === 0) return (
                        <div className="text-center py-10 opacity-20">
                          <Icon name="table_chart_off" size="md" className="mx-auto mb-2" />
                          <p className="text-[10px] font-bold uppercase">No objects</p>
                        </div>
                      );
                      return allObjects.map(obj => (
                        <button
                          key={obj.name}
                          onClick={() => setSelectedObjectId(obj.name)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all group text-left ${
                            selectedObjectId === obj.name
                              ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-amber-500/8 hover:text-amber-600 dark:hover:text-amber-400'
                          }`}
                        >
                          <Icon
                            name={obj.type === 'system' ? 'settings_suggest' : 'table_chart'}
                            size="sm"
                            className={selectedObjectId === obj.name ? 'text-slate-900' : 'text-slate-300 dark:text-slate-600 group-hover:text-amber-500/60'}
                          />
                          <span className="text-[10px] font-bold truncate uppercase tracking-tight">{obj.name}</span>
                          {objectAuths[obj.name] && Object.values(objectAuths[obj.name]).some(Boolean) && (
                            <span className={`ml-auto w-2 h-2 rounded-full shrink-0 ${selectedObjectId === obj.name ? 'bg-slate-900/30' : 'bg-amber-400'}`} />
                          )}
                        </button>
                      ));
                    })()}
                  </div>
                </div>

                {/* Permission editor */}
                <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                  {selectedObjectId ? (
                    <div className="p-5 space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <Icon name="shield_lock" size="sm" className="text-amber-500" />
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-tight">{selectedObjectId}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Access mask configuration</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleSelectAll(selectedObjectId)} className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-green-400/50 hover:text-green-500 hover:bg-green-500/5 transition-all">
                            All
                          </button>
                          <button onClick={() => handleClearAll(selectedObjectId)} className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-rose-400/50 hover:text-rose-500 hover:bg-rose-500/5 transition-all">
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* DML */}
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-sky-500">DML</span>
                          <div className="flex-1 h-px bg-sky-500/15" />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {['Select', 'Insert', 'Update', 'Delete'].map(perm => {
                            const isActive = objectAuths[selectedObjectId]?.[perm];
                            return (
                              <button
                                key={perm}
                                onClick={() => togglePermission(selectedObjectId, perm)}
                                className={`p-3 rounded-xl border text-left transition-all group relative ${
                                  isActive
                                    ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-400/40 shadow-sm'
                                    : 'bg-slate-50 dark:bg-white/3 border-slate-200 dark:border-white/5 hover:border-sky-300/40 hover:bg-sky-50/50 dark:hover:bg-sky-500/5'
                                }`}
                              >
                                {isActive && (
                                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center">
                                    <Icon name="check" size="xs" className="text-white" style={{ fontSize: '9px' }} />
                                  </span>
                                )}
                                <span className={`text-[10px] font-black uppercase tracking-tight block ${isActive ? 'text-sky-500' : 'text-slate-400'}`}>{perm}</span>
                                <span className="text-[8px] text-slate-300 dark:text-slate-600 font-medium mt-0.5 block capitalize">{perm.toLowerCase()} rows</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* DDL */}
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">DDL</span>
                          <div className="flex-1 h-px bg-amber-500/15" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {['Alter', 'Index', 'Execute'].map(perm => {
                            const isActive = objectAuths[selectedObjectId]?.[perm];
                            return (
                              <button
                                key={perm}
                                onClick={() => togglePermission(selectedObjectId, perm)}
                                className={`p-3 rounded-xl border text-left transition-all relative ${
                                  isActive
                                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400/40 shadow-sm'
                                    : 'bg-slate-50 dark:bg-white/3 border-slate-200 dark:border-white/5 hover:border-amber-300/40 hover:bg-amber-50/50 dark:hover:bg-amber-500/5'
                                }`}
                              >
                                {isActive && (
                                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                                    <Icon name="check" size="xs" className="text-white" style={{ fontSize: '9px' }} />
                                  </span>
                                )}
                                <span className={`text-[10px] font-black uppercase tracking-tight block ${isActive ? 'text-amber-500' : 'text-slate-400'}`}>{perm}</span>
                                <span className="text-[8px] text-slate-300 dark:text-slate-600 font-medium mt-0.5 block">
                                  {perm === 'Execute' ? 'Procedures' : `Structural ${perm.toLowerCase()}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Grant delegation */}
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Grant Delegation</span>
                          <div className="flex-1 h-px bg-indigo-500/15" />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {['G.Select', 'G.Insert', 'G.Update', 'G.Delete', 'G.Alter', 'G.Index', 'G.Execute'].map(perm => {
                            const isActive = objectAuths[selectedObjectId]?.[perm];
                            const label = perm.replace('G.', '');
                            return (
                              <button
                                key={perm}
                                onClick={() => togglePermission(selectedObjectId, perm)}
                                className={`px-2 py-2 rounded-lg border flex items-center gap-1.5 transition-all ${
                                  isActive
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-400/40'
                                    : 'bg-slate-50 dark:bg-white/3 border-slate-200 dark:border-white/5 opacity-50 hover:opacity-100 hover:border-indigo-300/40'
                                }`}
                              >
                                <span className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 transition-all ${isActive ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-white/20'}`}>
                                  {isActive && <Icon name="check" size="xs" className="text-white" style={{ fontSize: '8px' }} />}
                                </span>
                                <span className={`text-[9px] font-black uppercase ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>{label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-20 p-8">
                      <Icon name="shield_lock" size="lg" className="mb-3" />
                      <p className="text-[11px] font-black uppercase tracking-widest">Select an object</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
