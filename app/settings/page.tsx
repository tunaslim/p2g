'use client';
import { useState } from 'react';
import styles from '../page.module.css';
import axios from 'axios';

export default function SettingsPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setToken('');

    try {
      const response = await axios.post('https://goodlife.myhelm.app/public-api/auth/login', {
        email,
        password,
      });

      setToken(response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
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
