import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Auto-Update & Deployment Detector Hook
 * Periodically checks for new code deployments pushed to GitHub and automatically
 * refreshes the website with zero manual effort required from the user.
 */

export const CURRENT_BUILD_TIME = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : null;
export const CURRENT_GIT_COMMIT = typeof __APP_GIT_COMMIT__ !== 'undefined' ? __APP_GIT_COMMIT__ : 'local';

export function useAutoUpdate({ onNewVersionDetected = null, enabled = true } = {}) {
  const [isChecking, setIsChecking] = useState(false);
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [latestCommit, setLatestCommit] = useState(CURRENT_GIT_COMMIT);
  const isReloadingRef = useRef(false);

  const checkForUpdates = useCallback(async (isManual = false) => {
    if (isReloadingRef.current) return;

    try {
      setIsChecking(true);
      // Cache-busting fetch to bypass all CDN and browser caches
      const res = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!res.ok) return;

      const data = await res.json();

      if (data && data.buildTime) {
        // Compare with compile-time build timestamp or git commit
        const isDifferentBuild = CURRENT_BUILD_TIME && data.buildTime !== CURRENT_BUILD_TIME;
        const isDifferentCommit = CURRENT_GIT_COMMIT !== 'local' && data.gitCommit && data.gitCommit !== CURRENT_GIT_COMMIT;

        if (isDifferentBuild || isDifferentCommit) {
          console.log(`🚀 New deployment detected! Current: ${CURRENT_GIT_COMMIT} -> Live: ${data.gitCommit}`);
          setHasNewVersion(true);
          setLatestCommit(data.gitCommit || 'latest');
          isReloadingRef.current = true;

          if (typeof onNewVersionDetected === 'function') {
            onNewVersionDetected(data);
          }

          // Auto-refresh smoothly after 1.5 seconds so user sees notification
          setTimeout(() => {
            window.location.reload(true);
          }, 1500);
        } else if (isManual) {
          console.log('✅ Website is on the latest GitHub version:', CURRENT_GIT_COMMIT);
        }
      }
    } catch (err) {
      // Quiet fail if offline or network hiccup
      console.debug('Version check notice:', err.message);
    } finally {
      setIsChecking(false);
    }
  }, [onNewVersionDetected]);

  useEffect(() => {
    if (!enabled) return;

    // Check once shortly after mount (e.g. 5 seconds after initial load)
    const initialTimer = setTimeout(() => {
      checkForUpdates(false);
    }, 5000);

    // Periodically check every 25 seconds for new deployments
    const interval = setInterval(() => {
      if (!document.hidden && !isReloadingRef.current) {
        checkForUpdates(false);
      }
    }, 25000);

    // Also check immediately when user switches back to this tab
    const handleVisibilityChange = () => {
      if (!document.hidden && !isReloadingRef.current) {
        checkForUpdates(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, checkForUpdates]);

  return {
    isChecking,
    hasNewVersion,
    currentCommit: CURRENT_GIT_COMMIT,
    latestCommit,
    checkForUpdates
  };
}
