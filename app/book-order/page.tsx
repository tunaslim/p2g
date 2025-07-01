import dynamic from 'next/dynamic';

// Dynamically load the client component without SSR
const BookOrderPreviewClient = dynamic(
  () => import('./BookOrderPreviewClient'),
  { ssr: false }
);

export default function Page() {
  return <BookOrderPreviewClient />;
}
