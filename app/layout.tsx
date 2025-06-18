import './globals.css';
import styles from './page.module.css';
import { TokenProvider } from './context/TokenContext';
import Navigation from './components/Navigation';

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
