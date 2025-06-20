'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToken } from '../context/TokenContext';
import styles from '../page.module.css';

export default function Navigation() {
  const { token, setToken } = useToken();
  const router = useRouter();

  const handleLogout = () => {
    setToken('');
    router.push('/');
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLink}>&#124; Manual Quote &#124;</Link>
        {!token && <Link href="/settings" className={styles.navLink}>Login to Helm &#124;</Link>}
        {token && (
          <>
            <Link href="/despatch-ready-orders" className={styles.navLink}>Despatch Ready Orders &#124;</Link>
            <button onClick={handleLogout} className={styles.navLink}>
              &#124; Logout &#124;
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
