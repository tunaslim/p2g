'use client';
import { useEffect } from 'react';
import styles from '../page.module.css';
import { useToken } from '../context/TokenContext';
import { useRouter } from 'next/navigation';

const STATIC_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozNX0.084KR0971FDK-lzvkKh8yIE3CnrvP4SPwujB6Toh0UE";

export default function SettingsPage() {
  const { token, setToken } = useToken();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.push('/despatch-ready-orders');
    }
  }, [token, router]);

  const handleUseStaticToken = (e: React.FormEvent) => {
    e.preventDefault();
    setToken(STATIC_TOKEN);
  };

  return (
    <div className={styles.main}>
      <h1 className={styles.title}>Settings</h1>
      <form onSubmit={handleUseStaticToken}>
        <button type="submit" className={styles.primaryButton}>
          Use Static Helm Token
        </button>
      </form>
    </div>
  );
}
