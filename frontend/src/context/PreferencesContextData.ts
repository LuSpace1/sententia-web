import { createContext } from 'react';
import type { UserPreferences } from '../types';

export type PreferenceKey = keyof UserPreferences;

export interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreference: <K extends PreferenceKey>(key: K, value: UserPreferences[K]) => void;
  resetPreferences: () => void;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultPracticeArea: '',
  maxHistoryTurns: 8,
  citationsEnabled: true,
};

export const PreferencesContext = createContext<PreferencesContextType | null>(null);
