import { useEffect, useState } from 'react';

const STORAGE_KEY = 'umtalagent.onboarded';

/**
 * Uygulama ilk kez aciliyorsa veya sistem sifirlandiktan sonra onboarding goster.
 */
export function useFirstRun() {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY) !== '1';
  });

  useEffect(() => {
    if (!showOnboarding && typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, '1');
    }
  }, [showOnboarding]);

  const complete = () => setShowOnboarding(false);
  const reset = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setShowOnboarding(true);
  };

  return { showOnboarding, complete, reset };
}