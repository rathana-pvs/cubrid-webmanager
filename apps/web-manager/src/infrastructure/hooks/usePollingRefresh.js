import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

/**
 * A custom hook to manage background data polling, visibility-aware refresh,
 * and global F5 refresh synchronization for dashboard components.
 * 
 * @param {Object} options
 * @param {string} options.hostUid - The current host UID.
 * @param {string} options.tabId - The exact tab ID to check if this view is active (e.g., `brokers_status:${hostUid}`).
 * @param {number} options.pollingIntervalSeconds - The interval in seconds to poll for updates. Set to 0 to disable.
 * @param {Function} options.onFetch - A function that returns a thunk/promise to fetch the data.
 * 
 * @returns {Object} { isManualRefreshing, lastRefreshed, handleRefresh }
 */
export const usePollingRefresh = ({ hostUid, tabId, pollingIntervalSeconds, onFetch }) => {
  const dispatch = useDispatch();
  
  // We use shallowEqual in your app, but for these simple primitive states, normal selector is fine.
  const { authorizedHosts } = useSelector((state) => state.host);
  const { refreshCounter, activeMainTab } = useSelector((state) => state.layout);

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const [isBrowserVisible, setIsBrowserVisible] = useState(document.visibilityState === 'visible');
  
  // A tab is "truly active" if the browser is visible AND it is the current foreground tab.
  const isTabActive = isBrowserVisible && activeMainTab === tabId;
  
  const isActiveRef = useRef(isTabActive);
  const initialLoadDone = useRef(false);

  // 1. Browser Visibility Listener
  useEffect(() => {
    const handleVisibilityChange = () => setIsBrowserVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleRefresh = useCallback(async (silent = false) => {
    // Only attempt to fetch if the host is authorized
    if (hostUid && authorizedHosts.includes(hostUid)) {
      if (!silent) setIsManualRefreshing(true);
      try {
        const result = await dispatch(onFetch(silent));
        // Safely handle Redux thunk results that have .unwrap()
        if (result && typeof result.unwrap === 'function') {
          await result.unwrap();
        }
        setLastRefreshed(new Date());
      } catch (err) {
        console.error(`Failed to refresh data for ${tabId}:`, err);
      } finally {
        if (!silent) setIsManualRefreshing(false);
      }
    }
  }, [dispatch, hostUid, authorizedHosts, onFetch, tabId]);

  const lastProcessedCounterRef = useRef(refreshCounter);
  // 2. Global Refresh (F5) Listener
  useEffect(() => {
    if (refreshCounter > lastProcessedCounterRef.current) {
      lastProcessedCounterRef.current = refreshCounter;
      if (isTabActive) {
        handleRefresh();
      }
    }
  }, [refreshCounter, handleRefresh, isTabActive]);

  // 3. Initial Load
  useEffect(() => {
    if (hostUid && authorizedHosts.includes(hostUid) && !initialLoadDone.current) {
      initialLoadDone.current = true;
      handleRefresh();
    }
  }, [hostUid, authorizedHosts, handleRefresh]);

  // 4. On Tab Resume
  useEffect(() => {
    const becameActive = !isActiveRef.current && isTabActive;
    isActiveRef.current = isTabActive;
    // If we just switched to this tab, and we've already done the initial load, and polling is enabled: refresh silently.
    if (becameActive && initialLoadDone.current && pollingIntervalSeconds > 0) {
      handleRefresh(true);
    }
  }, [isTabActive, handleRefresh, pollingIntervalSeconds]);

  // 5. Polling Timer
  useEffect(() => {
    if (!isTabActive || pollingIntervalSeconds <= 0) return;
    
    const timer = setInterval(() => {
      // Extra safety check to avoid overlapping fetches if the user spams tabs
      if (isActiveRef.current) {
        handleRefresh(true);
      }
    }, pollingIntervalSeconds * 1000);
    
    return () => clearInterval(timer);
  }, [isTabActive, pollingIntervalSeconds, handleRefresh]);

  return { isManualRefreshing, lastRefreshed, handleRefresh };
};
