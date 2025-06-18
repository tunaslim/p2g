'use client';
import { createContext, useContext, useState } from 'react';

interface TokenContextType {
  token: string;
  setToken: (token: string) => void;
}

const TokenContext = createContext<TokenContextType>({
  token: '',
  setToken: () => {},
});

export const TokenProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState('');

  return (
    <TokenContext.Provider value={{ token, setToken }}>
      {children}
    </TokenContext.Provider>
  );
};

export const useToken = () => useContext(TokenContext);
