import { createContext } from 'react';
import type { User } from '../types';

export interface AuthContextType {
  user: User | null;
  handleLogin: (userData: User) => void;
  handleDemo: () => Promise<void>;
  handleLogout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
