'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function login(email: string, password: string): Promise<string> {
    try {
      const response = await axios.post('https://goodlife.myhelm.app/public-api/auth/login', {
        email,
        password,
      });
      const token = response.data.token;
      localStorage.setItem('helmToken', token);
      return token;
    } catch (err) {
      console.error('Login error:', err);
      throw new Error('Failed to login. Please check your credentials.');
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const token = await login(email, password);
      console.log('Logged in with token:', token);
      router.push('/');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  }

  return (
    <main style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Helm Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px' }}>
          Login
        </button>
      </form>
    </main>
  );
}
