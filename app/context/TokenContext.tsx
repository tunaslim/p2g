'use client';
import { createContext, useContext, useEffect, useState } from 'react';

interface TokenContextType {
  token: string;
  setToken: (token: string) => void;
}

const TokenContext = createContext<TokenContextType>({
  token: '',
  setToken: () => {},
});

export const TokenProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setTokenState] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('helm_token');
    if (savedToken) {
      setTokenState(savedToken);
    }
  }, []);

  const setToken = (newToken: string) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('helm_token', newToken);
    } else {
      localStorage.removeItem('helm_token');
    }
  };

  return (
    <TokenContext.Provider value={{ token, setToken }}>
      {children}
    </TokenContext.Provider>
  );
};

export const useToken = () => useContext(TokenContext);
