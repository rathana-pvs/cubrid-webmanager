import { useEffect, useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { logout, fetchUser } from '../../auth/authSlice';
import { fetchPreferences } from '../../user/userSlice';
import UserProfileModal from '../../user/components/UserProfileModal';
import { showStatusModal } from '../layoutSlice';
import { fetchDatabaseStartInfo, startDatabase } from '../../database/databaseSlice';
import { fetchBrokerList, startBroker } from '../../broker/brokerSlice';
import { setAboutCubrid } from '../appBarSlice';
import { Icon } from '../../../components/ds/foundation/Icon';
import AboutModal from './AboutModal';
import HeaderMenu from './HeaderMenu';

export default function Header({ theme, toggleTheme }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading: authLoading, error: authError } = useSelector((state) => state.auth, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  const { selectedDatabase, activeDatabases } = useSelector((state) => state.database, shallowEqual);
  const { selectedBroker, brokers } = useSelector((state) => state.broker, shallowEqual);

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchUser());
      dispatch(fetchPreferences());
    }
  }, [dispatch, isAuthenticated, user]);

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/login';
  };

  const handleStart = () => {
    if (selectedDatabase && !activeDatabases.includes(selectedDatabase)) {
      dispatch(startDatabase({ hostUid: selectedHostUid, dbname: selectedDatabase }))
        .unwrap()
        .then(() => dispatch(fetchDatabaseStartInfo(selectedHostUid)))
        .catch(err => dispatch(showStatusModal({ type: 'error', title: 'Start Failed', message: err })));
    } else if (selectedBroker) {
      const broker = brokers.find(b => b.name === selectedBroker);
      if (broker && broker.state !== 'ON') {
        dispatch(startBroker({ hostUid: selectedHostUid, brokerName: selectedBroker }))
          .unwrap()
          .then(() => dispatch(fetchBrokerList(selectedHostUid)))
          .catch(err => dispatch(showStatusModal({ type: 'error', title: 'Start Failed', message: err })));
      }
    }
  };

  /* ── icon button shared style ── */
  const btnBase = "h-8 flex items-center justify-center rounded-sm border transition-all active:scale-[0.98]";
  const iconBtn = `${btnBase} w-8 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/6 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200`;

  return (
    <>
      <header className="bg-white dark:bg-background-dark border-b border-slate-100 dark:border-white/6 h-14 flex items-center justify-between px-6 z-40 shrink-0 select-none">

        {/* ── Left: logo + menus + quick actions ── */}
        <div className="flex items-center gap-1">
          {/* Dropdown menus */}
          <HeaderMenu />

          <div className="w-px h-5 bg-slate-200 dark:bg-white/8 mx-3" />

          {/* Quick action: Start */}
          <button
            className={`${btnBase} px-3 gap-2 bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/30 font-bold text-[11px] uppercase tracking-wider`}
            title="Start selected database / broker"
            onClick={handleStart}
          >
            <Icon name="play_arrow" size="18px" weight={400} className="text-amber-500" />
            Start
          </button>
        </div>

        {/* ── Right: theme toggle + user + logout ── */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            className={iconBtn}
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            <Icon name={theme === 'light' ? 'dark_mode' : 'light_mode'} size="18px" weight={300} />
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-white/8 mx-1" />

          {/* User profile pill */}
          <button
            className={`${btnBase} px-2 gap-2 bg-slate-100 dark:bg-white/4 border-slate-200 dark:border-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/8 group min-w-[120px] justify-between`}
            onClick={() => setIsProfileOpen(true)}
          >
            {authLoading ? (
              <div className="flex items-center gap-2 w-full justify-center">
                <div className="h-3 w-16 bg-slate-200 dark:bg-white/10 rounded-sm animate-pulse" />
                <div className="w-6 h-6 rounded-sm bg-slate-200 dark:bg-white/10 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="w-6 h-6 rounded-sm bg-amber-500 shadow-xs shadow-amber-500/20 flex items-center justify-center shrink-0">
                  <Icon
                    name={authError ? 'error' : 'person'}
                    size="16px"
                    weight={400}
                    className={authError ? 'text-white' : 'text-bk-side'}
                  />
                </div>
                <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 tracking-tight flex-1 text-left px-1 truncate">
                  {user?.id || 'Admin'}
                </span>
                <Icon name="expand_more" size="14px" className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
              </>
            )}
          </button>

          {/* Logout */}
          <button
            className={`${btnBase} w-8 bg-rose-500/5 border-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500`}
            onClick={handleLogout}
            title="Logout"
          >
            <Icon name="logout" size="18px" weight={300} />
          </button>
        </div>
      </header>

      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <AboutModal />
    </>
  );
}
