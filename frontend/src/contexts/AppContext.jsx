import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { t as translate } from '../i18n/translations';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('suraksha_lang') || 'en');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSOSCount, setPendingSOSCount] = useState(0);
  const [backendOnline, setBackendOnline] = useState(null);

  // Rescue auth state — read from localStorage on mount
  const [rescueUser, setRescueUserState] = useState(() => {
    try {
      const stored = localStorage.getItem('suraksha_rescue_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isRescueAuthenticated = !!rescueUser;

  const setRescueUser = useCallback((user) => {
    setRescueUserState(user);
    if (user) {
      localStorage.setItem('suraksha_rescue_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('suraksha_rescue_user');
      localStorage.removeItem('suraksha_rescue_token');
    }
  }, []);

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem('suraksha_lang', l);
  };

  const tr = (path) => translate(lang, path);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for auto-logout events (triggered by 401 interceptor)
  useEffect(() => {
    const handleAutoLogout = () => {
      setRescueUser(null);
    };
    window.addEventListener('suraksha_logout', handleAutoLogout);
    return () => window.removeEventListener('suraksha_logout', handleAutoLogout);
  }, [setRescueUser]);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        isOnline,
        tr,
        pendingSOSCount,
        setPendingSOSCount,
        backendOnline,
        setBackendOnline,
        rescueUser,
        setRescueUser,
        isRescueAuthenticated,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
