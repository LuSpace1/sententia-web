import { useContext } from 'react';
import { PreferencesContext } from './PreferencesContextData';

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences debe usarse dentro de un PreferencesProvider');
  }
  return context;
}
