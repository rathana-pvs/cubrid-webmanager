import { useState, useEffect } from 'react';
import { useSelector, useDispatch , shallowEqual } from 'react-redux';
import { createDatabaseUser, updateDatabaseUser, fetchDatabaseUsers, clearUserError } from '../userSlice';
import { fetchDatabaseClasses } from '../../database/databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { SearchInput } from '../../../components/ds/forms/SearchInput';
import { Typography } from '../../../components/ds/foundation/Typography';

const PERM_MAPPING = {
  'Select': 1,
  'Insert': 2,
  'Update': 4,
  'Delete': 8,
  'Alter': 16,
  'Index': 32,
  'Execute': 64,
  'G.Select': 2048,   // Mapping for Grant bits
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

export default function CreateUserModal({ isOpen, onClose, dbname, editingUser }) {
  const dispatch = useDispatch();
  const isEditMode = !!editingUser;
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  const { databaseUsers: allUsers, databaseUsersLoading, error: userError, actionLoading } = useSelector((state) => state.user, shallowEqual);
  const databaseUsers = allUsers[dbname] || [];
  const loading = databaseUsersLoading[dbname];
  const { databaseClasses, databaseClassesLoading } = useSelector((state) => state.databaseConfiguration, shallowEqual);
  const { activeDatabases } = useSelector((state) => state.database, shallowEqual);
  const currentDbClasses = databaseClasses[dbname];
  const isClassesLoading = databaseClassesLoading[dbname];

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'auth'
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    memo: '',
    groups: [],
    members: [],
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAvailable, setSelectedAvailable] = useState(null);
  const [selectedInTarget, setSelectedInTarget] = useState(null); // { item, target }
  
  // Resource Authorization States
  const [selectedObjectId, setSelectedObjectId] = useState('');
  const [objectSearchTerm, setObjectSearchTerm] = useState('');
  const [objectAuths, setObjectAuths] = useState({});

  useEffect(() => {
    if (isOpen && dbname && selectedHostUid) {
      dispatch(fetchDatabaseUsers({ hostUid: selectedHostUid, dbname }));
    }
    // Auto-populate PUBLIC if it exists in data
    if (isOpen && databaseUsers.length > 0) {
      const publicGroup = databaseUsers.find(u => u.name === 'PUBLIC');
      if (publicGroup && !formData.groups.some(g => g.name === 'PUBLIC')) {
        setFormData(prev => ({
          ...prev,
          groups: [...prev.groups, publicGroup]
        }));
      }
    }
    
    // Fetch real object data for auth tab
    if (isOpen && dbname && selectedHostUid) {
      const dbstatus = activeDatabases.includes(dbname) ? 'on' : 'off';
      dispatch(fetchDatabaseClasses({ hostUid: selectedHostUid, dbname, dbstatus }));
    }

    // If editing, find the user and populate form
    if (isOpen && isEditMode && databaseUsers.length > 0) {
      const userToEdit = databaseUsers.find(u => (u.name || u) === editingUser);
      if (userToEdit) {
        setFormData({
          name: userToEdit.name || userToEdit,
          password: '', // Don't show password
          confirmPassword: '',
          memo: userToEdit.comment || '',
          groups: userToEdit.groups || [],
          members: userToEdit.members || [],
        });
        
        // If the user has authorizations, populate objectAuths
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
      // Reset form for create mode
      setFormData({
        name: '',
        password: '',
        confirmPassword: '',
        memo: '',
        groups: [],
        members: [],
      });
    }
  }, [isOpen, dbname, selectedHostUid, dispatch, databaseUsers.length, activeDatabases, isEditMode, editingUser]);

  useEffect(() => {
    if (currentDbClasses && !selectedObjectId) {
      const firstUserClass = currentDbClasses.userclass?.[0]?.class?.[0]?.classname;
      const firstSysClass = currentDbClasses.systemclass?.[0]?.class?.[0]?.classname;
      const firstClass = firstUserClass || firstSysClass;
      if (firstClass) setSelectedObjectId(firstClass);
    }
  }, [currentDbClasses, selectedObjectId]);

  // Force General tab for DBA user
  useEffect(() => {
    if (editingUser === 'DBA' && activeTab !== 'general') {
      setActiveTab('general');
    }
  }, [editingUser, activeTab]);

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
        setFormData(prev => ({
          ...prev,
          groups: [...prev.groups, item],
          members: prev.members.filter(m => m.name !== item.name)
        }));
      }
    } else if (target === 'members') {
      if (!formData.members.some(m => m.name === item.name)) {
        setFormData(prev => ({
          ...prev,
          members: [...prev.members, item],
          groups: prev.groups.filter(g => g.name !== item.name)
        }));
      }
    } else if (target === 'available') {
      setFormData(prev => ({
        ...prev,
        groups: prev.groups.filter(g => g.name !== item.name),
        members: prev.members.filter(m => m.name !== item.name)
      }));
    }
    
    // Clear selections
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
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter(i => i.name !== name)
    }));
  };

  const handleSelectAll = (objId) => {
    const allTrue = {
      Select: true, Insert: true, Update: true, Delete: true,
      Alter: true, Index: true, Execute: true,
      'G.Select': true, 'G.Insert': true, 'G.Update': true, 'G.Delete': true,
      'G.Alter': true, 'G.Index': true, 'G.Execute': true
    };
    setObjectAuths(prev => ({ ...prev, [objId]: allTrue }));
  };

  const handleClearAll = (objId) => {
    const allFalse = {
      Select: false, Insert: false, Update: false, Delete: false,
      Alter: false, Index: false, Execute: false,
      'G.Select': false, 'G.Insert': false, 'G.Update': false, 'G.Delete': false,
      'G.Alter': false, 'G.Index': false, 'G.Execute': false
    };
    setObjectAuths(prev => ({ ...prev, [objId]: allFalse }));
  };

  const handleClearError = () => {
    dispatch(clearUserError());
  };

  const handleClose = () => {
    handleClearError();
    onClose();
  };

  const handleSave = () => {
    if (!formData.name) return;

    // Format authorizations as a list of objects for the API
    const authList = Object.keys(objectAuths).map(objId => ({
      classname: objId,
      auth: encodeCUBRIDAuth(objectAuths[objId])
    }));

    if (isEditMode) {
      const updatePayload = {
        userpass: formData.password,
        groups: {
          group: formData.groups.map(g => g.name || g)
        },
        authorization: authList
      };

      dispatch(updateDatabaseUser({ 
        hostUid: selectedHostUid, 
        dbname, 
        userName: editingUser, 
        payload: updatePayload 
      })).unwrap().then(() => {
        dispatch(fetchDatabaseUsers({ hostUid: selectedHostUid, dbname }));
      });
    } else {
      const createPayload = {
        username: formData.name,
        userpass: formData.password,
        groups: { group: formData.groups.map(g => g.name || g) },
        authorization: authList
      };

      dispatch(createDatabaseUser({ 
        hostUid: selectedHostUid, 
        dbname, 
        payload: createPayload 
      })).unwrap().then(() => {
        dispatch(fetchDatabaseUsers({ hostUid: selectedHostUid, dbname }));
      });
    }
    // Note: unwrap().then() closing of modal is handled by the slice if needed, 
    // but usually it's better to keep it open if there's an error.
    // The slice currently closes it on fulfilled.
  };

  // Filter available users (exclude ones already in groups or members)
  const availableUsers = databaseUsers
    .filter(u => 
      !formData.groups.some(g => g.name === u.name) && 
      !formData.members.some(m => m.name === u.name)
    )
    .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const footer = (
    <>
      <Button 
        variant="ghost" 
        onClick={handleClose}
      >
        Discard
      </Button>
      <Button 
        onClick={handleSave}
        loading={actionLoading}
        icon="check_circle"
        className="min-w-[140px]"
      >
        {isEditMode ? 'Update Account' : 'Create Account'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Update database user' : 'Create database user'}
      subtitle={`Target Database: ${dbname}`}
      icon={isEditMode ? 'manage_accounts' : 'person_add'}
      maxWidth="max-w-[840px]"
      footer={footer}
      loading={actionLoading}
      error={userError}
      onErrorClose={handleClearError}
      onErrorRetry={handleSave}
    >
      <div className="flex flex-col h-[520px]">
        {/* Tabs */}
        <div className="flex gap-8 border-b border-slate-100 dark:border-white/5 mb-6">
          <button 
            onClick={() => setActiveTab('general')}
            className={`pb-3 text-[11px] font-bold uppercase tracking-wider relative transition-all ${activeTab === 'general' ? 'text-bk-yellow' : 'text-slate-400 hover:text-slate-600'}`}
          >
            General identification
            {activeTab === 'general' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-bk-yellow shadow-[0_0_8px_rgba(255,215,0,0.4)]"></div>}
          </button>
          {editingUser !== 'DBA' && (
            <button 
              onClick={() => setActiveTab('auth')}
              className={`pb-3 text-[11px] font-bold uppercase tracking-wider relative transition-all ${activeTab === 'auth' ? 'text-bk-yellow' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Resource authorization
              {activeTab === 'auth' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-bk-yellow shadow-[0_0_8px_rgba(255,215,0,0.4)]"></div>}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          {activeTab === 'general' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-1 duration-200 pb-4">
              {/* Basic Identity section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Typography variant="caption" className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Basic Identity</Typography>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-white/5"></div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <Input 
                    label="User name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. cubrid_admin"
                    disabled={isEditMode}
                    required
                  />
                  <Input 
                    label="User description/memo"
                    name="memo"
                    value={formData.memo}
                    onChange={handleInputChange}
                    placeholder="Account purpose"
                  />
                </div>
              </div>

              {/* Password Setting section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Typography variant="caption" className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Security Configuration</Typography>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-white/5"></div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <Input 
                    label="Primary password"
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                  />
                  <Input 
                    label="Verify password"
                    type="password" 
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Advanced Group Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Typography variant="caption" className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Group & Role Configuration</Typography>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-white/5"></div>
                </div>
                
                <div className="grid grid-cols-12 gap-0 h-[320px] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden bg-white/50 dark:bg-bk-side/50 shadow-xs backdrop-blur-xs">
                  {/* Panel 1: All Users */}
                  <div 
                    className="col-span-5 flex flex-col border-r border-slate-100 dark:border-white/5"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'available')}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-bk-main/20">
                      <Typography variant="caption" className="font-bold text-slate-500 uppercase tracking-wider">All users</Typography>
                    </div>
                    <div className="p-2 border-b border-slate-50 dark:border-white/5">
                      <SearchInput 
                        placeholder="Search..." 
                        value={searchTerm}
                        onChange={setSearchTerm}
                        onClear={() => setSearchTerm('')}
                        size="sm"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar space-y-1">
                      {loading ? (
                        <div className="h-full flex items-center justify-center opacity-30">
                          <Icon name="refresh" size="sm" className="animate-spin text-bk-yellow" />
                        </div>
                      ) : availableUsers.length > 0 ? (
                        availableUsers.map(user => (
                          <div 
                            key={user.name}
                            draggable
                            onDragStart={(e) => handleDragStart(e, user, 'available')}
                            onClick={() => {
                              setSelectedAvailable(user);
                              setSelectedInTarget(null);
                            }}
                            onDoubleClick={() => handleMove(user, 'available', 'groups')}
                            className={`px-3 py-2 text-[11px] font-bold rounded-xl cursor-grab active:cursor-grabbing transition-all flex items-center justify-between group/item ${draggedItem?.item?.name === user.name ? 'opacity-40 select-none' : ''} ${selectedAvailable?.name === user.name ? 'bg-bk-yellow text-bk-side shadow-md' : 'text-slate-700 dark:text-slate-300 hover:bg-bk-yellow/10'}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon name={user.name === 'PUBLIC' || user.members ? 'groups' : 'person'} size="sm" className={selectedAvailable?.name === user.name ? 'text-bk-side' : 'text-slate-400'} />
                              <span className="tracking-tight">{user.name}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 py-8">
                           <Typography variant="caption">Empty</Typography>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle: Control Buttons */}
                  <div className="col-span-1 flex flex-col items-center justify-center gap-3 bg-slate-50/30 dark:bg-white/2 border-r border-slate-100 dark:border-white/5">
                     <button 
                        onClick={() => handleMove(selectedAvailable, 'available', 'groups')}
                        disabled={!selectedAvailable}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all active:scale-90 ${selectedAvailable ? 'text-bk-yellow bg-bk-yellow/10 border border-bk-yellow/30 hover:bg-bk-yellow hover:text-bk-side shadow-lg shadow-bk-yellow/20' : 'text-slate-300 opacity-20 cursor-not-allowed'}`}
                     >
                        <Icon name="chevron_right" size="sm" />
                     </button>
                     <button 
                        onClick={() => handleMove(selectedInTarget?.item, selectedInTarget?.target, 'available')}
                        disabled={!selectedInTarget}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all active:scale-90 ${selectedInTarget ? 'text-bk-yellow bg-bk-yellow/10 border border-bk-yellow/30 hover:bg-bk-yellow hover:text-bk-side shadow-lg shadow-bk-yellow/20' : 'text-slate-300 opacity-20 cursor-not-allowed'}`}
                     >
                        <Icon name="chevron_left" size="sm" />
                     </button>
                  </div>

                  {/* Right Column: Targets */}
                  <div className="col-span-6 flex flex-col bg-white/50 dark:bg-bk-main/10">
                    <div 
                      className={`flex-1 flex flex-col border-b border-slate-100 dark:border-white/5 transition-colors ${draggedItem?.source === 'available' ? 'bg-bk-yellow/5' : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'groups')}
                    >
                      <div className="px-4 py-2.5 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-bk-main/20">
                        <Typography variant="caption" className="font-bold text-slate-500 uppercase tracking-wider">Group list</Typography>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar">
                         {formData.groups.length > 0 ? (
                           <div className="flex flex-wrap gap-2 animate-in fade-in duration-200">
                             {formData.groups.map(group => (
                               <div 
                                 key={group.name} 
                                 draggable
                                 onDragStart={(e) => handleDragStart(e, group, 'groups')}
                                 onClick={() => {
                                   setSelectedInTarget({ item: group, target: 'groups' });
                                   setSelectedAvailable(null);
                                 }}
                                 onDoubleClick={() => handleMove(group, 'groups', 'available')}
                                 className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl border text-[10.5px] font-bold transition-all cursor-grab active:cursor-grabbing ${selectedInTarget?.item?.name === group.name ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' : 'bg-white dark:bg-bk-main/50 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/5'}`}
                               >
                                 <Icon name="groups" size="sm" className={selectedInTarget?.item?.name === group.name ? 'text-white' : 'text-indigo-400'} />
                                 {group.name}
                                 <button 
                                   onClick={() => removeItem(group.name, 'groups')}
                                   className="w-5 h-5 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors ml-1"
                                 >
                                    <Icon name="close" size="xs" />
                                 </button>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="h-full flex flex-col items-center justify-center opacity-10 pointer-events-none">
                              <Icon name="drag_indicator" size="md" className="mb-1" />
                              <Typography variant="caption" className="font-black tracking-widest">DRAG GROUPS HERE</Typography>
                           </div>
                         )}
                      </div>
                    </div>

                    <div 
                      className={`flex-1 flex flex-col transition-colors ${draggedItem?.source === 'available' ? 'bg-bk-yellow/5' : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'members')}
                    >
                      <div className="px-4 py-2.5 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-bk-main/20">
                        <Typography variant="caption" className="font-bold text-slate-500 uppercase tracking-wider">Member list</Typography>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar">
                        {formData.members.length > 0 ? (
                           <div className="flex flex-wrap gap-2 animate-in fade-in duration-200">
                             {formData.members.map(member => (
                               <div 
                                 key={member.name}
                                 draggable
                                 onDragStart={(e) => handleDragStart(e, member, 'members')}
                                 onClick={() => {
                                   setSelectedInTarget({ item: member, target: 'members' });
                                   setSelectedAvailable(null);
                                 }}
                                 onDoubleClick={() => handleMove(member, 'members', 'available')}
                                 className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl border text-[10.5px] font-bold transition-all cursor-grab active:cursor-grabbing ${selectedInTarget?.item?.name === member.name ? 'bg-bk-yellow text-bk-side border-bk-yellow shadow-md' : 'bg-white dark:bg-bk-main/50 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-bk-yellow/50 hover:bg-bk-yellow/5'}`}
                               >
                                 <Icon name="person" size="sm" className={selectedInTarget?.item?.name === member.name ? 'text-bk-side' : 'text-bk-yellow'} />
                                 {member.name}
                                 <button 
                                   onClick={() => removeItem(member.name, 'members')}
                                   className="w-5 h-5 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors ml-1"
                                 >
                                    <Icon name="close" size="xs" />
                                 </button>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="h-full flex flex-col items-center justify-center opacity-10 pointer-events-none">
                              <Icon name="drag_indicator" size="md" className="mb-1" />
                              <Typography variant="caption" className="font-black tracking-widest">DRAG MEMBERS HERE</Typography>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-1 duration-200 h-full flex flex-col pb-4">
              <div className="flex bg-white/50 dark:bg-bk-side/50 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden flex-1 shadow-xs backdrop-blur-xs">
                
                {/* Auth: Object List */}
                <div className="w-[240px] border-r border-slate-200 dark:border-white/5 flex flex-col">
                  <div className="p-3 border-b border-slate-100 dark:border-white/5">
                    <SearchInput 
                      placeholder="Search objects..." 
                      value={objectSearchTerm}
                      onChange={setObjectSearchTerm}
                      onClear={() => setObjectSearchTerm('')}
                      size="sm"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-slate-50/30 dark:bg-transparent">
                    {isClassesLoading ? (
                      <div className="py-10 text-center opacity-20">
                        <Icon name="refresh" size="sm" className="animate-spin mx-auto mb-2" />
                        <Typography variant="caption" className="font-bold">LOADING...</Typography>
                      </div>
                    ) : (
                      (() => {
                        const systemClasses = currentDbClasses?.systemclass?.[0]?.class?.map(c => ({ name: c.classname, type: 'system' })) || [];
                        const userClasses = currentDbClasses?.userclass?.[0]?.class?.map(c => ({ name: c.classname, type: 'user' })) || [];
                        const allObjects = [...userClasses, ...systemClasses].filter(o => o.name.toLowerCase().includes(objectSearchTerm.toLowerCase()));

                        if (allObjects.length === 0) return <div className="text-center py-10 opacity-20"><Typography variant="caption" className="font-bold">NO OBJECTS</Typography></div>;

                        return allObjects.map(obj => (
                          <button 
                            key={obj.name}
                            onClick={() => setSelectedObjectId(obj.name)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${selectedObjectId === obj.name ? 'bg-bk-yellow text-bk-side shadow-lg' : 'text-slate-500 hover:bg-bk-yellow/10 hover:text-bk-yellow'}`}
                          >
                            <Icon 
                              name={obj.type === 'system' ? 'settings_suggest' : 'table_chart'} 
                              size="sm" 
                              className={selectedObjectId === obj.name ? 'text-bk-side' : 'text-indigo-400/50 group-hover:text-bk-yellow/50'} 
                            />
                            <span className="text-[10px] font-bold tracking-tight truncate">{obj.name}</span>
                          </button>
                        ));
                      })()
                    )}
                  </div>
                </div>

                {/* Auth: Details */}
                <div className="flex-1 flex flex-col bg-slate-50/10 dark:bg-white/2 overflow-y-auto custom-scrollbar">
                  <div className="p-6 space-y-8">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-bk-yellow/10 flex items-center justify-center border border-bk-yellow/20">
                          <Icon name="shield_lock" size="md" className="text-bk-yellow" />
                        </div>
                        <div>
                          <Typography variant="p" className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{selectedObjectId}</Typography>
                          <Typography variant="caption" className="text-slate-400 font-medium">Individual access mask configuration</Typography>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <Button variant="ghost" size="sm" onClick={() => handleSelectAll(selectedObjectId)}>All</Button>
                         <Button variant="ghost" size="sm" onClick={() => handleClearAll(selectedObjectId)}>Clear</Button>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Data Group */}
                      <div className="space-y-4">
                         <div className="flex items-center gap-3">
                            <Typography variant="caption" className="font-black uppercase text-blue-500 tracking-widest pl-1">Data Operations</Typography>
                            <div className="flex-1 h-px bg-blue-500/10"></div>
                         </div>
                         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {['Select', 'Insert', 'Update', 'Delete'].map(perm => {
                              const isActive = objectAuths[selectedObjectId]?.[perm];
                              return (
                                <button 
                                  key={perm} 
                                  onClick={() => togglePermission(selectedObjectId, perm)}
                                  className={`p-3.5 rounded-2xl border text-left transition-all ${isActive ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white dark:bg-bk-main/40 border-slate-200 dark:border-white/5 opacity-60 hover:opacity-100 hover:border-blue-500/20'}`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>{perm}</span>
                                  </div>
                                  <span className="text-[8px] text-slate-400 font-bold leading-tight block">Capability to {perm.toLowerCase()} records</span>
                                </button>
                              );
                            })}
                         </div>
                      </div>

                      {/* Schema Group */}
                      <div className="space-y-4">
                         <div className="flex items-center gap-3">
                            <Typography variant="caption" className="font-black uppercase text-amber-500 tracking-widest pl-1">Structure Control</Typography>
                            <div className="flex-1 h-px bg-amber-500/20"></div>
                         </div>
                         <div className="grid grid-cols-3 gap-4">
                            {['Alter', 'Index', 'Execute'].map(perm => {
                              const isActive = objectAuths[selectedObjectId]?.[perm];
                              return (
                                <button 
                                  key={perm} 
                                  onClick={() => togglePermission(selectedObjectId, perm)}
                                  className={`p-3.5 rounded-2xl border text-left transition-all ${isActive ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white dark:bg-bk-main/40 border-slate-200 dark:border-white/5 opacity-60 hover:opacity-100 hover:border-amber-500/20'}`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${isActive ? 'text-amber-500' : 'text-slate-400'}`}>{perm}</span>
                                  </div>
                                  <span className="text-[8px] text-slate-400 font-bold">{perm === 'Execute' ? 'Procedure calls' : `Table ${perm.toLowerCase()}`}</span>
                                </button>
                              );
                            })}
                         </div>
                      </div>

                      {/* Delegation */}
                      <div className="space-y-4">
                         <div className="flex items-center gap-3">
                            <Typography variant="caption" className="font-black uppercase text-indigo-500 tracking-widest pl-1">Delegation (Grant Rights)</Typography>
                            <div className="flex-1 h-px bg-indigo-500/20"></div>
                         </div>
                         <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {['G.Select', 'G.Insert', 'G.Update', 'G.Delete', 'G.Alter', 'G.Index', 'G.Execute'].map(perm => {
                              const isActive = objectAuths[selectedObjectId]?.[perm];
                              return (
                                <button 
                                  key={perm} 
                                  onClick={() => togglePermission(selectedObjectId, perm)}
                                  className={`px-3 py-2 rounded-xl border flex items-center justify-center transition-all ${isActive ? 'bg-indigo-500/10 border-indigo-500/30 font-black' : 'bg-white dark:bg-bk-main/40 border-slate-200 dark:border-white/5 opacity-40 hover:opacity-100'}`}
                                >
                                  <span className={`text-[9px] font-black uppercase ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>{perm}</span>
                                </button>
                              );
                            })}
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
