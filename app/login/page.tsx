'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const response = await axios.post('https://goodlife.myhelm.app/auth/login', {
        email,
        password,
        '2fa_code': null,
      });

      const token = response.data.token;
      localStorage.setItem('helmToken', token);
      router.push('/orders');
    } catch (err) {
      console.error('Full error:', err); // Logs the full error object

      if (axios.isAxiosError(err)) {
        console.error('Axios error details:', err.toJSON()); // Logs Axios error structure
        setError(err.response?.data?.message || err.message || 'Login failed.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed.');
      }
    }
  }

  return (
    <main style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Login to Helm</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ padding: '10px 20px' }}>Login</button>
      </form>
    </main>
  );
}
