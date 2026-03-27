import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeAddQueryPlanModal, setAutoExecQuery } from '../databaseSlice';
import { showStatusModal } from '../../layout/layoutSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Typography } from '../../../components/ds/foundation/Typography';

const CustomSelect = ({ value, options, onChange, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50/50 dark:bg-bk-main/20 border border-slate-100 dark:border-white/5 rounded-sm px-3 text-[12px] text-slate-900 dark:text-white flex items-center justify-between hover:border-bk-yellow/50 transition-all font-medium h-9"
      >
        <span className="flex items-center gap-2">
          {icon && <Icon name={icon} size="sm" weight={300} className="text-slate-400" />}
          {selectedOption ? selectedOption.label : 'Select...'}
        </span>
        <span className={`material-symbols-outlined text-slate-400 text-lg transition-transform duration-200 ${isOpen ? 'rotate-180 text-bk-yellow' : ''}`}>expand_more</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-250 bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[300px] overflow-y-auto custom-scrollbar">
          <div className="py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-[12px] font-medium transition-all flex items-center justify-between group ${
                  value === opt.value 
                    ? 'bg-bk-yellow/10 text-bk-yellow' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <span>{opt.label}</span>
                {value === opt.value && (
                  <Icon name="check_circle" size="sm" weight={300} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function AddQueryPlanModal() {
  const dispatch = useDispatch();
  const { isAddQueryPlanModalOpen, selectedDatabase, loading, error } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const [formData, setFormData] = useState({
    queryId: '',
    username: 'public',
    password: '',
    periodType: 'DAY', // MONTH, WEEK, DAY
    periodDetail: [],
    backupTime: '12:00',
    queryString: ''
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    if (isAddQueryPlanModalOpen && selectedDatabase) {
      setFormData(prev => ({
        ...prev,
        queryId: `query_${selectedDatabase}_${Date.now().toString().slice(-4)}`
      }));
    }
  }, [isAddQueryPlanModalOpen, selectedDatabase]);

  if (!isAddQueryPlanModalOpen) return null;

  const handleInputChange = (field, value) => {
    if (field === 'periodType') {
      setFormData(prev => ({ 
        ...prev, 
        periodType: value,
        periodDetail: value === 'DAY' ? [] : (value === 'DATE' ? new Date().toISOString().split('T')[0] : [1])
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      periodDetail: prev.periodDetail.includes(day)
        ? prev.periodDetail.filter(d => d !== day)
        : [...prev.periodDetail, day]
    }));
  };

  const handleSave = () => {
    if (!selectedDatabase || !selectedHostUid) return;

    // Formatting detail: "1,2,3 12:00"
    let detail = '';
    if (formData.periodType === 'DAY') {
      detail = formData.backupTime;
    } else if (formData.periodType === 'DATE') {
      detail = `${formData.periodDetail} ${formData.backupTime}`;
    } else {
      detail = `${formData.periodDetail.join(',')} ${formData.backupTime}`;
    }

    const payload = {
      dbname: selectedDatabase,
      planlist: [
        {
          queryplan: [
            {
              query_id: formData.queryId,
              username: formData.username,
              userpass: formData.password,
              period: formData.periodType,
              detail: detail,
              query_string: formData.queryString
            }
          ]
        }
      ]
    };

    dispatch(setAutoExecQuery({ hostUid: selectedHostUid, dbname: selectedDatabase, payload }))
      .unwrap()
      .then(() => {
        dispatch(closeAddQueryPlanModal());
        dispatch(showStatusModal({
          type: 'success',
          title: 'Query Plan Added',
          message: 'Your automated query schedule has been established successfully.'
        }));
      });
  };

  return (
    <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-bk-main/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans text-left">
      <div className="bg-white dark:bg-bk-side w-full max-w-[700px] h-auto max-h-[90vh] rounded-xl shadow-[0_10px_50px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col relative text-left">
        
        {/* ribbon accent */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-bk-yellow via-amber-500 to-bk-yellow z-310"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-bk-main/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bk-yellow/10 flex items-center justify-center border border-bk-yellow/20">
              <Icon name="bolt" size="sm" weight={300} className="text-bk-yellow text-xl" />
            </div>
            <div>
              <Typography variant="h3" className="text-[12px] font-medium text-slate-900 dark:text-white leading-none tracking-wide">Add query plan</Typography>
              <Typography variant="caption" className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Configure automated query execution for <Typography variant="span" className="text-bk-yellow font-medium uppercase">{selectedDatabase}</Typography></Typography>
            </div>
          </div>
          <button 
            onClick={() => dispatch(closeAddQueryPlanModal())}
            className="w-7 h-7 rounded-md hover:bg-slate-200 dark:hover:bg-white/5 transition-all text-slate-400 dark:text-slate-500 flex items-center justify-center group"
          >
            <Icon name="close" size="sm" weight={300} className="text-lg group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar max-h-[70vh] flex-1">
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-200">
               <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                  <Icon name="error" size="sm" weight={300} className="text-2xl font-black" />
               </div>
               <div className="flex-1">
                  <Typography variant="label" className="text-[11px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Submission Failed</Typography>
                  <Typography variant="p" className="text-[12px] font-medium text-rose-600/80 leading-relaxed">{error}</Typography>
               </div>
            </div>
          )}
          
          {/* General Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
               <Typography variant="label" className="text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500 uppercase">General Identification</Typography>
               <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800/50"></div>
            </div>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 space-y-1.5">
                <Typography variant="label" className="text-[10px] font-medium text-slate-500 dark:text-slate-400 ml-0.5 flex items-center h-4">Query ID</Typography>
                <input 
                  type="text" 
                  value={formData.queryId}
                  onChange={(e) => handleInputChange('queryId', e.target.value)}
                  placeholder="e.g. daily_stats_update"
                  className="w-full h-9 px-3 flex items-center bg-slate-50/50 dark:bg-bk-main/20 border border-slate-100 dark:border-white/5 rounded-sm text-[12px] font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-bk-yellow/50 transition-all"
                />
              </div>
              <div className="col-span-6 space-y-1.5">
                <Typography variant="label" className="text-[10px] font-medium text-slate-500 dark:text-slate-400 ml-0.5 flex items-center h-4">DB Username</Typography>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full h-9 px-3 flex items-center bg-slate-50/50 dark:bg-bk-main/20 border border-slate-100 dark:border-white/5 rounded-sm text-[12px] font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-bk-yellow/50 transition-all"
                />
              </div>
              <div className="col-span-6 space-y-1.5">
                <Typography variant="label" className="text-[10px] font-medium text-slate-500 dark:text-slate-400 ml-0.5 flex items-center h-4">DB Password</Typography>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full h-9 px-3 flex items-center bg-slate-50/50 dark:bg-bk-main/20 border border-slate-100 dark:border-white/5 rounded-sm text-[12px] font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-bk-yellow/50 transition-all"
                />
              </div>
            </div>
          </section>

          {/* Schedule Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
               <Typography variant="label" className="text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500 uppercase">Execution Schedule</Typography>
               <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800/50"></div>
            </div>
            
            <div className="bg-slate-50/50 dark:bg-bk-main/20 border border-slate-100 dark:border-white/5 rounded-2xl p-5 space-y-5">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-6 space-y-1.5">
                  <Typography variant="label" className="text-[10px] font-medium text-slate-500 dark:text-slate-400 ml-0.5 flex items-center h-4 gap-2">
                    <Icon name="event_repeat" size="sm" weight={300} />
                    Period type
                  </Typography>
                  <CustomSelect
                    value={formData.periodType}
                    onChange={(val) => handleInputChange('periodType', val)}
                    options={[
                      { value: 'MONTH', label: 'Monthly' },
                      { value: 'WEEK', label: 'Weekly' },
                      { value: 'DAY', label: 'Daily' },
                      { value: 'DATE', label: 'Specific Date' }
                    ]}
                  />
                </div>
                <div className="col-span-6 space-y-1.5">
                  <Typography variant="label" className="text-[10px] font-medium text-slate-500 dark:text-slate-400 ml-0.5 flex items-center h-4 gap-2">
                    <Icon name="schedule" size="sm" weight={300} />
                    Execution time
                  </Typography>
                  <div className="relative">
                    <button 
                      onClick={() => setShowTimePicker(!showTimePicker)}
                      className="w-full h-9 px-3 flex items-center justify-between bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-sm text-[12px] font-medium text-slate-900 dark:text-white hover:border-bk-yellow/50 transition-all"
                    >
                      <span>{formData.backupTime}</span>
                      <Icon name="history_toggle_off" size="sm" weight={300} className="text-bk-yellow text-lg" />
                    </button>

                    {showTimePicker && (
                      <div className="absolute top-full left-0 mt-2 z-210 w-[200px] bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex divide-x divide-slate-100 dark:divide-slate-800 h-[220px]">
                          {/* Hours Column */}
                          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-bk-main/20">
                            <div className="px-2 py-1.5 text-[9px] font-medium text-slate-400 uppercase tracking-widest text-center border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-bk-side z-10">Hr</div>
                            {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => {
                              const currentH = formData.backupTime.split(':')[0];
                              const isSelected = currentH === h;
                              return (
                                <button
                                  key={h}
                                  onClick={() => {
                                    const m = formData.backupTime.split(':')[1];
                                    handleInputChange('backupTime', `${h}:${m}`);
                                  }}
                                  className={`py-2 text-[12px] font-medium transition-all ${isSelected ? 'bg-bk-yellow text-bk-side' : 'text-slate-500 hover:bg-bk-yellow/10 hover:text-bk-yellow'}`}
                                >
                                  {h}
                                </button>
                              );
                            })}
                          </div>
                          {/* Minutes Column */}
                          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                            <div className="px-2 py-1.5 text-[9px] font-medium text-slate-400 uppercase tracking-widest text-center border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-bk-side z-10">Min</div>
                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => {
                              const currentM = formData.backupTime.split(':')[1];
                              const isSelected = currentM === m;
                              if (parseInt(m) % 5 !== 0 && !isSelected) return null;
                              return (
                                <button
                                  key={m}
                                  onClick={() => {
                                    const h = formData.backupTime.split(':')[0];
                                    handleInputChange('backupTime', `${h}:${m}`);
                                    setShowTimePicker(false);
                                  }}
                                  className={`py-2 text-[12px] font-medium transition-all ${isSelected ? 'bg-bk-yellow text-bk-side' : 'text-slate-500 hover:bg-bk-yellow/10 hover:text-bk-yellow'}`}
                                >
                                  {m}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="p-2 bg-slate-50/50 dark:bg-bk-main/50 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                          <button 
                            onClick={() => setShowTimePicker(false)}
                            className="text-[10px] font-medium text-slate-500 uppercase tracking-tight hover:text-bk-yellow transition-colors"
                          >
                            Set Time
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {formData.periodType === 'MONTH' && (
                <div className="space-y-3">
                  <Typography variant="label" className="text-[10px] font-medium text-slate-500 dark:text-slate-400 ml-1">Select Days of Month</Typography>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`h-8 rounded border text-[11px] font-medium transition-all flex items-center justify-center ${
                          formData.periodDetail.includes(day)
                            ? 'bg-bk-yellow border-bk-yellow text-bk-side shadow-lg shadow-bk-yellow/20'
                            : 'bg-white dark:bg-bk-side border-slate-200 dark:border-slate-800 text-slate-500 hover:border-bk-yellow/50 hover:text-bk-yellow'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formData.periodType === 'WEEK' && (
                <div className="space-y-3">
                  <Typography variant="label" className="text-[10px] font-medium text-slate-500 dark:text-slate-400 ml-1">Select Days of Week</Typography>
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                      const val = index + 1;
                      return (
                        <button
                          key={day}
                          onClick={() => toggleDay(val)}
                          className={`h-9 rounded border text-[11px] font-medium transition-all flex items-center justify-center ${
                            formData.periodDetail.includes(val)
                              ? 'bg-bk-yellow border-bk-yellow text-bk-side shadow-lg shadow-bk-yellow/20'
                              : 'bg-white dark:bg-bk-side border-slate-200 dark:border-slate-800 text-slate-500 hover:border-bk-yellow/50 hover:text-bk-yellow'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {formData.periodType === 'DAY' && (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3">
                    <Icon name="check_circle" size="sm" weight={300} className="text-emerald-500 text-lg" />
                    <Typography variant="span" className="text-[12px] font-medium text-emerald-600/80 tracking-tight italic">Query will execute automatically every day at {formData.backupTime}</Typography>
                </div>
              )}

              {formData.periodType === 'DATE' && (
                <div className="bg-slate-50/50 dark:bg-bk-main/20 border border-slate-100 dark:border-white/5 rounded-sm px-5 py-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <Typography variant="label" className="text-[10px] font-medium text-slate-500 dark:text-slate-400 w-12 ">Date:</Typography>
                    <div className="relative flex-1">
                      <button 
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="w-full h-9 px-3 flex items-center justify-between bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-sm text-[12px] font-medium text-slate-900 dark:text-white"
                      >
                        <Typography variant="span">{formData.periodDetail || 'Select date'}</Typography>
                        <Icon name="calendar_today" size="sm" weight={300} className="text-bk-yellow text-lg" />
                      </button>

                      {showCalendar && (
                        <div className="absolute top-full left-0 mt-2 z-200 w-[280px] bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          {/* Calendar Header */}
                          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-bk-main/50 border-b border-slate-100 dark:border-slate-800">
                            <button 
                              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                              className="w-7 h-7 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 flex items-center justify-center text-slate-400 transition-colors"
                            >
                              <Icon name="chevron_left" size="sm" weight={300} className="text-lg" />
                            </button>
                            <Typography variant="span" className="text-[12px] font-medium text-slate-900 dark:text-white tracking-tight">
                              {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </Typography>
                            <button 
                              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                              className="w-7 h-7 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 flex items-center justify-center text-slate-400 transition-colors"
                            >
                              <Icon name="chevron_right" size="sm" weight={300} className="text-lg" />
                            </button>
                          </div>

                          {/* Calendar Body */}
                          <div className="p-3">
                            <div className="grid grid-cols-7 gap-1 mb-2">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                                <div key={day} className="h-7 flex items-center justify-center text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{day}</div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {(() => {
                                const days = [];
                                const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
                                const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
                                const prevMonthDays = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();

                                // Pad start
                                for (let i = firstDay - 1; i >= 0; i--) {
                                  days.push(<div key={`prev-${i}`} className="h-8 flex items-center justify-center text-[11px] text-slate-300 dark:text-slate-600 font-medium opacity-30 cursor-not-allowed">{prevMonthDays - i}</div>);
                                }

                                // Month days
                                for (let i = 1; i <= daysInMonth; i++) {
                                  const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                                  const isSelected = formData.periodDetail === dateStr;
                                  const isToday = new Date().toISOString().split('T')[0] === dateStr;

                                  days.push(
                                    <button
                                      key={i}
                                      onClick={() => {
                                        handleInputChange('periodDetail', dateStr);
                                        setShowCalendar(false);
                                      }}
                                      className={`h-8 w-full rounded-lg text-[11px] font-medium transition-all flex items-center justify-center relative ${
                                        isSelected 
                                          ? 'bg-bk-yellow text-bk-side shadow-lg shadow-bk-yellow/20 -translate-y-px' 
                                          : 'hover:bg-bk-yellow/10 hover:text-bk-yellow text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      {i}
                                      {isToday && !isSelected && (
                                        <div className="absolute bottom-1 w-1 h-1 bg-bk-yellow rounded-full"></div>
                                      )}
                                    </button>
                                  );
                                }
                                return days;
                              })()}
                            </div>
                          </div>
                          
                          {/* Calendar Footer */}
                          <div className="p-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                            <button 
                              onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                handleInputChange('periodDetail', today);
                                setViewDate(new Date());
                                setShowCalendar(false);
                              }}
                              className="text-[10px] font-medium text-bk-yellow px-2 py-1 hover:bg-bk-yellow/5 rounded-md transition-colors"
                            >
                              Today
                            </button>
                            <button 
                              onClick={() => setShowCalendar(false)}
                              className="text-[10px] font-medium text-slate-400 px-2 py-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Typography variant="p" className="text-[10px] text-slate-400 flex items-center gap-1.5 ml-16 leading-relaxed font-medium">
                    <Icon name="stars" size="sm" weight={300} className="text-bk-yellow" />
                    Single execution scheduled for <Typography variant="span" className="text-slate-900 dark:text-slate-200 font-medium decoration-bk-yellow/30 underline underline-offset-4 decoration-2">{formData.periodDetail}</Typography>
                  </Typography>
                </div>
              )}
            </div>
          </section>

          {/* SQL Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
               <Typography variant="label" className="text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500 uppercase">Query Statement</Typography>
               <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800/50"></div>
            </div>
            <div className="space-y-1.5">
               <div className="relative group">
                  <div className="absolute top-3 left-3 flex flex-col gap-1 items-center opacity-40 group-focus-within:opacity-100 transition-opacity">
                    <Icon name="code" size="sm" weight={300} className="text-slate-400 dark:text-slate-500 text-lg" />
                  </div>
                  <textarea 
                    value={formData.queryString}
                    onChange={(e) => handleInputChange('queryString', e.target.value)}
                    placeholder="Enter your SQL query here... e.g. UPDATE stats SET total = total + 1 WHERE id = 1;"
                    className="w-full h-40 pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-bk-main/20 border border-slate-100 dark:border-white/5 rounded-2xl text-[13px] font-mono text-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-bk-yellow/50 transition-all resize-none custom-scrollbar"
                  />
               </div>
               <Typography variant="p" className="text-[10px] text-slate-400 dark:text-slate-500 ml-1 italic font-medium">Tip: Ensure the query is valid and the user has appropriate permissions within the database.</Typography>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-bk-main/80 backdrop-blur-xs flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button 
            disabled={loading}
            className="px-5 py-1.5 text-[11px] font-medium tracking-wide text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 rounded-sm hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-left"
            onClick={() => dispatch(closeAddQueryPlanModal())}
          >
            Discard
          </button>
          <button 
            disabled={loading}
            className="px-6 py-1.5 bg-bk-yellow hover:bg-[#ffd700] active:scale-[0.98] text-bk-side text-[11px] font-medium tracking-wide rounded-sm border border-bk-yellow/50 shadow-xs transition-all flex items-center justify-center gap-2 min-w-[130px] disabled:opacity-50 text-left"
            onClick={handleSave}
          >
            {loading ? (
              <div className="w-3 h-3 border-2 border-bk-side/30 border-t-bk-side rounded-full animate-spin"></div>
            ) : (
              <>
                <Icon name="play_circle" size="sm" weight={300} />
                <span>Run schedule</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
