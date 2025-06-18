'use client';
import Link from 'next/link';
import './globals.css';
import { TokenProvider, useToken } from './context/TokenContext';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';

function Navigation() {
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
        {!token && (
          <Link href="/settings" className={styles.navLink}>Settings</Link>
        )}
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

export const metadata = {
  title: 'Parcel2Go Integration',
  description: 'Get shipping quotes and labels easily',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TokenProvider>
          <Navigation />
          <main className={styles.main}>{children}</main>
        </TokenProvider>
      </body>
    </html>
  );
}
