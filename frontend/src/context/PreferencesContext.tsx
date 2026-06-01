import { useState, useCallback, type ReactNode } from 'react';
import { PreferencesContext, DEFAULT_PREFERENCES } from './PreferencesContextData';
import type { UserPreferences } from '../types';
import type { PreferenceKey } from './PreferencesContextData';

const STORAGE_KEY = 'sententia-preferences';

function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_PREFERENCES };
}

function savePreferences(prefs: UserPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);

  const updatePreference = useCallback(<K extends PreferenceKey>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => {
      const next = { ...prev, [key]: value };
      savePreferences(next);
      return next;
    });
  }, []);

  const resetPreferences = useCallback(() => {
    const defaults = { ...DEFAULT_PREFERENCES };
    savePreferences(defaults);
    setPreferences(defaults);
  }, []);

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreference, resetPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}
