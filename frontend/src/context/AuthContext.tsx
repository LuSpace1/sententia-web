import { useState, useCallback, type ReactNode } from 'react';
import { authService } from '../services/api';
import { AuthContext } from './AuthContextData';
import type { User } from '../types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      try {
        return JSON.parse(raw) as User;
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleLogin = useCallback((userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const handleDemo = useCallback(async () => {
    const { data } = await authService.demoLogin();
    const demoData: User = {
      ...data,
      username: data.username || 'Invitado',
    };
    localStorage.setItem('user', JSON.stringify(demoData));
    setUser(demoData);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, handleLogin, handleDemo, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}
