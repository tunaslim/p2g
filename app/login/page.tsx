'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('/api/helm/login', { email, password, '2fa_code': null });
      const token = response.data.token; // Adjust field as per your API

      if (!token) {
        setError('Login failed: No token returned');
        return;
      }

      localStorage.setItem('helmToken', token);

      // Redirect to orders page after login
      router.push('/orders');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    }
  }

  return (
    <main>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  );
}
