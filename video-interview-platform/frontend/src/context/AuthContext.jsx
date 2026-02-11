import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'video_interview_auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.token && data.user) {
          setToken(data.token);
          setUser(data.user);
        }
      } catch (_) {}
    }
    setReady(true);
  }, []);

  const saveAuth = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: newToken, user: newUser }));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = {
    user,
    token,
    ready,
    isUser: user?.role === 'user',
    isAdmin: user?.role === 'admin',
    saveAuth,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
