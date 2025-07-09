'use client';
import { useState, useEffect } from 'react';
import styles from '../page.module.css';
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
      const res = await fetch('/api/helm-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          // 2fa_code: null, // Uncomment if required by backend
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      console.log(data); // Debug: see what comes back from backend
      setToken(data.token);
    } catch (err: any) {
      setError(err.message || 'Login failed');
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

        <button type="submit" className={styles.primaryButton}>
          Login to Helm
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
