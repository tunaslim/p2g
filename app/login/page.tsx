'use client';

import { useState } from 'react';
import { login } from '../../utils/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@despatchcloud.com');
  const [password, setPassword] = useState('secretpassword');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const token = await login(email, password);
      localStorage.setItem('authToken', token);
      router.push('/orders'); // redirect after login success
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: 'auto' }}>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={{ width: '100%', marginBottom: 10 }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        style={{ width: '100%', marginBottom: 10 }}
      />
      <button type="submit" style={{ width: '100%' }}>
        Login
      </button>
    </form>
  );
}
