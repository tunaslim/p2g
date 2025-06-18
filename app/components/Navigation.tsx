'use client';
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
        <Link href="/" className={styles.navLink}>Home</Link>
        {!token && <Link href="/settings" className={styles.navLink}>Settings</Link>}
        {token && (
          <>
            <Link href="/despatch-ready-orders" className={styles.navLink}>Despatch Ready Orders</Link>
            <button
              onClick={handleLogout}
              className={styles.navLink}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              Logout
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
