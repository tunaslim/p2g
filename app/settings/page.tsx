'use client';
import { useState } from 'react';
import styles from '../page.module.css';
import axios from 'axios';
import { useToken } from '../context/TokenContext';

export default function SettingsPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { token, setToken } = useToken(); // ✅ use context instead of local state

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setToken(''); // this updates context + cookie

    try {
      const response = await axios.post('/api/helm-login', {
        email,
        password,
      });

      setToken(response.data.token); // ✅ updates context + cookie
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className={styles.main}>
      <h1 className={styles.title}>Settings</h1>
      <form onSubmit={handleLogin}>
        <label>
          <strong>Email:</strong>
          <input
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          <strong>Password:</strong>
          <input
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" className={styles.primaryButton}>Login</button>
      </form>

      {token && (
        <div className={styles.description}>
          <p><strong>Token:</strong></p>
          <code style={{ wordBreak: 'break-all' }}>{token}</code>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
