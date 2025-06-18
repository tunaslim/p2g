// app/layout.tsx
import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'Parcel2Go Integration',
  description: 'Get shipping quotes and labels easily',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100 text-gray-900">
        <header className="p-4 bg-blue-600 text-white flex justify-between">
          <h1 className="text-xl font-bold">Parcel2Go App</h1>
          <nav className="space-x-4">
            <Link href="/">Home</Link>
            <Link href="/settings">Settings</Link>
          </nav>
        </header>
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}
