'use client';
import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import axios from 'axios';
import { useToken } from '../context/TokenContext';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { token, setToken } = useToken();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.push('/despatch-ready-orders');
    }
  }, [token, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setToken('');

    try {
      const response = await axios.post('app/api/helm-login', {
        email,
        password,
      });

      console.log(response.data);

      setToken(response.data.token);
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

        <button type="submit" className={styles.primaryButton}>Login to Helm</button>
      </form>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
